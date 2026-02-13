# LabDash - Homelab Dashboard

A comprehensive, self-hostable dashboard for monitoring and managing your homelab services. Built with Next.js 15, React 19, and Docker.

## Features

- 🐳 **Docker Container Monitoring** - Real-time container status, stats, and control
- 📊 **Grafana Integration** - Embedded metrics visualization
- 📦 **Service Integrations** - Support for *arr services, media servers, download clients, and more
- 🎨 **Customizable Dashboard** - Drag-and-drop widget system
- 🔐 **Authentication & User Management** - Role-based access control
- ⚙️ **Web-Based Configuration** - No YAML editing required

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd labdash
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Generate secure secrets:
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

Update `.env` with these values.

4. Start the stack:
```bash
docker-compose up -d
```

5. Access LabDash:
- **Dashboard**: http://localhost:3000
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

### First Time Setup

1. Navigate to http://localhost:3000
2. Click "Register" to create your account
3. The first user automatically becomes an admin
4. Sign in and start adding services!

## Development

### Local Development

```bash
# Install dependencies
npm install

# Set up database (SQLite for development)
export DATABASE_URL="file:./data/labdash.db"
npx prisma migrate dev

# Start development server
npm run dev
```

Visit http://localhost:3000

### Database

LabDash supports both PostgreSQL and SQLite:

**PostgreSQL** (recommended for production):
```
DATABASE_URL="postgresql://labdash:password@postgres:5432/labdash"
```

**SQLite** (great for development/single-user):
```
DATABASE_URL="file:./data/labdash.db"
```

Simply change the `DATABASE_URL` - the same schema works for both!

### Project Structure

```
labdash/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/    # Dashboard pages
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── ui/            # UI primitives
│   │   └── widgets/       # Dashboard widgets
│   ├── lib/               # Utilities and libraries
│   │   ├── auth/          # Authentication logic
│   │   ├── docker/        # Docker API client
│   │   └── services/      # Service integrations
│   └── types/             # TypeScript type definitions
├── prisma/                # Database schema
├── config/                # Configuration files
│   ├── grafana/          # Grafana provisioning
│   └── prometheus/       # Prometheus config
├── docker-compose.yml    # Multi-service orchestration
└── Dockerfile           # Production container image
```

## Architecture

### Tech Stack

- **Frontend/Backend**: Next.js 15 + React 19 (unified full-stack)
- **Database**: Prisma ORM (PostgreSQL or SQLite)
- **Authentication**: NextAuth.js with JWT sessions
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query + Zustand
- **Container Monitoring**: Dockerode + Prometheus + cAdvisor
- **Metrics Visualization**: Grafana (sidecar container)

### Service Stack

The Docker Compose stack includes:

- **labdash**: Main Next.js application
- **postgres**: PostgreSQL database (optional)
- **grafana**: Metrics visualization
- **prometheus**: Time-series metrics storage
- **cadvisor**: Container metrics collection
- **node-exporter**: Host system metrics

### Security

- ✅ NextAuth.js authentication with bcrypt password hashing
- ✅ AES-256 encrypted API keys in database
- ✅ Read-only Docker socket access
- ✅ Role-based access control (ADMIN, USER, VIEWER)
- ✅ Secure session cookies
- ✅ Input validation with Zod schemas

## Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] Database schema
- [x] Authentication
- [x] Docker integration
- [x] Basic dashboard UI

### Phase 2: Core Features (In Progress)
- [ ] Drag-and-drop dashboard
- [ ] Widget system
- [ ] Service integration framework
- [ ] *arr services (Sonarr, Radarr, etc.)
- [ ] Media servers (Plex, Jellyfin)

### Phase 3: Advanced Features
- [ ] Grafana embedding
- [ ] Download clients
- [ ] Infrastructure monitoring (Proxmox, Unraid)
- [ ] Notifications
- [ ] Backup/restore

### Phase 4: Extended Integrations
- [ ] Git platforms (GitHub, GitLab, Gitea)
- [ ] Smart home (Home Assistant)
- [ ] Gaming (Minecraft, Pterodactyl)
- [ ] Calendar integrations

## Contributing

Contributions are welcome! This project is designed with an extensible plugin architecture, making it easy to add new service integrations.

### Adding a New Service Integration

1. Create a service client in `src/lib/services/`
2. Add API routes in `src/app/api/services/[type]/`
3. Create widget component in `src/components/widgets/`
4. Register the service type in the Prisma schema

See the existing Docker and *arr integrations as examples.

## License

MIT License - see LICENSE file for details.

## Support

- 📖 Documentation: See `/docs` folder
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

Built with ❤️ for the homelab community
