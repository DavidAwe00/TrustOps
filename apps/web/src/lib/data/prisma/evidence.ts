/**
 * Prisma Evidence Data Layer
 * 
 * TODO: Uncomment and implement when Prisma is connected
 */

// import { prisma } from "@trustops/db";

export async function list(orgId: string) {
  // return prisma.evidenceItem.findMany({
  //   where: { orgId },
  //   include: { 
  //     files: true,
  //     controlEvidence: { include: { control: true } }
  //   },
  //   orderBy: { createdAt: "desc" },
  // });
  
  throw new Error(`Prisma not configured. Set TRUSTOPS_DEMO=1 or configure DATABASE_URL. OrgId: ${orgId}`);
}

export async function get(orgId: string, id: string) {
  // return prisma.evidenceItem.findFirst({
  //   where: { id, orgId },
  //   include: { files: true, controlEvidence: true },
  // });
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, Id: ${id}`);
}

export async function create(
  orgId: string,
  data: {
    title: string;
    description?: string;
    source: string;
    controlIds?: string[];
    summary?: string;
  }
) {
  // return prisma.$transaction(async (tx) => {
  //   const item = await tx.evidenceItem.create({
  //     data: {
  //       orgId,
  //       title: data.title,
  //       description: data.description,
  //       source: data.source,
  //       summary: data.summary,
  //     },
  //   });
  //   
  //   if (data.controlIds?.length) {
  //     await tx.controlEvidence.createMany({
  //       data: data.controlIds.map((controlId) => ({
  //         orgId,
  //         controlId,
  //         evidenceItemId: item.id,
  //       })),
  //     });
  //   }
  //   
  //   return item;
  // });
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, Data: ${JSON.stringify(data)}`);
}

export async function update(
  orgId: string,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    controlIds: string[];
    summary: string;
    reviewStatus: string;
  }>
) {
  // return prisma.evidenceItem.update({
  //   where: { id, orgId },
  //   data: {
  //     title: data.title,
  //     description: data.description,
  //     summary: data.summary,
  //     reviewStatus: data.reviewStatus,
  //   },
  // });
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, Id: ${id}`);
}

export async function remove(orgId: string, id: string) {
  // await prisma.evidenceItem.delete({ where: { id, orgId } });
  // return true;
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, Id: ${id}`);
}

export async function approve(orgId: string, id: string, userId: string) {
  // return prisma.$transaction(async (tx) => {
  //   const item = await tx.evidenceItem.update({
  //     where: { id, orgId },
  //     data: { reviewStatus: "APPROVED" },
  //   });
  //   
  //   await tx.auditLog.create({
  //     data: {
  //       orgId,
  //       userId,
  //       action: "evidence.approved",
  //       resourceType: "evidence",
  //       resourceId: id,
  //       metadata: { title: item.title },
  //     },
  //   });
  //   
  //   return item;
  // });
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, Id: ${id}, UserId: ${userId}`);
}

export async function reject(orgId: string, id: string, userId: string, reason?: string) {
  // return prisma.$transaction(async (tx) => {
  //   const item = await tx.evidenceItem.update({
  //     where: { id, orgId },
  //     data: { reviewStatus: "REJECTED" },
  //   });
  //   
  //   await tx.auditLog.create({
  //     data: {
  //       orgId,
  //       userId,
  //       action: "evidence.rejected",
  //       resourceType: "evidence",
  //       resourceId: id,
  //       metadata: { title: item.title, reason },
  //     },
  //   });
  //   
  //   return item;
  // });
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, Id: ${id}, UserId: ${userId}, Reason: ${reason}`);
}

