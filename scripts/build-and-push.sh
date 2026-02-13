#!/bin/bash

# Build and push LabDash containers to GitHub Container Registry
# Usage: ./scripts/build-and-push.sh [version]
#
# Example: ./scripts/build-and-push.sh v0.1.0

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="ghcr.io"
REPO="pcamp96/labdash"
VERSION=${1:-"latest"}

echo -e "${BLUE}🐳 Building and pushing LabDash Docker images${NC}"
echo ""
echo "Registry: $REGISTRY"
echo "Repository: $REPO"
echo "Version: $VERSION"
echo ""

# Check if logged in to GitHub Container Registry
echo -e "${YELLOW}Checking GitHub Container Registry login...${NC}"
if ! docker info | grep -q "ghcr.io"; then
    echo "Please login to GitHub Container Registry first:"
    echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
    echo ""
    echo "Generate a token at: https://github.com/settings/tokens"
    echo "Required scopes: write:packages, read:packages"
    exit 1
fi

echo -e "${GREEN}✓${NC} Logged in to GitHub Container Registry"
echo ""

# Build and push main LabDash image
echo -e "${BLUE}📦 Building LabDash main application...${NC}"
docker build -t labdash:local .

echo -e "${BLUE}🏷️  Tagging LabDash main image...${NC}"
docker tag labdash:local $REGISTRY/$REPO:$VERSION
docker tag labdash:local $REGISTRY/$REPO:latest

echo -e "${BLUE}⬆️  Pushing LabDash main image...${NC}"
docker push $REGISTRY/$REPO:$VERSION
docker push $REGISTRY/$REPO:latest

echo -e "${GREEN}✓${NC} LabDash main image pushed successfully"
echo ""

# Build and push agent image
echo -e "${BLUE}📦 Building LabDash agent...${NC}"
cd agent
docker build -t labdash-agent:local .
cd ..

echo -e "${BLUE}🏷️  Tagging LabDash agent image...${NC}"
docker tag labdash-agent:local $REGISTRY/$REPO-agent:$VERSION
docker tag labdash-agent:local $REGISTRY/$REPO-agent:latest

echo -e "${BLUE}⬆️  Pushing LabDash agent image...${NC}"
docker push $REGISTRY/$REPO-agent:$VERSION
docker push $REGISTRY/$REPO-agent:latest

echo -e "${GREEN}✓${NC} LabDash agent image pushed successfully"
echo ""

# Summary
echo -e "${GREEN}🎉 All images pushed successfully!${NC}"
echo ""
echo "Images available at:"
echo "  Main: $REGISTRY/$REPO:$VERSION"
echo "  Main: $REGISTRY/$REPO:latest"
echo "  Agent: $REGISTRY/$REPO-agent:$VERSION"
echo "  Agent: $REGISTRY/$REPO-agent:latest"
echo ""
echo "Pull with:"
echo "  docker pull $REGISTRY/$REPO:latest"
echo "  docker pull $REGISTRY/$REPO-agent:latest"
echo ""
echo "View on GitHub:"
echo "  https://github.com/$REPO/pkgs/container/labdash"
echo "  https://github.com/$REPO/pkgs/container/labdash-agent"
