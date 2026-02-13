import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getContainerStats } from "@/lib/docker/client";

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
    const stats = await getContainerStats(id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching container stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch container stats" },
      { status: 500 }
    );
  }
}
