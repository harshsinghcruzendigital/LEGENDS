/**
 * Seed — ports the deterministic mock dataset into Postgres so a fresh DB matches
 * exactly what the app shows on mock. Idempotent (clears then re-inserts).
 * Run: `npm run db:seed` (after `npm run db:push`).
 */
import { PrismaClient } from "@prisma/client";
import { LEADS } from "@/lib/mock/leads";
import { CAMPAIGNS } from "@/lib/mock/campaigns";
import { WORKFLOWS } from "@/lib/mock/workflows";
import { hashPassword } from "@/server/password";

const prisma = new PrismaClient();

const DEMO_EMAIL = "alex@brightpixel.agency";
const DEMO_PASSWORD = "demodemo";

async function main() {
  console.log(`Seeding ${LEADS.length} leads, ${CAMPAIGNS.length} campaigns, ${WORKFLOWS.length} workflows…`);

  await prisma.session.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sequenceStep.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.org.deleteMany();

  await prisma.org.create({
    data: { id: "org_demo", name: "BrightPixel Agency", slug: "brightpixel" },
  });

  // Demo user (the "Use demo account" button signs in as this user → populated org).
  await prisma.user.create({
    data: {
      id: "user_demo",
      email: DEMO_EMAIL,
      name: "Alex Rivera",
      passwordHash: hashPassword(DEMO_PASSWORD),
      avatarUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(DEMO_EMAIL)}`,
      memberships: { create: { orgId: "org_demo", role: "OWNER" } },
    },
  });
  console.log(`   demo login → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  for (const l of LEADS) {
    await prisma.lead.create({
      data: {
        id: l.id,
        orgId: "org_demo",
        company: l.company,
        domain: l.domain,
        website: l.website,
        ownerName: l.ownerName,
        industry: l.industry,
        category: l.category,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        opportunityType: l.opportunityType as any,
        country: l.country,
        countryCode: l.countryCode,
        state: l.state,
        city: l.city,
        employees: l.employees,
        revenueMinor: BigInt(l.revenueMinor),
        currency: l.currency,
        techStack: l.techStack,
        cms: l.cms,
        hosting: l.hosting,
        domainAgeDays: l.domainAgeDays,
        trafficBand: l.trafficBand,
        leadScore: l.leadScore,
        websiteScore: l.websiteScore,
        uiScore: l.uiScore,
        seoScore: l.seoScore,
        appScore: l.appScore ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scoreFactors: l.scoreFactors as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        websiteStatus: l.websiteStatus as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        appStatus: l.appStatus as any,
        playStoreUrl: l.playStoreUrl ?? null,
        appStoreUrl: l.appStoreUrl ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stage: l.stage as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: l.status as any,
        assignedTo: l.assignedTo ?? null,
        tags: l.tags,
        hasVerifiedEmail: l.contacts.some((c) => c.emailStatus === "VALID"),
        source: l.source,
        screenshotUrl: l.screenshotUrl,
        logoUrl: l.logoUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        websiteAudit: l.websiteAudit as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiAudit: l.uiAudit as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activity: l.activity as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notes: l.notes as any,
        createdAt: new Date(l.createdAt),
        updatedAt: new Date(l.updatedAt),
        contacts: {
          create: l.contacts.map((c, i) => ({
            id: `${l.id}_ct${i}`,
            orgId: "org_demo",
            fullName: c.fullName,
            title: c.title,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            role: c.role as any,
            email: c.email,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            emailStatus: c.emailStatus as any,
            emailConfidence: c.emailConfidence,
            phone: c.phone ?? null,
            linkedin: c.linkedin ?? null,
            isPrimary: c.isPrimary,
          })),
        },
      },
    });
  }

  for (const c of CAMPAIGNS) {
    await prisma.campaign.create({
      data: {
        id: c.id,
        orgId: "org_demo",
        name: c.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: c.status as any,
        mailbox: c.mailbox,
        audience: c.audience,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stats: c.stats as any,
        createdAt: new Date(c.createdAt),
        steps: {
          create: c.steps.map((s) => ({
            id: `${c.id}_${s.id}`,
            order: s.order,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            channel: s.channel as any,
            delayDays: s.delayDays,
            subject: s.subject,
            body: s.body,
          })),
        },
      },
    });
  }

  for (const w of WORKFLOWS) {
    await prisma.workflow.create({
      data: {
        id: w.id,
        orgId: "org_demo",
        name: w.name,
        description: w.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: w.status as any,
        runs: w.runs,
        successRate: w.successRate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodes: w.nodes as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        edges: w.edges as any,
        updatedAt: new Date(w.updatedAt),
      },
    });
  }

  console.log("✅ Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
