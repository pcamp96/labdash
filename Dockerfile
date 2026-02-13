# Multi-stage build for production
# Handles: standalone Next.js output, Prisma client, migrations

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files and prisma schema (needed for postinstall hook: prisma generate)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Provide a dummy DATABASE_URL so prisma generate succeeds during npm ci postinstall.
# The real value is supplied at runtime via environment variables.
ENV DATABASE_URL="file:./placeholder.db"

RUN npm ci --ignore-scripts && npx prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure the public directory exists (Next.js standalone expects it)
RUN mkdir -p /app/public

# Provide dummy build-time env vars so Next.js build does not fail on missing values.
# These are overridden at runtime. NEXTAUTH_SECRET must be non-empty for next-auth.
ENV DATABASE_URL="file:./placeholder.db"
ENV NEXTAUTH_SECRET="build-time-placeholder-secret-do-not-use"
ENV NEXTAUTH_URL="http://localhost:3000"

# Generate Prisma Client (idempotent, ensures it matches the schema)
RUN npx prisma generate

# Build Next.js in standalone mode (configured in next.config.js)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner (minimal production image)
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone Next.js server output (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets that standalone mode does not bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory (may be empty but must exist for Next.js to serve static files)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema and migrations (needed for prisma migrate deploy at startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy the Prisma engine binaries and generated client from the standalone output.
# The standalone build already includes @prisma/client in its node_modules, but we
# also need the .prisma/client directory with the generated engine binaries.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Install the prisma CLI for running migrations at startup.
# We install it globally so it is available without npx.
RUN npm install -g prisma@6

# Create data directory for SQLite (if used) and ensure correct ownership
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check using wget (curl is not available in alpine by default)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run migrations then start the standalone Next.js server.
# prisma migrate deploy is safe to run on every boot -- it only applies pending migrations.
CMD ["sh", "-c", "prisma migrate deploy --schema=./prisma/schema.prisma && node server.js"]
