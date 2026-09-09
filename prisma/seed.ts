import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing Clean Danica Gold Philippines Database (PHP - ₱)...');

  // 1. Seed Site Settings (Philippines Headquarters & Brand)
  console.log('⚙️ Initializing Site Settings...');
  await prisma.siteSettings.upsert({
    where: { id: 'default_settings' },
    update: {},
    create: {
      id: 'default_settings',
      companyName: 'DANICA GOLD PHILIPPINES',
      tagline: 'Haute Joaillerie & Certified Fine Gold House',
      logoUrl: '',
      phone: '+63 (02) 8888-GOLD / +63 917 123 4567',
      email: 'inquiries@danicagold.ph',
      address: 'Greenhills Mall / Ongpin St, Binondo, Manila, Philippines',
      currencySymbol: '₱',
      goldAccentColor: '#D4AF37',
    },
  });

  // 2. Seed Gold Spot Rates (Philippine Peso per gram)
  console.log('📈 Initializing Gold Spot Rates in PHP (₱)...');
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

  // 3. Ensure Admin User
  console.log('👤 Ensuring Admin Account...');
  await prisma.user.upsert({
    where: { email: 'admin@danicagold.com' },
    update: {},
    create: {
      email: 'admin@danicagold.com',
      name: 'Aian Basagre (Admin)',
      phone: '+63 (02) 8888-GOLD',
      role: 'ADMIN',
      password: 'Aianbasagre24',
      address: 'BGC Taguig & Ongpin Flagship Vault',
      city: 'Metro Manila',
    },
  });

  console.log('✅ Clean Database Initialized! No sample users, orders, or mock items.');
}

main()
  .catch((e) => {
    console.error('❌ Initialization error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
