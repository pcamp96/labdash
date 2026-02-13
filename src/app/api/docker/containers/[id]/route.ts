import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getContainer } from "@/lib/docker/client";

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
    const container = await getContainer(id);
    return NextResponse.json(container);
  } catch (error) {
    console.error("Error fetching container:", error);
    return NextResponse.json(
      { error: "Failed to fetch container" },
      { status: 500 }
    );
  }
}
