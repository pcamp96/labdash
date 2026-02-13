# LabDash Quick Start Guide

Get LabDash running in under 5 minutes using pre-built Docker images.

## Prerequisites

- Docker and Docker Compose installed
- A machine to run LabDash (can be the same machine you want to monitor)

## Step 1: Download Configuration Files

```bash
# Create directory
mkdir labdash && cd labdash

# Download docker-compose file
curl -O https://raw.githubusercontent.com/pcamp96/labdash/main/docker-compose.ghcr.yml

# Download example config
curl -O https://raw.githubusercontent.com/pcamp96/labdash/main/config/prometheus/prometheus.yml
mkdir -p config/prometheus config/grafana/provisioning
mv prometheus.yml config/prometheus/

# Download Grafana config
curl -O https://raw.githubusercontent.com/pcamp96/labdash/main/config/grafana/provisioning/datasources/prometheus.yml
mkdir -p config/grafana/provisioning/datasources
mv prometheus.yml config/grafana/provisioning/datasources/
```

Or simply clone the repository:

```bash
git clone https://github.com/pcamp96/labdash.git
cd labdash
```

## Step 2: Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# Generate ENCRYPTION_KEY
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
```

**Save these values!** You'll need them in the next step.

## Step 3: Create Environment File

Create a `.env` file:

```bash
cat > .env << 'EOF'
# Required Secrets (replace with your generated values)
NEXTAUTH_SECRET=your-nextauth-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# Optional (defaults shown)
NEXTAUTH_URL=http://localhost:3000
POSTGRES_PASSWORD=changeme
GRAFANA_PASSWORD=admin
EOF
```

Update the file with your generated secrets from Step 2.

## Step 4: Start LabDash

```bash
# Pull latest images
docker-compose -f docker-compose.ghcr.yml pull

# Start all services
docker-compose -f docker-compose.ghcr.yml up -d

# Watch logs
docker-compose -f docker-compose.ghcr.yml logs -f labdash
```

## Step 5: Access LabDash

Open your browser and navigate to:
- **LabDash**: http://localhost:3000
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

## Step 5: Create Your Account

1. Click "Register" on the login page
2. Fill in your details (use any email, e.g., `admin@labdash.local`)
3. Create a password (minimum 8 characters)
4. Click "Create Account"
5. You'll be redirected to login - sign in with your credentials

**Note**: The first user automatically becomes an ADMIN.

## Step 6: Explore the Dashboard

You should now see the LabDash dashboard with:
- **Docker Containers** - A live list of your Docker containers
- Navigation to Services and Settings pages

### Testing Docker Integration

If you have Docker running locally, you should see your containers listed. You can:
- ✅ Start stopped containers
- ⏹️ Stop running containers
- 🔄 Restart containers
- 📊 View container status and uptime

The list auto-refreshes every 5 seconds!

## Next Steps

### Add the Full Stack (Optional)

To run the complete stack with Grafana and Prometheus:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (optional database upgrade from SQLite)
- Grafana (http://localhost:3001)
- Prometheus (http://localhost:9090)
- cAdvisor (container metrics)
- Node Exporter (host metrics)

**To use PostgreSQL instead of SQLite:**
1. Update `.env`: `DATABASE_URL="postgresql://labdash:changeme@localhost:5432/labdash"`
2. Update `prisma/schema.prisma`: Change provider to `"postgresql"`
3. Run migrations: `npx prisma migrate dev`

### Customize Your Dashboard

The dashboard is ready for you to extend! Here's what you can build next:

1. **Add More Widgets** - Create new widget components in `src/components/widgets/`
2. **Service Integrations** - Add support for Sonarr, Radarr, Plex, etc.
3. **Grafana Panels** - Embed Grafana dashboards for metrics visualization
4. **Grid Layout** - Implement drag-and-drop dashboard customization

Check out the implementation plan in the project root for detailed guidance.

## Troubleshooting

### "Can't connect to Docker"

Make sure:
- Docker is running
- Docker socket is accessible at `/var/run/docker.sock`
- On macOS: Docker Desktop should be running

### "Database migration failed"

Try:
```bash
rm -rf data/labdash.db
npx prisma migrate dev --name init
```

### "Port 3000 already in use"

Either:
- Stop the other service using port 3000
- Or change the port in `package.json`: `"dev": "next dev -p 3001"`

## Development Tips

### Database Management

View your database in a GUI:
```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555

### Hot Reload

The Next.js dev server supports hot reload - just save your files and the browser updates automatically!

### TypeScript

The project uses strict TypeScript. Run type checking:
```bash
npx tsc --noEmit
```

### Prisma Client

After changing the schema, regenerate the client:
```bash
npx prisma generate
```

---

**You're all set!** 🚀 Start building your homelab dashboard!
