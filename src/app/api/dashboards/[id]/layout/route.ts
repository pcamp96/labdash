import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/dashboards/[id]/layout
 *
 * Real-time auto-save for dashboard layout
 * This endpoint is called whenever the user drags/resizes widgets
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { layout } = await request.json();

    // Verify ownership
    const existing = await prisma.dashboard.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    // Update layout with real-time auto-save
    const dashboard = await prisma.dashboard.update({
      where: { id },
      data: {
        layout,
        updatedAt: new Date(), // Track last modification
      },
    });

    return NextResponse.json({
      success: true,
      layout: dashboard.layout,
      updatedAt: dashboard.updatedAt,
    });
  } catch (error) {
    console.error("Error updating dashboard layout:", error);
    return NextResponse.json(
      { error: "Failed to update layout" },
      { status: 500 }
    );
  }
}
