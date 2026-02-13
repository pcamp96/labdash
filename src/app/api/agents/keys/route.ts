import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { agentManager } from "@/lib/agents/manager";

// GET /api/agents/keys - List all agent API keys
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await agentManager.listApiKeys();
    return NextResponse.json(keys);
  } catch (error) {
    console.error("Error listing agent keys:", error);
    return NextResponse.json(
      { error: "Failed to list agent keys" },
      { status: 500 }
    );
  }
}

// POST /api/agents/keys - Generate new agent API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, expiresInDays } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { key, id } = await agentManager.generateApiKey(name, expiresInDays);

    return NextResponse.json({
      id,
      key, // Return the actual key ONCE - user must save it
      message: "Save this key securely - it won't be shown again!",
    });
  } catch (error) {
    console.error("Error generating agent key:", error);
    return NextResponse.json(
      { error: "Failed to generate agent key" },
      { status: 500 }
    );
  }
}
