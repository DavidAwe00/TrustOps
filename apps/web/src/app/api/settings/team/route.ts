import { NextResponse } from "next/server";
import { isDemo } from "@/lib/demo";

/**
 * GET /api/settings/team - Get team members
 */
export async function GET() {
  // Demo mode returns mock data
  if (isDemo()) {
    return NextResponse.json({
      members: [
        {
          id: "1",
          name: "Demo User",
          email: "demo@trustops.io",
          role: "OWNER",
          joinedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@trustops.io",
          role: "ADMIN",
          joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          name: "Bob Johnson",
          email: "bob@trustops.io",
          role: "MEMBER",
          joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    });
  }

  // TODO: Implement with Prisma
  // const members = await prisma.membership.findMany({
  //   where: { orgId: currentOrg.id },
  //   include: { user: true },
  // });

  return NextResponse.json({
    error: "Not implemented",
  }, { status: 501 });
}

