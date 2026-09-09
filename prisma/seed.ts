import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Resetting & Seeding Danica Gold Philippines Database (PHP - ₱)...');

  // Clear existing records cleanly
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.layawayContract.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.goldRate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSettings.deleteMany();

  // 1. Seed Site Settings (Philippines Headquarters & Brand)
  console.log('⚙️ Seeding Site Settings...');
  await prisma.siteSettings.create({
    data: {
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
  console.log('📈 Seeding Gold Spot Rates in PHP (₱)...');
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

  // 3. Seed Users
  console.log('👤 Seeding Users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@danicagold.com',
      name: 'Danica Executive Admin',
      phone: '+63 (02) 8888-GOLD',
      role: 'ADMIN',
      password: 'Aianbasagre24',
      address: 'BGC Taguig & Ongpin Flagship Vault',
      city: 'Metro Manila',
      zipCode: '1634',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'sophia.laurent@danicagold.ph',
      name: 'Sophia Laurent',
      phone: '+63 917 234 5678',
      role: 'CUSTOMER',
      address: 'Ayala Alabang Village, Muntinlupa City',
      city: 'Metro Manila',
      zipCode: '1780',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'marcus.vance@danicagold.ph',
      name: 'Marcus Vance',
      phone: '+63 918 987 6543',
      role: 'CUSTOMER',
      address: 'Forbes Park, Makati City',
      city: 'Metro Manila',
      zipCode: '1219',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    },
  });

  // 4. Seed Exquisite Gold Jewelry Pieces with Philippine Peso (₱) Pricing
  console.log('💍 Seeding Fine Gold Jewelry Collection in PHP (₱)...');
  const jewelryProducts = [
    {
      name: '22K Royal Emirates Diamond-Cut Rope Chain (35.5g)',
      slug: '22k-royal-emirates-rope-chain',
      description: 'Handcrafted solid 22-karat Dubai gold with micro-precision diamond cuts that catch light with every movement. Features a heavy-duty barrel safety clasp and certified 916 purity hallmark.',
      category: 'NECKLACES',
      karat: '22K',
      purityPercentage: 0.916,
      weightGrams: 35.5,
      craftFee: 15320.0,
      basePrice: 172940.0, // 35.5g * 4440 + 15320
      isAutoPriced: true,
      stockQuantity: 8,
      isFeatured: true,
      hallmarkCertNumber: 'DG-DXB-916-4412',
      dimensions: '24 inches length, 4.5mm width',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800',
      ]),
    },
    {
      name: '18K Solid Miami Cuban Link Bracelet (45g)',
      slug: '18k-miami-cuban-link-bracelet-45g',
      description: 'Substantial 45-gram solid 18K Saudi gold Miami Cuban link bracelet. Features flat, mirror-polished links with custom double safety side latches and laser hallmark engraving.',
      category: 'BRACELETS',
      karat: '18K',
      purityPercentage: 0.750,
      weightGrams: 45.0,
      craftFee: 18000.0,
      basePrice: 181800.0, // 45g * 3640 + 18000
      isAutoPriced: true,
      stockQuantity: 6,
      isFeatured: true,
      hallmarkCertNumber: 'DG-18K-CUB-9901',
      dimensions: '8.5 inches length, 8.0mm width',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1611591475879-a164c0e6659a?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800',
      ]),
    },
    {
      name: '18K Imperial Solitaire Crown Ring (9.2g)',
      slug: '18k-imperial-solitaire-crown-ring',
      description: 'Regal 18K yellow gold statement band adorned with high-grade pavé prongs. Engineered with a silky comfort-fit interior profile for everyday elegance.',
      category: 'RINGS',
      karat: '18K',
      purityPercentage: 0.750,
      weightGrams: 9.2,
      craftFee: 9500.0,
      basePrice: 42988.0, // 9.2g * 3640 + 9500
      isAutoPriced: true,
      stockQuantity: 12,
      isFeatured: true,
      hallmarkCertNumber: 'DG-18K-RNG-3341',
      dimensions: 'Size 7 (Resizable 5-10)',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=800',
      ]),
    },
    {
      name: '24K Sovereign Dragon Medallion Pendant (18g)',
      slug: '24k-sovereign-dragon-medallion-pendant',
      description: 'Solid 24-karat pure 999.9 gold medallion featuring high-relief imperial dragon artwork representing strength, good fortune, and majesty. Accompanied by a heavy 24K solid bail.',
      category: 'PENDANTS',
      karat: '24K',
      purityPercentage: 0.999,
      weightGrams: 18.0,
      craftFee: 12000.0,
      basePrice: 99300.0, // 18g * 4850 + 12000
      isAutoPriced: true,
      stockQuantity: 10,
      isFeatured: true,
      hallmarkCertNumber: 'DG-24K-PDT-7722',
      dimensions: '32mm diameter, 2.5mm thickness',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&q=80&w=800',
      ]),
    },
    {
      name: '18K Florentine Filigree Teardrop Earrings (11.5g)',
      slug: '18k-florentine-filigree-teardrop-earrings',
      description: 'Exquisite Italian filigree openwork in 18K solid yellow gold. Light-catching satin engraving with secure French lever backs for effortless all-day luxury.',
      category: 'EARRINGS',
      karat: '18K',
      purityPercentage: 0.750,
      weightGrams: 11.5,
      craftFee: 10000.0,
      basePrice: 51860.0, // 11.5g * 3640 + 10000
      isAutoPriced: true,
      stockQuantity: 9,
      isFeatured: false,
      hallmarkCertNumber: 'DG-18K-EAR-5120',
      dimensions: '42mm drop length',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800',
      ]),
    },
    {
      name: '18K Rose Gold Eternity Hinged Bangle (22.0g)',
      slug: '18k-rose-gold-eternity-bangle',
      description: 'Modern 18-karat rose gold hinged cuff bracelet combining mirror polish and satin brush finishes. Equipped with an invisible push-button clasp and dual safety locks.',
      category: 'BANGLES',
      karat: '18K',
      purityPercentage: 0.750,
      weightGrams: 22.0,
      craftFee: 11500.0,
      basePrice: 91580.0, // 22g * 3640 + 11500
      isAutoPriced: true,
      stockQuantity: 11,
      isFeatured: true,
      hallmarkCertNumber: 'DG-18K-BNG-8812',
      dimensions: '60mm inner diameter, 6mm width',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1611591475879-a164c0e6659a?auto=format&fit=crop&q=80&w=800',
      ]),
    },
    {
      name: '14K Italian Figaro Link Necklace (26.0g)',
      slug: '14k-italian-figaro-necklace-26g',
      description: 'Classic 3+1 Figaro chain manufactured in Vicenza, Italy from genuine solid 14K gold (585 hallmark). Solid link construction with supreme shine and durability.',
      category: 'NECKLACES',
      karat: '14K',
      purityPercentage: 0.585,
      weightGrams: 26.0,
      craftFee: 9000.0,
      basePrice: 82840.0, // 26g * 2840 + 9000
      isAutoPriced: true,
      stockQuantity: 14,
      isFeatured: false,
      hallmarkCertNumber: 'DG-585-ITA-1190',
      dimensions: '22 inches length, 5.0mm width',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
      ]),
    },
    {
      name: '24K Pure Gold Lotus Blossom Pendant (14.0g)',
      slug: '24k-pure-gold-lotus-blossom-pendant',
      description: 'Masterfully embossed 24K solid pure gold pendant depicting a blooming lotus flower. Symbolizes grace, purity, and spiritual renewal, with high-relief 3D sculpted petals.',
      category: 'PENDANTS',
      karat: '24K',
      purityPercentage: 0.999,
      weightGrams: 14.0,
      craftFee: 11000.0,
      basePrice: 78900.0, // 14g * 4850 + 11000
      isAutoPriced: true,
      stockQuantity: 15,
      isFeatured: true,
      hallmarkCertNumber: 'DG-24K-LOTUS-3301',
      dimensions: '28mm diameter',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&q=80&w=800',
      ]),
    },
    {
      name: '18K Pavé Diamond Floral Cluster Ring (8.5g)',
      slug: '18k-pave-diamond-floral-cluster-ring',
      description: 'Dazzling cocktail ring in 18K solid yellow and white gold. Features intricately set pavé gemstones forming an organic blooming flower design with mirror-polished shanks.',
      category: 'RINGS',
      karat: '18K',
      purityPercentage: 0.750,
      weightGrams: 8.5,
      craftFee: 11000.0,
      basePrice: 41940.0, // 8.5g * 3640 + 11000
      isAutoPriced: true,
      stockQuantity: 7,
      isFeatured: false,
      hallmarkCertNumber: 'DG-18K-FLR-2290',
      dimensions: 'Size 6.5 (Resizable)',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=800',
      ]),
    },
  ];

  const createdProducts = [];
  for (const prod of jewelryProducts) {
    const p = await prisma.product.create({
      data: prod,
    });
    createdProducts.push(p);
  }

  // 5. Seed an Example Cash Order (Necklace Jewelry in PHP)
  console.log('📦 Seeding Sample Cash Jewelry Order in PHP (₱)...');
  const cashOrder = await prisma.order.create({
    data: {
      orderNumber: 'DG-2026-001',
      userId: customer1.id,
      orderType: 'CASH',
      status: 'DELIVERED',
      totalGoldWeightGrams: 18.0,
      subtotal: 99300.0,
      craftFeeTotal: 12000.0,
      tax: 0.0,
      totalAmount: 99300.0,
      shippingAddress: 'Ayala Alabang Village, Muntinlupa City, Metro Manila 1780',
      trackingNumber: 'LBC-882190341',
      courier: 'LBC / Danica Armored Express',
      orderItems: {
        create: [
          {
            productId: createdProducts[3].id, // 24K Sovereign Dragon Pendant
            quantity: 1,
            lockedGoldPricePerGram: 4850.00,
            karat: '24K',
            weightGrams: 18.0,
            craftFee: 12000.0,
            unitPrice: 99300.0,
            totalPrice: 99300.0,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentNumber: 'PAY-2026-001',
            invoiceNumber: 'INV-2026-001',
            userId: customer1.id,
            amount: 99300.0,
            paymentMethod: 'GCASH',
            paymentType: 'FULL_ORDER',
            status: 'SUCCESS',
            referenceCode: 'GCASH-9912034',
            notes: 'Paid in full via GCash for 24K Dragon Medallion Pendant',
          },
        ],
      },
    },
  });

  // 6. Seed an Active Layaway Contract Order (18K Cuban Link Bracelet in PHP)
  console.log('📑 Seeding Active Layaway Jewelry Contract in PHP (₱)...');
  const layawayOrder = await prisma.order.create({
    data: {
      orderNumber: 'DG-2026-002',
      userId: customer2.id,
      orderType: 'LAYAWAY',
      status: 'PROCESSING',
      totalGoldWeightGrams: 45.0,
      subtotal: 181800.0,
      craftFeeTotal: 18000.0,
      tax: 0.0,
      totalAmount: 181800.0,
      shippingAddress: 'Forbes Park, Makati City, Metro Manila 1219',
      courier: 'Brinks Vault Courier Philippines',
      orderItems: {
        create: [
          {
            productId: createdProducts[1].id, // 18K Solid Cuban Link Bracelet
            quantity: 1,
            lockedGoldPricePerGram: 3640.00,
            karat: '18K',
            weightGrams: 45.0,
            craftFee: 18000.0,
            unitPrice: 181800.0,
            totalPrice: 181800.0,
          },
        ],
      },
    },
  });

  // Create Layaway Contract for Order 2 (30% down, 6 months)
  const totalLayawayAmt = 181800.0;
  const downPayment = 54540.0; // 30%
  const remaining = 127260.0;
  const monthly = 21210.0; // 6 months
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + 6);

  const nextDue = new Date();
  nextDue.setMonth(nextDue.getMonth() + 1);

  const layawayContract = await prisma.layawayContract.create({
    data: {
      contractNumber: 'LAY-2026-001',
      orderId: layawayOrder.id,
      userId: customer2.id,
      totalAmount: totalLayawayAmt,
      downPaymentAmount: downPayment,
      downPaymentPercent: 30,
      remainingBalance: remaining - monthly, // 1 installment already paid!
      termMonths: 6,
      monthlyInstallment: monthly,
      lockedGoldSpotRate: 4850.00,
      status: 'ACTIVE',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      dueDate: dueDate,
      nextDueDate: nextDue,
      notes: 'Customer locked in gold spot price at ₱4,850/g for 18K Cuban Link Bracelet. Installment 1 completed on time via GCash.',
    },
  });

  // Create Downpayment & 1st Installment record
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-002',
      invoiceNumber: 'INV-2026-002',
      userId: customer2.id,
      orderId: layawayOrder.id,
      contractId: layawayContract.id,
      amount: downPayment,
      paymentMethod: 'GCASH',
      paymentType: 'DOWN_PAYMENT',
      status: 'SUCCESS',
      referenceCode: 'GCASH-DP-892100',
      notes: 'Initial 30% down payment deposit received for 18K Cuban Bracelet via GCash.',
    },
  });

  // Create 6 monthly installments for the contract
  for (let i = 1; i <= 6; i++) {
    const instDate = new Date();
    instDate.setMonth(instDate.getMonth() - 1 + i);

    const isPaid = i === 1;
    const inst = await prisma.installment.create({
      data: {
        contractId: layawayContract.id,
        installmentNumber: i,
        dueDate: instDate,
        amountDue: monthly,
        amountPaid: isPaid ? monthly : 0,
        status: isPaid ? 'PAID' : 'PENDING',
        paidAt: isPaid ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
        receiptNumber: isPaid ? 'REC-2026-001' : null,
      },
    });

    if (isPaid) {
      await prisma.payment.create({
        data: {
          paymentNumber: 'PAY-2026-003',
          invoiceNumber: 'REC-2026-001',
          userId: customer2.id,
          orderId: layawayOrder.id,
          contractId: layawayContract.id,
          installmentId: inst.id,
          amount: monthly,
          paymentMethod: 'MAYA',
          paymentType: 'INSTALLMENT',
          status: 'SUCCESS',
          referenceCode: 'MAYA-INST-001',
          notes: 'Installment #1 of 6 processed via Maya.',
        },
      });
    }
  }

  console.log('✅ Danica Gold Philippines Database Seeded Successfully with PHP (₱) Values!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
