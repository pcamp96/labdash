# Publishing Docker Images to GitHub Container Registry

This guide explains how to build and publish LabDash Docker images to GitHub Container Registry (ghcr.io).

## Prerequisites

1. **GitHub Account** with repository access
2. **GitHub Personal Access Token** with `write:packages` and `read:packages` permissions
3. **Docker** installed locally

## Quick Publish (Manual)

### 1. Login to GitHub Container Registry

```bash
# Create a personal access token at:
# https://github.com/settings/tokens/new
# Required scopes: write:packages, read:packages

# Login
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 2. Run the Build Script

```bash
# Build and push latest version
./scripts/build-and-push.sh

# Or build and push a specific version
./scripts/build-and-push.sh v0.1.0
```

This will:
- Build both LabDash main and agent images
- Tag them with version and `latest`
- Push to `ghcr.io/pcamp96/labdash:latest` and `ghcr.io/pcamp96/labdash-agent:latest`

### 3. Verify Images

Visit:
- https://github.com/pcamp96/labdash/pkgs/container/labdash
- https://github.com/pcamp96/labdash/pkgs/container/labdash-agent

## Automatic Publishing (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically builds and publishes images.

### Triggers

- **Push to main**: Builds and publishes with `latest` tag
- **Tagged release** (e.g., `v1.0.0`): Builds and publishes with version tags
- **Pull requests**: Builds but doesn't publish (for testing)

### Creating a Release

```bash
# Tag a new version
git tag v0.1.0
git push origin v0.1.0
```

This triggers the workflow to:
1. Build both images
2. Tag with version (e.g., `v0.1.0`, `0.1`, `0`)
3. Tag with `latest` (if main branch)
4. Push to GitHub Container Registry
5. Support both AMD64 and ARM64 architectures

### Workflow Status

Check build status at:
https://github.com/pcamp96/labdash/actions

## Manual Build Steps

If you prefer to build manually:

### LabDash Main Image

```bash
# Build
docker build -t ghcr.io/pcamp96/labdash:latest .

# Push
docker push ghcr.io/pcamp96/labdash:latest
```

### LabDash Agent Image

```bash
# Build
cd agent
docker build -t ghcr.io/pcamp96/labdash-agent:latest .

# Push
docker push ghcr.io/pcamp96/labdash-agent:latest
```

## Multi-Architecture Builds

To build for multiple architectures (AMD64 + ARM64):

```bash
# Create buildx builder
docker buildx create --name multiarch --use

# Build and push main image
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/pcamp96/labdash:latest \
  --push .

# Build and push agent image
cd agent
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/pcamp96/labdash-agent:latest \
  --push .
```

## Using Published Images

### Pull Images

```bash
# Main application
docker pull ghcr.io/pcamp96/labdash:latest

# Agent
docker pull ghcr.io/pcamp96/labdash-agent:latest
```

### Docker Compose

Use the provided `docker-compose.ghcr.yml`:

```bash
docker-compose -f docker-compose.ghcr.yml up -d
```

Or update your existing `docker-compose.yml`:

```yaml
services:
  labdash:
    image: ghcr.io/pcamp96/labdash:latest
    # ... rest of config
```

### Agent Deployment

```bash
docker run -d \
  --name labdash-agent \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e LABDASH_SERVER=http://your-server:3000 \
  -e AGENT_KEY=your-key-here \
  ghcr.io/pcamp96/labdash-agent:latest
```

## Image Visibility

By default, GitHub Container Registry images are **private**. To make them public:

1. Go to the package page:
   - https://github.com/pcamp96/labdash/pkgs/container/labdash
   - https://github.com/pcamp96/labdash/pkgs/container/labdash-agent

2. Click "Package settings"

3. Scroll to "Danger Zone"

4. Click "Change visibility" → "Public"

This allows anyone to pull the images without authentication.

## Troubleshooting

### Authentication Failed

```
Error: denied: permission_denied
```

**Solution**: Verify your token has `write:packages` scope and you're logged in:
```bash
docker logout ghcr.io
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Build Fails in GitHub Actions

Check:
1. Workflow logs at https://github.com/pcamp96/labdash/actions
2. Ensure `GITHUB_TOKEN` has package write permissions
3. Verify Dockerfile syntax

### Image Not Found

If `docker pull` fails:
1. Check image exists at package page
2. Verify image is public (or you're logged in)
3. Check image name/tag is correct

## Best Practices

1. **Version Tags**: Always tag releases (e.g., `v0.1.0`)
2. **Latest Tag**: Use for the most recent stable version
3. **SHA Tags**: Automatically created for traceability
4. **Multi-Arch**: Support both AMD64 and ARM64
5. **Changelog**: Update CHANGELOG.md with each version

## Size Optimization

Current image sizes:
- LabDash Main: ~500MB (Next.js + dependencies)
- LabDash Agent: ~200MB (TypeScript + Dockerode)

To reduce size:
- Use alpine base images ✅
- Multi-stage builds ✅
- Remove dev dependencies ✅
- Optimize node_modules

## Next Steps

After publishing:
1. Update README.md with pull commands
2. Create GitHub release with changelog
3. Announce on r/selfhosted
4. Add badges to README
5. Update documentation links
