#!/bin/bash

# LabDash Agent Deployment Script
#
# Usage:
#   ./deploy-agent.sh <server-url> <agent-key> [agent-name]
#
# Example:
#   ./deploy-agent.sh https://labdash.example.com labdash_abc123... production-server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 LabDash Agent Deployment${NC}"
echo ""

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo ""
    echo "Usage: $0 <server-url> <agent-key> [agent-name]"
    echo ""
    echo "Arguments:"
    echo "  server-url   : URL of your LabDash server (e.g., https://labdash.example.com)"
    echo "  agent-key    : Agent API key from LabDash dashboard"
    echo "  agent-name   : Optional custom name for this agent (defaults to hostname)"
    echo ""
    exit 1
fi

LABDASH_SERVER=$1
AGENT_KEY=$2
AGENT_NAME=${3:-$(hostname)}

echo "Configuration:"
echo "  Server: $LABDASH_SERVER"
echo "  Agent Name: $AGENT_NAME"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is installed"

# Check if Docker socket exists
if [ ! -S /var/run/docker.sock ]; then
    echo -e "${RED}Error: Docker socket not found at /var/run/docker.sock${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker socket accessible"

# Stop existing agent if running
if docker ps -a | grep -q labdash-agent; then
    echo -e "${YELLOW}⚠${NC} Stopping existing LabDash agent..."
    docker stop labdash-agent > /dev/null 2>&1 || true
    docker rm labdash-agent > /dev/null 2>&1 || true
fi

# Pull latest agent image
echo ""
echo "📥 Pulling latest LabDash agent image..."
docker pull labdash/agent:latest

# Run agent
echo ""
echo "🚀 Starting LabDash agent..."
docker run -d \
    --name labdash-agent \
    --restart unless-stopped \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -e LABDASH_SERVER="$LABDASH_SERVER" \
    -e AGENT_KEY="$AGENT_KEY" \
    -e AGENT_NAME="$AGENT_NAME" \
    labdash/agent:latest

# Wait a moment for agent to start
sleep 2

# Check if agent is running
if docker ps | grep -q labdash-agent; then
    echo ""
    echo -e "${GREEN}✅ LabDash agent deployed successfully!${NC}"
    echo ""
    echo "Agent details:"
    docker ps --filter name=labdash-agent --format "  Container ID: {{.ID}}\n  Status: {{.Status}}\n  Ports: {{.Ports}}"
    echo ""
    echo "View logs:"
    echo "  docker logs -f labdash-agent"
    echo ""
    echo "The agent should now appear in your LabDash dashboard."
else
    echo -e "${RED}Error: Agent failed to start${NC}"
    echo ""
    echo "Check logs with:"
    echo "  docker logs labdash-agent"
    exit 1
fi
