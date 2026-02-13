# LabDash - Self-Hosted Homelab Dashboard

<div align="center">

![LabDash Logo](https://via.placeholder.com/200x200?text=LabDash)

**A modern, self-hosted dashboard for monitoring and managing your homelab infrastructure**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Screenshots](#screenshots) • [Contributing](#contributing)

</div>

---

## 🌟 Features

### Multi-Host Docker Monitoring
- 🐳 **Agent-Based Architecture** - Monitor containers across unlimited Docker hosts
- 🔄 **Real-Time Updates** - Live container status, stats, and logs
- ⚡ **Container Control** - Start, stop, restart containers from the dashboard
- 📊 **Resource Monitoring** - CPU, memory, network, and disk usage per container
- 🔌 **Auto-Discovery** - Agents automatically register with the server

### Powerful Dashboard
- 🎨 **Customizable Layouts** - Drag-and-drop widgets (coming soon)
- 📈 **Grafana Integration** - Embed metrics dashboards
- 🔔 **Notifications** - Alerts for container failures (coming soon)
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

### Service Integrations (Planned)
- **Media Management**: Sonarr, Radarr, Lidarr, Prowlarr, Readarr
- **Media Servers**: Plex, Jellyfin, Emby
- **Download Clients**: qBittorrent, Transmission, SABnzbd, NZBGet
- **Infrastructure**: Proxmox, Unraid, TrueNAS
- **Networking**: Pi-hole, AdGuard, Tailscale
- **Smart Home**: Home Assistant
- **Development**: GitHub, GitLab, Gitea

### Security & Authentication
- 🔐 **Role-Based Access** - Admin, User, and Viewer roles
- 🔑 **Secure API Keys** - SHA-256 hashed agent authentication
- 🔒 **Encrypted Secrets** - AES-256 encryption for sensitive data
- 👤 **Multi-User Support** - Per-user dashboards and preferences

### Modern Tech Stack
- **Framework**: Next.js 15 + React 19
- **Database**: Prisma ORM (PostgreSQL or SQLite)
- **UI**: Tailwind CSS + shadcn/ui components
- **State**: TanStack Query + Zustand
- **Real-Time**: WebSocket connections for agents
- **Deployment**: Docker + Docker Compose

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for development)
- A Docker host you want to monitor

### 1. Clone the Repository

```bash
git clone https://github.com/pcamp96/labdash.git
cd labdash
```

### 2. Set Up Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate secure secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"

# Update .env with these values
nano .env
```

### 3. Start with Docker Compose

```bash
# Start the full stack
docker-compose up -d

# Watch logs
docker-compose logs -f labdash
```

### 4. Access LabDash

1. Open http://localhost:3000
2. Click **Register** to create your account (first user = admin)
3. Sign in and start monitoring!

### 5. Deploy Agents on Remote Hosts

On each Docker host you want to monitor:

```bash
# Generate agent key in LabDash UI first (Settings → Agents)

# Then run:
docker run -d \
  --name labdash-agent \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e LABDASH_SERVER=http://your-labdash-ip:3000 \
  -e AGENT_KEY=your-agent-key-here \
  -e AGENT_NAME="Production Server" \
  labdash/agent:latest
```

See [Agent Deployment Guide](docs/AGENT-DEPLOYMENT.md) for detailed instructions.

---

## 📖 Documentation

### Core Guides
- [Quick Start Guide](docs/QUICKSTART.md) - Get up and running in 5 minutes
- [Agent Deployment](docs/AGENT-DEPLOYMENT.md) - Deploy agents on remote hosts
- [Architecture Overview](docs/ARCHITECTURE.md) - System design and components
- [API Documentation](docs/API.md) - REST API reference (coming soon)

### Configuration
- [Environment Variables](docs/ENVIRONMENT.md) - Configuration options
- [Database Setup](docs/DATABASE.md) - PostgreSQL vs SQLite
- [Reverse Proxy](docs/REVERSE-PROXY.md) - Nginx, Traefik, Caddy setup

### Development
- [Development Guide](docs/DEVELOPMENT.md) - Contributing to LabDash
- [Widget Development](docs/WIDGETS.md) - Creating custom widgets
- [Service Integrations](docs/INTEGRATIONS.md) - Adding new services

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      LabDash Server                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │  PostgreSQL  │  │   Grafana    │      │
│  │  Dashboard   │  │   Database   │  │  Monitoring  │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                    │
│         │ WebSocket (WSS)                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
    ──────┴──────────────────────────────────────
    │             │              │              │
┌───▼────┐   ┌───▼────┐    ┌───▼────┐    ┌───▼────┐
│ Agent  │   │ Agent  │    │ Agent  │    │ Agent  │
│ Host 1 │   │ Host 2 │    │ Host 3 │    │ Host N │
└────────┘   └────────┘    └────────┘    └────────┘
```

