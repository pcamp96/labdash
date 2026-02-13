-- CreateTable
CREATE TABLE "DockerHost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'agent',
    "endpoint" TEXT,
    "apiKey" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" DATETIME,
    "version" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hostId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "DockerHost_name_key" ON "DockerHost"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentKey_key_key" ON "AgentKey"("key");

-- CreateIndex
CREATE INDEX "AgentKey_key_idx" ON "AgentKey"("key");
