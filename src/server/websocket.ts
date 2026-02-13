/**
 * WebSocket server for agent connections
 *
 * This needs to run alongside the Next.js server.
 * Add this to your server.js or use with a custom Next.js server.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { agentManager } from '@/lib/agents/manager';

export function createWebSocketServer(server: any) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade requests
  server.on('upgrade', async (request: IncomingMessage, socket: any, head: Buffer) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);

    // Only handle /api/agent/ws
    if (url.pathname !== '/api/agent/ws') {
      socket.destroy();
      return;
    }

    // Extract auth from headers
    const authHeader = request.headers['authorization'];
    const agentName = (request.headers['x-agent-name'] as string) || 'unknown';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const apiKey = authHeader.substring(7);

    try {
      // Complete the WebSocket upgrade
      wss.handleUpgrade(request, socket, head, async (ws: WebSocket) => {
        try {
          // Register agent
          await agentManager.registerAgent(ws, apiKey, agentName);
          wss.emit('connection', ws, request);
        } catch (error: any) {
          console.error('Agent registration failed:', error);
          ws.close(1008, error.message);
        }
      });
    } catch (error) {
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });

  console.log('✅ WebSocket server ready for agent connections');

  return wss;
}