### Key Components

**LabDash Server**
- Next.js 15 application (main dashboard)
- WebSocket server for agent connections
- PostgreSQL/SQLite database
- Grafana for metrics visualization
- Prometheus for time-series data

**LabDash Agent**
- Lightweight TypeScript service
- Runs on each Docker host
- Connects to local Docker socket (read-only)
- Communicates via WebSocket
- Auto-reconnects on disconnect

**Security Model**
- API key authentication for agents
- Role-based access control (RBAC)
- Encrypted communication (WSS)
- AES-256 encrypted secrets in database
- Read-only Docker socket access

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)
*Main dashboard showing containers across multiple hosts*

### Container Management
![Containers](https://via.placeholder.com/800x400?text=Container+Management)
*Container list with real-time stats and controls*

### Agent Management
![Agents](https://via.placeholder.com/800x400?text=Agent+Management)
*Manage agents and API keys*

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: TanStack Query + Zustand
- **Charts**: Recharts
- **Grid Layout**: react-grid-layout

### Backend
- **Runtime**: Node.js 20
- **API**: Next.js API Routes
- **WebSocket**: ws library
- **Docker Client**: Dockerode
- **Authentication**: NextAuth.js v5
- **Validation**: Zod

### Database
- **ORM**: Prisma
- **Database**: PostgreSQL (production) or SQLite (development)
- **Migrations**: Prisma Migrate

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Metrics**: Prometheus + Grafana
- **Container Metrics**: cAdvisor
- **Host Metrics**: Node Exporter

---

## 🗺️ Roadmap

### ✅ Completed (v0.1)
- [x] Core dashboard UI
- [x] Authentication system (NextAuth.js)
- [x] Docker container monitoring
- [x] Multi-host agent architecture
- [x] Container start/stop/restart controls
- [x] Real-time container stats
- [x] Container logs viewing
- [x] Agent API key management

### 🚧 In Progress (v0.2)
- [ ] Drag-and-drop dashboard layout
- [ ] Docker stats widget with charts
- [ ] Agent management UI
- [ ] Custom Next.js server for WebSocket
- [ ] Service auto-discovery

### 📋 Planned (v0.3+)
- [ ] *arr service integrations (Sonarr, Radarr, etc.)
- [ ] Media server widgets (Plex, Jellyfin)
- [ ] Download client monitoring
- [ ] Grafana panel embedding
- [ ] Notification system
- [ ] Calendar widget (upcoming media)
- [ ] Mobile app (React Native)
- [ ] Plugin system for custom integrations

### 🎯 Future Ideas
- [ ] Proxmox/Unraid integration
- [ ] Home Assistant integration
- [ ] GitHub/GitLab repository monitoring
- [ ] Tailscale network visualization
- [ ] Backup/restore functionality
- [ ] Dark/light theme toggle
- [ ] Multi-language support

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pcamp96/labdash.git
   cd labdash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   ```bash
   # Use SQLite for development
   export DATABASE_URL="file:./data/labdash.db"
   npx prisma migrate dev
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Visit http://localhost:3000**

### Contribution Guidelines

- **Code Style**: Follow TypeScript and React best practices
- **Commits**: Use conventional commits (feat, fix, docs, etc.)
- **Pull Requests**: Include description and screenshots
- **Testing**: Ensure your changes work locally
- **Documentation**: Update docs for new features

### Areas for Contribution

- 🎨 **UI/UX**: Improve design and user experience
- 🔌 **Integrations**: Add new service integrations
- 📊 **Widgets**: Create new dashboard widgets
- 🐛 **Bug Fixes**: Fix issues and improve stability
- 📝 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Add tests and improve coverage

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Inspiration
- [Homarr](https://github.com/ajnart/homarr) - Modern homelab dashboard
- [Portainer](https://www.portainer.io/) - Docker management UI and agent architecture
- [Homer](https://github.com/bastienwirtz/homer) - Simple static dashboard
- [Heimdall](https://github.com/linuxserver/Heimdall) - Application dashboard

### Technologies
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Dockerode](https://github.com/apocas/dockerode) - Docker API client

### Community
Built with ❤️ for the homelab community

---

## 📞 Support

- 📖 **Documentation**: [docs/](docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/pcamp96/labdash/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/pcamp96/labdash/discussions)
- ⭐ **Star this repo** if you find it useful!

---

## 🔗 Links

- **Repository**: https://github.com/pcamp96/labdash
- **Agent Image**: `docker pull labdash/agent:latest` (coming soon)
- **Documentation**: https://github.com/pcamp96/labdash/tree/main/docs

---

<div align="center">

**Built for homelabbers, by homelabbers** 🏠

[⬆ Back to Top](#labdash---self-hosted-homelab-dashboard)

</div>
