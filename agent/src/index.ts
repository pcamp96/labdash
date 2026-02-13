#!/usr/bin/env node

import express from 'express';
import { WebSocket } from 'ws';
import Docker from 'dockerode';
import os from 'os';

// Configuration
const LABDASH_SERVER = process.env.LABDASH_SERVER || 'http://localhost:3000';
const AGENT_KEY = process.env.AGENT_KEY;
const AGENT_NAME = process.env.AGENT_NAME || os.hostname();
const AGENT_PORT = parseInt(process.env.AGENT_PORT || '8888');
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

if (!AGENT_KEY) {
  console.error('❌ Error: AGENT_KEY environment variable is required');
  process.exit(1);
}

// Initialize Docker client
const docker = new Docker({ socketPath: DOCKER_SOCKET });

// Express server for health checks and local API
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agent: AGENT_NAME,
    version: '0.1.0',
    uptime: process.uptime(),
  });
});

// Get container list
app.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list containers' });
  }
});

// Get container stats
app.get('/containers/:id/stats', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const stats = await container.stats({ stream: false });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get container stats' });
  }
});

// Start/stop/restart container
app.post('/containers/:id/:action', async (req, res) => {
  const { id, action } = req.params;

  try {
    const container = docker.getContainer(id);

    switch (action) {
      case 'start':
        await container.start();
        break;
      case 'stop':
        await container.stop();
        break;
      case 'restart':
        await container.restart();
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: `Failed to ${action} container` });
  }
});

// Start Express server
app.listen(AGENT_PORT, () => {
  console.log(`🚀 LabDash Agent listening on port ${AGENT_PORT}`);
});

// WebSocket connection to main server
let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

function connectToServer() {
  const wsUrl = LABDASH_SERVER.replace('http://', 'ws://').replace('https://', 'wss://');

  console.log(`🔌 Connecting to LabDash server: ${wsUrl}/api/agent/ws`);

  ws = new WebSocket(`${wsUrl}/api/agent/ws`, {
    headers: {
      'Authorization': `Bearer ${AGENT_KEY}`,
      'X-Agent-Name': AGENT_NAME,
    },
  });

  ws.on('open', () => {
    console.log('✅ Connected to LabDash server');

    // Send initial registration
    sendRegistration();

    // Start heartbeat
    startHeartbeat();
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleMessage(message);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('⚠️  Disconnected from server. Reconnecting in 5s...');

    // Reconnect after 5 seconds
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(connectToServer, 5000);
  });
}

async function sendRegistration() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const info = await getSystemInfo();

  ws.send(JSON.stringify({
    type: 'register',
    data: {
      name: AGENT_NAME,
      version: '0.1.0',
      ...info,
    },
  }));
}

async function getSystemInfo() {
  try {
    const dockerInfo = await docker.info();

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      docker: {
        version: dockerInfo.ServerVersion,
        containers: dockerInfo.Containers,
        containersRunning: dockerInfo.ContainersRunning,
        containersPaused: dockerInfo.ContainersPaused,
        containersStopped: dockerInfo.ContainersStopped,
        images: dockerInfo.Images,
      },
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
    };
  }
}

function startHeartbeat() {
  setInterval(async () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const info = await getSystemInfo();

    ws.send(JSON.stringify({
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        ...info,
      },
    }));
  }, HEARTBEAT_INTERVAL);
}

async function handleMessage(message: any) {
  const { type, data, requestId } = message;

  let response: any = { requestId, type: `${type}_response` };

  try {
    switch (type) {
      case 'list_containers':
        response.data = await docker.listContainers({ all: data?.all ?? true });
        break;

      case 'get_container':
        const container = docker.getContainer(data.id);
        response.data = await container.inspect();
        break;

      case 'container_stats':
        const statsContainer = docker.getContainer(data.id);
        response.data = await statsContainer.stats({ stream: false });
        break;

      case 'container_logs':
        const logsContainer = docker.getContainer(data.id);
        const logs = await logsContainer.logs({
          stdout: true,
          stderr: true,
          tail: data.tail || 100,
          timestamps: true,
        });
        response.data = { logs: logs.toString('utf8') };
        break;

      case 'container_action':
        const actionContainer = docker.getContainer(data.id);
        switch (data.action) {
          case 'start':
            await actionContainer.start();
            break;
          case 'stop':
            await actionContainer.stop();
            break;
          case 'restart':
            await actionContainer.restart();
            break;
          case 'remove':
            await actionContainer.remove({ force: data.force });
            break;
        }
        response.data = { success: true };
        break;

      case 'ping':
        response.data = { pong: true, timestamp: Date.now() };
        break;

      default:
        response.error = `Unknown message type: ${type}`;
    }
  } catch (error: any) {
    response.error = error.message;
  }

  // Send response back to server
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(response));
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  Received SIGTERM, shutting down gracefully...');
  if (ws) ws.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  Received SIGINT, shutting down gracefully...');
  if (ws) ws.close();
  process.exit(0);
});

// Start the agent
console.log('🚀 Starting LabDash Agent...');
console.log(`   Name: ${AGENT_NAME}`);
console.log(`   Docker: ${DOCKER_SOCKET}`);
console.log(`   Server: ${LABDASH_SERVER}`);

connectToServer();
