import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getContainerLogs } from "@/lib/docker/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tail = parseInt(searchParams.get("tail") || "100");

    const logs = await getContainerLogs(id, tail);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching container logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch container logs" },
      { status: 500 }
    );
  }
}
