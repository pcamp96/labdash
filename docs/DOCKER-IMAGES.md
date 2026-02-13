# LabDash Docker Images

Official Docker images for LabDash are published to GitHub Container Registry (ghcr.io).

## Available Images

### Main Application
```bash
docker pull ghcr.io/pcamp96/labdash:latest
```

**Image**: `ghcr.io/pcamp96/labdash`
**Size**: ~500MB
**Architectures**: AMD64, ARM64

Contains:
- Next.js 15 application
- Prisma database client
- All dependencies
- Production optimizations

### Agent
```bash
docker pull ghcr.io/pcamp96/labdash-agent:latest
```

**Image**: `ghcr.io/pcamp96/labdash-agent`
**Size**: ~200MB
**Architectures**: AMD64, ARM64

Contains:
- Lightweight TypeScript agent
- Dockerode client
- WebSocket client
- Minimal dependencies

## Image Tags

| Tag | Description | Use For |
|-----|-------------|---------|
| `latest` | Most recent build from `main` branch | Production |
| `main` | Latest `main` branch build | Testing |
| `v0.1.0` | Specific version release | Pinned deployments |
| `0.1` | Minor version | Auto-updates within minor |
| `0` | Major version | Auto-updates within major |

## Pulling Images

### Latest Version (Recommended)

```bash
# Main application
docker pull ghcr.io/pcamp96/labdash:latest

# Agent
docker pull ghcr.io/pcamp96/labdash-agent:latest
```

### Specific Version

```bash
# Main application v0.1.0
docker pull ghcr.io/pcamp96/labdash:v0.1.0

# Agent v0.1.0
docker pull ghcr.io/pcamp96/labdash-agent:v0.1.0
```

### Specific Architecture

Docker automatically pulls the correct architecture, but you can be explicit:

```bash
# AMD64
docker pull --platform linux/amd64 ghcr.io/pcamp96/labdash:latest

# ARM64 (Raspberry Pi, Apple Silicon)
docker pull --platform linux/arm64 ghcr.io/pcamp96/labdash:latest
```

## Using Images

### Docker Run

**Main Application:**
```bash
docker run -d \
  --name labdash \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e NEXTAUTH_SECRET=your-secret \
  -e ENCRYPTION_KEY=your-key \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  ghcr.io/pcamp96/labdash:latest
```

**Agent:**
```bash
docker run -d \
  --name labdash-agent \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e LABDASH_SERVER=http://your-server:3000 \
  -e AGENT_KEY=your-agent-key \
  ghcr.io/pcamp96/labdash-agent:latest
```

### Docker Compose

Download the compose file:
```bash
curl -O https://raw.githubusercontent.com/pcamp96/labdash/main/docker-compose.ghcr.yml
```

Or use inline:
```yaml
version: '3.8'

services:
  labdash:
    image: ghcr.io/pcamp96/labdash:latest
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - DATABASE_URL=postgresql://labdash:changeme@postgres:5432/labdash
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=labdash
      - POSTGRES_PASSWORD=changeme
      - POSTGRES_DB=labdash
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

## Image Updates

### Check for Updates

```bash
# Check current version
docker inspect ghcr.io/pcamp96/labdash:latest | grep Created

# Pull latest
docker pull ghcr.io/pcamp96/labdash:latest

# Restart with new image
docker-compose down && docker-compose up -d
```

### Automatic Updates

Use [Watchtower](https://github.com/containrrr/watchtower) for automatic updates:

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  labdash labdash-agent
```

## Building Images Locally

If you prefer to build from source:

```bash
# Clone repository
git clone https://github.com/pcamp96/labdash.git
cd labdash

# Build main app
docker build -t labdash:local .

# Build agent
cd agent
docker build -t labdash-agent:local .
```

## Image Details

### Main Application Layers

1. **Base**: Node.js 20 Alpine
2. **Dependencies**: npm packages
3. **Build**: Next.js compilation
4. **Runtime**: Standalone server

Multi-stage build reduces final image size by ~60%.

### Agent Layers

1. **Base**: Node.js 20 Alpine
2. **Dependencies**: Minimal npm packages (dockerode, express, ws)
3. **Build**: TypeScript compilation
4. **Runtime**: Node.js server

## Registry Information

**Registry**: GitHub Container Registry (ghcr.io)
**Visibility**: Public
**Authentication**: Not required for pulling
**Source**: https://github.com/pcamp96/labdash

### Package Pages

- Main App: https://github.com/pcamp96/labdash/pkgs/container/labdash
- Agent: https://github.com/pcamp96/labdash/pkgs/container/labdash-agent

## Future: Docker Hub

LabDash images will also be published to Docker Hub in the future:

```bash
# Coming soon
docker pull labdash/labdash:latest
docker pull labdash/agent:latest
```

For now, use GitHub Container Registry (ghcr.io) as shown above.

## Troubleshooting

### Rate Limiting

GitHub Container Registry has generous rate limits for public images:
- Anonymous: 1000 pulls/hour
- Authenticated: 5000 pulls/hour

No authentication needed for public pulls.

### Image Not Found

If you get "image not found":

1. Verify image name is correct: `ghcr.io/pcamp96/labdash:latest`
2. Check package is public: https://github.com/pcamp96/labdash/pkgs/container/labdash
3. Try pulling explicitly:
   ```bash
   docker pull ghcr.io/pcamp96/labdash:latest
   ```

### Authentication Issues

Images are public - no authentication required. If you still get auth errors:

```bash
# Clear Docker credentials
rm ~/.docker/config.json

# Try again
docker pull ghcr.io/pcamp96/labdash:latest
```

### Platform Mismatch

If running on ARM (Raspberry Pi) and getting "exec format error":

```bash
# Explicitly pull ARM64 image
docker pull --platform linux/arm64 ghcr.io/pcamp96/labdash:latest
```

## Support

- 📦 View packages: https://github.com/pcamp96?tab=packages
- 🐛 Report issues: https://github.com/pcamp96/labdash/issues
- 📖 Documentation: https://github.com/pcamp96/labdash/tree/main/docs
