/**
 * Prisma Audit Logs Data Layer
 */

export async function list(orgId: string, limit?: number) {
  // return prisma.auditLog.findMany({
  //   where: { orgId },
  //   orderBy: { createdAt: "desc" },
  //   take: limit,
  // });
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, Limit: ${limit}`);
}

export async function add(
  orgId: string,
  data: {
    action: string;
    resourceType: string;
    resourceId: string;
    userId: string;
    metadata?: Record<string, unknown>;
  }
) {
  // return prisma.auditLog.create({
  //   data: {
  //     orgId,
  //     action: data.action,
  //     resourceType: data.resourceType,
  //     resourceId: data.resourceId,
  //     userId: data.userId,
  //     metadata: data.metadata || {},
  //   },
  // });
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}`);
}

