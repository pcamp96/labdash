import { WebSocket } from 'ws';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/crypto';

export interface AgentConnection {
  ws: WebSocket;
  hostId: string;
  name: string;
  lastSeen: Date;
  metadata: any;
}

export interface AgentRequest {
  requestId: string;
  type: string;
  data?: any;
}

export interface AgentResponse {
  requestId: string;
  type: string;
  data?: any;
  error?: string;
}

class AgentManager {
  private agents: Map<string, AgentConnection> = new Map();
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  /**
   * Register a new agent connection
   */
  async registerAgent(ws: WebSocket, apiKey: string, agentName: string) {
    // Verify API key
    const agentKeyRecord = await prisma.agentKey.findUnique({
      where: { key: this.hashApiKey(apiKey), enabled: true },
    });

    if (!agentKeyRecord) {
      throw new Error('Invalid API key');
    }

    // Update last used timestamp
    await prisma.agentKey.update({
      where: { id: agentKeyRecord.id },
      data: { lastUsed: new Date() },
    });

    // Find or create Docker host
    let host = agentKeyRecord.hostId
      ? await prisma.dockerHost.findUnique({ where: { id: agentKeyRecord.hostId } })
      : null;

    if (!host) {
      // Create new host for this agent
      host = await prisma.dockerHost.create({
        data: {
          name: agentName,
          type: 'agent',
          endpoint: `agent://${agentName}`,
          apiKey: encrypt(apiKey),
          enabled: true,
        },
      });

      // Link agent key to host
      await prisma.agentKey.update({
        where: { id: agentKeyRecord.id },
        data: { hostId: host.id },
      });
    }

    // Store connection
    const connection: AgentConnection = {
      ws,
      hostId: host.id,
      name: agentName,
      lastSeen: new Date(),
      metadata: {},
    };

    this.agents.set(host.id, connection);

    // Handle messages from agent
    ws.on('message', (data) => {
      this.handleAgentMessage(host!.id, data);
    });

    ws.on('close', () => {
      this.agents.delete(host!.id);
      console.log(`Agent disconnected: ${agentName} (${host!.id})`);
    });

    console.log(`Agent connected: ${agentName} (${host.id})`);

    return host;
  }

  /**
   * Handle incoming message from agent
   */
  private handleAgentMessage(hostId: string, data: any) {
    try {
      const message = JSON.parse(data.toString());
      const { type, requestId } = message;

      // Update agent metadata
      const connection = this.agents.get(hostId);
      if (connection) {
        connection.lastSeen = new Date();

        if (type === 'register' || type === 'heartbeat') {
          connection.metadata = message.data;

          // Update host in database
          prisma.dockerHost.update({
            where: { id: hostId },
            data: {
              lastSeen: new Date(),
              version: message.data.version,
              metadata: message.data,
            },
          }).catch(console.error);
        }
      }

      // Handle response to pending request
      if (requestId && this.pendingRequests.has(requestId)) {
        const pending = this.pendingRequests.get(requestId)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(requestId);

        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.data);
        }
      }
    } catch (error) {
      console.error('Error handling agent message:', error);
    }
  }

  /**
   * Send request to agent and wait for response
   */
  async sendRequest(hostId: string, type: string, data?: any, timeout = 30000): Promise<any> {
    const connection = this.agents.get(hostId);

    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Agent not connected');
    }

    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Agent request timeout'));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject, timeout: timeoutHandle });

      // Send request
      connection.ws.send(JSON.stringify({ requestId, type, data }));
    });
  }

  /**
   * Check if agent is connected
   */
  isAgentConnected(hostId: string): boolean {
    const connection = this.agents.get(hostId);
    return connection ? connection.ws.readyState === WebSocket.OPEN : false;
  }

  /**
   * Get all connected agents
   */
  getConnectedAgents(): Array<{ hostId: string; name: string; lastSeen: Date; metadata: any }> {
    return Array.from(this.agents.values()).map((conn) => ({
      hostId: conn.hostId,
      name: conn.name,
      lastSeen: conn.lastSeen,
      metadata: conn.metadata,
    }));
  }

  /**
   * Generate new agent API key
   */
  async generateApiKey(name: string, expiresInDays?: number): Promise<{ key: string; id: string }> {
    const key = `labdash_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashApiKey(key);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const agentKey = await prisma.agentKey.create({
      data: {
        name,
        key: hashedKey,
        enabled: true,
        expiresAt,
      },
    });

    return { key, id: agentKey.id };
  }

  /**
   * Hash API key for storage
   */
  private hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Revoke agent API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    await prisma.agentKey.update({
      where: { id: keyId },
      data: { enabled: false },
    });
  }

  /**
   * List all agent keys
   */
  async listApiKeys() {
    return prisma.agentKey.findMany({
      select: {
        id: true,
        name: true,
        enabled: true,
        lastUsed: true,
        createdAt: true,
        expiresAt: true,
        hostId: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// Singleton instance
export const agentManager = new AgentManager();
