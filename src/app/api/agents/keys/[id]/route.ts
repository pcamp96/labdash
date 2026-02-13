import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { agentManager } from "@/lib/agents/manager";

// DELETE /api/agents/keys/[id] - Revoke an agent API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await agentManager.revokeApiKey(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking agent key:", error);
    return NextResponse.json(
      { error: "Failed to revoke agent key" },
      { status: 500 }
    );
  }
}
