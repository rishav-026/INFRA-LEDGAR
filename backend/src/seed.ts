import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo users...');

  // Clean existing data in dependency order for repeatable local setup
  await prisma.proof.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  const citizen = await prisma.user.create({
    data: {
      email: 'citizen@demo.com',
      displayName: 'Rahul Kumar (Citizen)',
      role: 'citizen',
    },
  });

  const contractor = await prisma.user.create({
    data: {
      id: 'con-001', // Forced ID to match the frontend mock's contractorId specifically
      email: 'build@demo.com',
      displayName: 'L&T Infrastructure',
      role: 'contractor',
      organization: 'Larsen & Toubro',
    },
  });

  const government = await prisma.user.create({
    data: {
      email: 'gov@demo.com',
      displayName: 'MoRTH Official',
      role: 'government',
      organization: 'Ministry of Road Transport',
    },
  });

  console.log('✅ Seeding completed! Created users:');
  console.log(`- ${citizen.email} (${citizen.role})`);
  console.log(`- ${contractor.email} (${contractor.role}) ID: ${contractor.id}`);
  console.log(`- ${government.email} (${government.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
