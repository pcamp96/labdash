import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContainers } from "@/lib/docker/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const containers = await listContainers(true);
    return NextResponse.json(containers);
  } catch (error) {
    console.error("Error fetching containers:", error);
    return NextResponse.json(
      { error: "Failed to fetch containers" },
      { status: 500 }
    );
  }
}
