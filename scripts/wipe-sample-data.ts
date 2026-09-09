import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Wiping all sample data from Neon Cloud Database...');

  // 1. Delete all transactional records
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.layawayContract.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  // 2. Delete all sample products
  await prisma.product.deleteMany();

  // 3. Delete all non-admin users (keep only ADMIN)
  await prisma.user.deleteMany({
    where: {
      role: 'CUSTOMER',
    },
  });

  // Ensure Admin User exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@danicagold.com',
        name: 'Aian Basagre (Admin)',
        phone: '+63 (02) 8888-GOLD',
        role: 'ADMIN',
        password: 'Aianbasagre24',
        address: 'BGC Taguig Flagship Vault',
        city: 'Metro Manila',
      },
    });
  }

  // Ensure Site Settings exist
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        id: 'default_settings',
        companyName: 'DANICA GOLD PHILIPPINES',
        tagline: 'Haute Joaillerie & Certified Fine Gold House',
        phone: '+63 (02) 8888-GOLD',
        email: 'inquiries@danicagold.ph',
        address: 'Greenhills Mall / Ongpin St, Binondo, Manila, Philippines',
        currencySymbol: '₱',
        goldAccentColor: '#D4AF37',
      },
    });
  }

  // Ensure Gold Rates exist
  const rates = [
    { karat: '24K', purityRatio: 0.999, pricePerGram: 4850.00, change24h: 1.45 },
    { karat: '22K', purityRatio: 0.916, pricePerGram: 4440.00, change24h: 1.28 },
    { karat: '18K', purityRatio: 0.750, pricePerGram: 3640.00, change24h: 0.95 },
    { karat: '14K', purityRatio: 0.585, pricePerGram: 2840.00, change24h: 0.82 },
    { karat: '10K', purityRatio: 0.417, pricePerGram: 2020.00, change24h: 0.65 },
  ];

  for (const rate of rates) {
    await prisma.goldRate.upsert({
      where: { karat: rate.karat },
      update: rate,
      create: rate,
    });
  }

  console.log('✅ Neon Cloud Database Cleaned! All sample users, products, orders, and contracts removed.');
}

main()
  .catch((e) => {
    console.error('Error wiping sample data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
