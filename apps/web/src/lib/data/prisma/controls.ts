/**
 * Prisma Controls Data Layer
 */

export async function list(frameworkKey?: string) {
  // return prisma.control.findMany({
  //   where: frameworkKey ? { framework: { key: frameworkKey } } : {},
  //   include: { framework: true },
  //   orderBy: { code: "asc" },
  // });
  
  throw new Error(`Prisma not configured. FrameworkKey: ${frameworkKey}`);
}

export async function get(id: string) {
  // return prisma.control.findUnique({
  //   where: { id },
  //   include: { framework: true },
  // });
  
  throw new Error(`Prisma not configured. Id: ${id}`);
}

export async function getWithEvidence(orgId: string, id: string) {
  // return prisma.control.findUnique({
  //   where: { id },
  //   include: {
  //     framework: true,
  //     controlEvidence: {
  //       where: { orgId },
  //       include: { evidenceItem: true },
  //     },
  //   },
  // });
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, Id: ${id}`);
}

