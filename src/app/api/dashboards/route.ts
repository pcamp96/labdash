import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/dashboards - Get all dashboards for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dashboards = await prisma.dashboard.findMany({
      where: { userId: session.user.id },
      include: {
        widgets: true,
      },
      orderBy: [
        { isDefault: 'desc' }, // Default dashboard first
        { updatedAt: 'desc' },
      ],
    });

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error("Error fetching dashboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboards" },
      { status: 500 }
    );
  }
}

// POST /api/dashboards - Create a new dashboard
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, isDefault } = await request.json();

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await prisma.dashboard.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        description,
        isDefault: isDefault ?? false,
        userId: session.user.id,
        layout: {
          lg: [],
          md: [],
          sm: [],
          xs: [],
          xxs: [],
        },
      },
      include: {
        widgets: true,
      },
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error("Error creating dashboard:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard" },
      { status: 500 }
    );
  }
}
