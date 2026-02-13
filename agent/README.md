# LabDash Agent

Lightweight agent for monitoring Docker containers across multiple hosts.

## Quick Start

### 1. Generate Agent Key

In your LabDash dashboard:
1. Go to **Settings** → **Agents**
2. Click **"Generate Agent Key"**
3. Copy the generated key

### 2. Deploy Agent

#### Option A: Docker Run (Quickest)

```bash
docker run -d \
  --name labdash-agent \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e LABDASH_SERVER=https://your-labdash-server.com \
  -e AGENT_KEY=your-agent-key-here \
  labdash/agent:latest
```

#### Option B: Docker Compose

```bash
# Download example compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/yourusername/labdash/main/agent/docker-compose.example.yml

# Edit and update LABDASH_SERVER and AGENT_KEY
nano docker-compose.yml

# Start agent
docker-compose up -d
```

#### Option C: Add to Existing Stack

Add this to your existing `docker-compose.yml`:

```yaml
services:
  labdash-agent:
    image: labdash/agent:latest
    restart: unless-stopped
    environment:
      LABDASH_SERVER: https://your-labdash-server.com
      AGENT_KEY: your-agent-key-here
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

### 3. Verify Connection

Check agent logs:
```bash
docker logs labdash-agent
```

You should see:
```
🚀 LabDash Agent listening on port 8888
🔌 Connecting to LabDash server: wss://your-server.com/api/agent/ws
✅ Connected to LabDash server
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LABDASH_SERVER` | Yes | - | URL of your LabDash server |
| `AGENT_KEY` | Yes | - | Agent API key from LabDash |
| `AGENT_NAME` | No | hostname | Custom name for this agent |
| `AGENT_PORT` | No | 8888 | Port for agent health checks |
| `DOCKER_SOCKET` | No | /var/run/docker.sock | Docker socket path |

### Custom Agent Name

```bash
docker run -d \
  --name labdash-agent \
  -e AGENT_NAME="Production Server" \
  # ... other options
```

## Security

- **Read-only Docker socket**: Agent mounts socket as `:ro` to prevent container creation
- **API key authentication**: All communication requires valid API key
- **WebSocket encryption**: Uses WSS (WebSocket Secure) for encrypted communication
- **No exposed ports required**: Agent initiates outbound connection to server

## Troubleshooting

### Agent won't connect

1. Check agent logs: `docker logs labdash-agent`
2. Verify `LABDASH_SERVER` URL is correct
3. Ensure agent key is valid
4. Check network connectivity to LabDash server

### Docker permission errors

The agent needs access to Docker socket:
```bash
# Verify socket exists
ls -la /var/run/docker.sock

# Should show: srw-rw---- 1 root docker
```

### Health check

```bash
# Check agent health
curl http://localhost:8888/health
```

## Development

### Build from source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
npm start
```

### Build Docker image

```bash
npm run docker:build
```

## Architecture

The LabDash Agent:
1. Connects to LabDash server via WebSocket
2. Authenticates using API key
3. Sends heartbeat every 30 seconds
4. Responds to commands from server (list containers, get stats, start/stop, etc.)
5. Provides local HTTP API for health checks

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│  LabDash Agent  │ ◄───────(WSS)──────────── │  LabDash Server  │
└────────┬────────┘                            └──────────────────┘
         │
         │ Unix Socket
         │ (read-only)
         ▼
┌─────────────────┐
│  Docker Daemon  │
└─────────────────┘
```

## License

MIT
