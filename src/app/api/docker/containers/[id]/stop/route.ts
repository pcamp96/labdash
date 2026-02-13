import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stopContainer } from "@/lib/docker/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await stopContainer(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error stopping container:", error);
    return NextResponse.json(
      { error: "Failed to stop container" },
      { status: 500 }
    );
  }
}
