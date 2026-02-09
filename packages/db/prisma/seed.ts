import { prisma } from "../src/client";

async function main() {
  const soc2 = await prisma.framework.upsert({
    where: { key: "SOC2" },
    update: { name: "SOC 2", version: "2017", description: "Trust Services Criteria (minimal Security set)" },
    create: { key: "SOC2", name: "SOC 2", version: "2017", description: "Trust Services Criteria (minimal Security set)" },
  });

  const iso = await prisma.framework.upsert({
    where: { key: "ISO27001" },
    update: { name: "ISO/IEC 27001", version: "2022", description: "ISO 27001 Annex A (basic starter set)" },
    create: { key: "ISO27001", name: "ISO/IEC 27001", version: "2022", description: "ISO 27001 Annex A (basic starter set)" },
  });

  const soc2Controls = [
    { code: "CC6.1", title: "Logical access controls", category: "Security", description: "The entity implements logical access security measures." },
    { code: "CC6.6", title: "Vulnerability management", category: "Security", description: "The entity manages vulnerabilities and remediates in a timely manner." },
    { code: "CC7.2", title: "Monitoring for anomalies", category: "Security", description: "The entity monitors for security events and anomalies." },
    { code: "CC7.3", title: "Incident response", category: "Security", description: "The entity responds to detected security incidents." },
  ];

  const isoControls = [
    { code: "A.5.1", title: "Policies for information security", category: "Organizational", description: "Security policies are defined, approved, and communicated." },
    { code: "A.5.15", title: "Access control", category: "Organizational", description: "Rules for access control are established and maintained." },
    { code: "A.8.2", title: "Privileged access rights", category: "People", description: "Privileged access is restricted and managed." },
    { code: "A.8.8", title: "Management of technical vulnerabilities", category: "Technological", description: "Technical vulnerabilities are identified and addressed." },
  ];

  for (const c of soc2Controls) {
    await prisma.control.upsert({
      where: { frameworkId_code: { frameworkId: soc2.id, code: c.code } },
      update: { title: c.title, category: c.category, description: c.description },
      create: { frameworkId: soc2.id, code: c.code, title: c.title, category: c.category, description: c.description },
    });
  }

  for (const c of isoControls) {
    await prisma.control.upsert({
      where: { frameworkId_code: { frameworkId: iso.id, code: c.code } },
      update: { title: c.title, category: c.category, description: c.description },
      create: { frameworkId: iso.id, code: c.code, title: c.title, category: c.category, description: c.description },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


