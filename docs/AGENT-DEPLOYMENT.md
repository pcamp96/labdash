# LabDash Agent Deployment Guide

## Overview

LabDash Agents allow you to monitor Docker containers across multiple hosts. Each agent runs on a Docker host and communicates securely with your LabDash server.

## Architecture

```
┌─────────────────────┐
│  LabDash Server     │
│  (Main Dashboard)   │
└──────────┬──────────┘
           │ WebSocket (WSS)
           │ (Secure, encrypted)
           │
    ┌──────┴──────┬──────────┬─────────┐
    │             │          │         │
┌───▼────┐   ┌───▼────┐ ┌──▼─────┐ ┌─▼───────┐
│ Agent  │   │ Agent  │ │ Agent  │ │  Agent  │
│ Host 1 │   │ Host 2 │ │ Host 3 │ │  Host N │
└────────┘   └────────┘ └────────┘ └─────────┘
```

Each agent:
- Runs as a Docker container
- Connects to local Docker socket (read-only)
- Authenticates with API key
- Sends real-time updates to server

## Quick Start

### 1. Generate Agent Key

In LabDash dashboard:
1. Go to **Settings** → **Agents**
2. Click **"Generate Agent Key"**
3. Give it a name (e.g., "Production Server")
4. **Copy and save the key** - it won't be shown again!

### 2. Deploy Agent

#### Option A: One-Line Install (Recommended)

```bash
docker run -d \
  --name labdash-agent \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e LABDASH_SERVER=https://your-labdash-server.com \
  -e AGENT_KEY=your-agent-key-here \
  -e AGENT_NAME="Production Server" \
  labdash/agent:latest
```

#### Option B: Using Deployment Script

```bash
# Download script
curl -O https://raw.githubusercontent.com/yourusername/labdash/main/scripts/deploy-agent.sh
chmod +x deploy-agent.sh

# Run it
./deploy-agent.sh https://your-labdash-server.com your-agent-key-here production-server
```

#### Option C: Docker Compose

Add to your existing `docker-compose.yml`:

```yaml
services:
  labdash-agent:
    image: labdash/agent:latest
    container_name: labdash-agent
    restart: unless-stopped
    environment:
      LABDASH_SERVER: https://your-labdash-server.com
      AGENT_KEY: your-agent-key-here
      AGENT_NAME: production-server
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

Then start it:
```bash
docker-compose up -d labdash-agent
```

### 3. Verify Connection

Check agent logs:
```bash
docker logs labdash-agent
```

You should see:
```
🚀 LabDash Agent listening on port 8888
   Name: production-server
   Docker: /var/run/docker.sock
   Server: https://your-labdash-server.com
🔌 Connecting to LabDash server...
✅ Connected to LabDash server
```

In your LabDash dashboard, the agent should now appear in **Settings** → **Agents** with a green "Connected" status.

## Managing Multiple Agents

Deploy an agent on each Docker host you want to monitor:

```bash
# Production server
./deploy-agent.sh https://labdash.example.com key1 production-server

# Media server
./deploy-agent.sh https://labdash.example.com key2 media-server

# Development server
./deploy-agent.sh https://labdash.example.com key3 dev-server
```

Each agent shows up separately in your dashboard with its own name.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LABDASH_SERVER` | ✅ Yes | - | URL of your LabDash server |
| `AGENT_KEY` | ✅ Yes | - | Agent API key (from dashboard) |
| `AGENT_NAME` | No | hostname | Custom name for this agent |
| `AGENT_PORT` | No | 8888 | Port for health checks |
| `DOCKER_SOCKET` | No | /var/run/docker.sock | Docker socket path |

## Security

### Read-Only Docker Access
Agent mounts Docker socket as read-only (`:ro`) to prevent:
- Creating new containers
- Modifying existing containers
- Changing Docker configuration

It can only:
- List containers
- Get container stats
- Start/stop/restart containers you've authorized

### Encrypted Communication
- All communication uses WebSocket Secure (WSS)
- TLS encryption for data in transit
- API key authentication for each connection

### API Key Management
- Keys are hashed before storage (SHA-256)
- Keys can be revoked instantly from dashboard
- Optional expiration dates
- Each key can be linked to one agent

## Troubleshooting

### Agent won't connect

**Check the logs:**
```bash
docker logs labdash-agent
```

**Common issues:**

1. **Invalid API key**
   ```
   ❌ WebSocket error: Unauthorized
   ```
   → Verify your API key is correct and hasn't been revoked

2. **Can't reach server**
   ```
   ⚠️ Disconnected from server. Reconnecting in 5s...
   ```
   → Check firewall rules and network connectivity
   → Verify `LABDASH_SERVER` URL is correct

3. **Docker permission denied**
   ```
   Error: connect EACCES /var/run/docker.sock
   ```
   → Ensure Docker socket is mounted: `-v /var/run/docker.sock:/var/run/docker.sock:ro`

### Agent shows as disconnected in dashboard

1. Check if agent container is running:
   ```bash
   docker ps | grep labdash-agent
   ```

2. Restart the agent:
   ```bash
   docker restart labdash-agent
   ```

3. Check agent health:
   ```bash
   curl http://localhost:8888/health
   ```

### Update agent to latest version

```bash
docker pull labdash/agent:latest
docker stop labdash-agent
docker rm labdash-agent
# Then re-run your original docker run command
```

## Advanced Configuration

### Custom Docker Socket Path

If your Docker socket is in a non-standard location:
```bash
docker run -d \
  -v /custom/path/to/docker.sock:/var/run/docker.sock:ro \
  -e DOCKER_SOCKET=/var/run/docker.sock \
  # ... other options
  labdash/agent:latest
```

### Multiple Docker Daemons

To monitor multiple Docker daemons on the same host, deploy separate agents:

```bash
# Monitor local Docker
docker run -d --name labdash-agent-local \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e AGENT_NAME="local-docker" \
  # ... other options

# Monitor Docker in WSL
docker run -d --name labdash-agent-wsl \
  -v /mnt/wsl/docker.sock:/var/run/docker.sock:ro \
  -e AGENT_NAME="wsl-docker" \
  # ... other options
```

### Firewall Configuration

Agent initiates **outbound** connection to server - no inbound ports needed!

If you want health checks exposed:
```bash
# Allow health check port
firewall-cmd --add-port=8888/tcp --permanent
firewall-cmd --reload
```

## Monitoring Agent Health

### Health Check Endpoint
```bash
curl http://localhost:8888/health
```

Response:
```json
{
  "status": "healthy",
  "agent": "production-server",
  "version": "0.1.0",
  "uptime": 3600.5
}
```

### Container Logs
```bash
# Follow logs in real-time
docker logs -f labdash-agent

# Last 100 lines
docker logs --tail 100 labdash-agent
```

### Resource Usage
```bash
# Check CPU and memory usage
docker stats labdash-agent --no-stream
```

## Uninstalling Agent

```bash
# Stop and remove agent
docker stop labdash-agent
docker rm labdash-agent

# Optionally remove image
docker rmi labdash/agent:latest
```

Don't forget to revoke the API key in your LabDash dashboard!

## Support

- 📖 Full documentation: [github.com/yourusername/labdash](https://github.com/yourusername/labdash)
- 🐛 Report issues: [GitHub Issues](https://github.com/yourusername/labdash/issues)
- 💬 Community: [GitHub Discussions](https://github.com/yourusername/labdash/discussions)

---

Happy monitoring! 🚀
