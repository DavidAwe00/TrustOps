/**
 * Prisma Frameworks Data Layer
 */

export async function list() {
  // return prisma.framework.findMany({
  //   orderBy: { name: "asc" },
  // });
  
  throw new Error("Prisma not configured. Set TRUSTOPS_DEMO=1 or configure DATABASE_URL");
}

export async function get(key: string) {
  // return prisma.framework.findUnique({
  //   where: { key },
  // });
  
  throw new Error(`Prisma not configured. Key: ${key}`);
}

export async function getStats(orgId: string, frameworkKey: string) {
  // const framework = await prisma.framework.findUnique({
  //   where: { key: frameworkKey },
  //   include: {
  //     controls: {
  //       include: {
  //         controlEvidence: {
  //           where: { orgId },
  //           include: {
  //             evidenceItem: {
  //               where: { reviewStatus: "APPROVED" },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // });
  // 
  // if (!framework) return null;
  // 
  // const totalControls = framework.controls.length;
  // const coveredControls = framework.controls.filter(
  //   (c) => c.controlEvidence.length > 0
  // ).length;
  // 
  // return {
  //   framework: { key: framework.key, name: framework.name, version: framework.version },
  //   totalControls,
  //   coveredControls,
  //   gapCount: totalControls - coveredControls,
  //   coveragePercent: Math.round((coveredControls / totalControls) * 100),
  // };
  
  throw new Error(`Prisma not configured. OrgId: ${orgId}, FrameworkKey: ${frameworkKey}`);
}

