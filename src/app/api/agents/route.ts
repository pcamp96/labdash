import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { agentManager } from "@/lib/agents/manager";
import { prisma } from "@/lib/db";

// GET /api/agents - List all agents and their status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all Docker hosts of type "agent"
    const hosts = await prisma.dockerHost.findMany({
      where: { type: "agent" },
      orderBy: { createdAt: "desc" },
    });

    // Get connected agents
    const connectedAgents = agentManager.getConnectedAgents();
    const connectedMap = new Map(connectedAgents.map((a) => [a.hostId, a]));

    // Combine data
    const agents = hosts.map((host) => {
      const connection = connectedMap.get(host.id);

      return {
        id: host.id,
        name: host.name,
        enabled: host.enabled,
        connected: !!connection,
        lastSeen: connection?.lastSeen || host.lastSeen,
        version: host.version,
        metadata: connection?.metadata || host.metadata,
        createdAt: host.createdAt,
      };
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error listing agents:", error);
    return NextResponse.json(
      { error: "Failed to list agents" },
      { status: 500 }
    );
  }
}
