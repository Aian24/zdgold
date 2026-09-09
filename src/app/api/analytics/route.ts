import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      orders,
      layawayContracts,
      allPayments,
      products,
      users,
      spotRates,
    ] = await Promise.all([
      prisma.order.findMany({
        include: {
          orderItems: {
            include: { product: true },
          },
          layawayContract: true,
          payments: true,
        },
      }),
      prisma.layawayContract.findMany({
        include: {
          user: true,
          installments: true,
          payments: true,
        },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: true, order: true },
      }),
      prisma.product.findMany(),
      prisma.user.findMany(),
      prisma.goldRate.findMany({
        orderBy: { karat: 'desc' },
      }),
    ]);

    // 1. Total actual collected cash from all successful payments
    const successfulPayments = allPayments.filter((p) => p.status === 'SUCCESS');
    const totalCollectedRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

    // 2. Total gold grams sold
    const totalGoldGramsSold = orders.reduce(
      (sum, o) => sum + (o.totalGoldWeightGrams || 0),
      0
    );

    // 3. Active Layaway Stats
    const activeContracts = layawayContracts.filter((c) => c.status === 'ACTIVE');
    const completedContracts = layawayContracts.filter(
      (c) => c.status === 'COMPLETED' || c.status === 'SETTLED'
    );
    const totalLayawayReceivables = activeContracts.reduce(
      (sum, c) => sum + (c.remainingBalance || 0),
      0
    );
    const totalLayawayContractValue = activeContracts.reduce(
      (sum, c) => sum + (c.totalAmount || 0),
      0
    );

    // 4. Low stock inventory
    const lowStockProducts = products.filter((p) => p.stockQuantity <= 5);

    // 5. Overdue installments count
    const now = new Date();
    let overdueInstallmentsCount = 0;
    for (const contract of activeContracts) {
      for (const inst of contract.installments) {
        if (inst.status !== 'PAID' && new Date(inst.dueDate) < now) {
          overdueInstallmentsCount++;
        }
      }
    }

    // 6. Dynamic Monthly Sales & Cash Collections Series (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthlySales = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const monthLabel = monthNames[targetMonth];
      const fullLabel = fullMonthNames[targetMonth];

      const paymentsInMonth = successfulPayments.filter((p) => {
        const pDate = new Date(p.createdAt);
        return pDate.getFullYear() === targetYear && pDate.getMonth() === targetMonth;
      });

      const upfront = paymentsInMonth
        .filter((p) => p.paymentType === 'FULL_ORDER' || (!['DOWN_PAYMENT', 'INSTALLMENT'].includes(p.paymentType)))
        .reduce((sum, p) => sum + p.amount, 0);

      const layaway = paymentsInMonth
        .filter((p) => ['DOWN_PAYMENT', 'INSTALLMENT', 'SETTLEMENT'].includes(p.paymentType))
        .reduce((sum, p) => sum + p.amount, 0);

      monthlySales.push({
        month: monthLabel,
        fullMonth: fullLabel,
        year: targetYear,
        upfront,
        layaway,
        total: upfront + layaway,
      });
    }

    // Peak Month & MoM growth calculation
    let peakMonthName = monthlySales[0]?.fullMonth || 'N/A';
    let peakMonthValue = 0;
    monthlySales.forEach((m) => {
      if (m.total >= peakMonthValue) {
        peakMonthValue = m.total;
        peakMonthName = m.fullMonth;
      }
    });

    const currentMonthSales = monthlySales[5]?.total || 0;
    const previousMonthSales = monthlySales[4]?.total || 0;
    let momGrowthText = '+0.0% MoM';
    if (previousMonthSales > 0) {
      const growth = ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;
      momGrowthText = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% MoM Growth`;
    } else if (currentMonthSales > 0) {
      momGrowthText = '+100.0% MoM Growth';
    }

    // 7. Dynamic Category Distribution
    const categoryColors: Record<string, string> = {
      NECKLACES: '#D4AF37', // Royal Gold
      RINGS: '#B8860B',     // Dark Gold
      BRACELETS: '#E5C158', // Light Gold
      BANGLES: '#C59B27',   // Classic Gold
      PENDANTS: '#996515',  // Deep Bronze Gold
      EARRINGS: '#F4E297',  // Champagne Gold
      JEWELRY: '#DAA520',   // Goldenrod
    };

    const categoryNamesMap: Record<string, string> = {
      NECKLACES: 'Necklaces & Chains',
      RINGS: 'Rings & Solitaires',
      BRACELETS: 'Bracelets & Bangles',
      BANGLES: 'Bangles & Cuffs',
      PENDANTS: 'Pendants & Medallions',
      EARRINGS: 'Earrings & Studs',
      JEWELRY: 'Fine Gold Jewelry',
    };

    // Calculate category values based on sold items (if any), otherwise product inventory
    const catMap: Record<string, { name: string; category: string; count: number; value: number }> = {};

    // First, accumulate from order items
    let hasOrderItems = false;
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        hasOrderItems = true;
        const catKey = item.product?.category || 'JEWELRY';
        if (!catMap[catKey]) {
          catMap[catKey] = {
            name: categoryNamesMap[catKey] || catKey,
            category: catKey,
            count: 0,
            value: 0,
          };
        }
        catMap[catKey].count += item.quantity || 1;
        catMap[catKey].value += item.totalPrice || 0;
      });
    });

    // If no order items exist yet, build from catalog products
    if (!hasOrderItems && products.length > 0) {
      products.forEach((prod) => {
        const catKey = prod.category || 'JEWELRY';
        if (!catMap[catKey]) {
          catMap[catKey] = {
            name: categoryNamesMap[catKey] || catKey,
            category: catKey,
            count: 0,
            value: 0,
          };
        }
        catMap[catKey].count += 1;
        catMap[catKey].value += prod.basePrice || 0;
      });
    }

    const totalCategoryValue = Object.values(catMap).reduce((sum, c) => sum + c.value, 0) || 1;
    const categorySales = Object.values(catMap).map((cat) => ({
      name: cat.name,
      category: cat.category,
      count: cat.count,
      value: cat.value,
      percentage: Math.round((cat.value / totalCategoryValue) * 100),
      color: categoryColors[cat.category] || '#D4AF37',
    })).sort((a, b) => b.value - a.value);

    // If still empty (e.g. completely blank database)
    if (categorySales.length === 0) {
      categorySales.push({
        name: 'Fine Gold Jewelry',
        category: 'JEWELRY',
        count: 0,
        value: 0,
        percentage: 100,
        color: '#D4AF37',
      });
    }

    // Total Catalog / Inventory Volume
    const totalCatalogVolume = products.reduce((sum, p) => sum + (p.basePrice * (p.stockQuantity || 1)), 0);

    // 8. Dynamic Karat Purity Breakdown
    const karatLabels: Record<string, string> = {
      '24K': '99.9% Pure Solid Gold',
      '22K': '91.6% Gulf / Saudi Gold',
      '18K': '75.0% Fine Italian Gold',
      '14K': '58.5% Solid Everyday Gold',
      '10K': '41.7% Standard Fine Gold',
    };

    const karatMassMap: Record<string, number> = {
      '24K': 0,
      '22K': 0,
      '18K': 0,
      '14K': 0,
      '10K': 0,
    };

    // Calculate mass from products and order items
    products.forEach((prod) => {
      const k = prod.karat?.toUpperCase() || '18K';
      if (karatMassMap[k] !== undefined) {
        karatMassMap[k] += prod.weightGrams * (prod.stockQuantity || 1);
      } else {
        karatMassMap[k] = (karatMassMap[k] || 0) + prod.weightGrams * (prod.stockQuantity || 1);
      }
    });

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const k = item.karat?.toUpperCase() || '18K';
        if (karatMassMap[k] !== undefined) {
          karatMassMap[k] += (item.weightGrams || 0) * (item.quantity || 1);
        }
      });
    });

    const totalKaratMass = Object.values(karatMassMap).reduce((sum, g) => sum + g, 0) || 1;
    const karatBreakdown = Object.entries(karatMassMap)
      .map(([karat, grams]) => ({
        karat,
        grams: Number(grams.toFixed(2)),
        percentage: totalKaratMass > 0 ? Math.round((grams / totalKaratMass) * 100) : 0,
        label: karatLabels[karat] || 'Certified Solid Gold',
      }))
      .filter((k) => k.grams > 0 || ['24K', '22K', '18K', '14K'].includes(k.karat))
      .sort((a, b) => b.grams - a.grams);

    const customerCount = users.filter((u) => u.role === 'CUSTOMER').length || users.length;

    return NextResponse.json({
      success: true,
      analytics: {
        totalCollectedRevenue,
        totalGoldGramsSold: Number(totalGoldGramsSold.toFixed(2)),
        totalOrdersCount: orders.length,
        activeLayawayContractsCount: activeContracts.length,
        completedLayawayContractsCount: completedContracts.length,
        totalLayawayReceivables,
        totalLayawayContractValue,
        overdueInstallmentsCount,
        productCount: products.length,
        customerCount,
        lowStockCount: lowStockProducts.length,
        recentPayments: allPayments.slice(0, 10),
        spotRates,
        monthlySales,
        peakMonth: {
          name: peakMonthName,
          amount: peakMonthValue,
        },
        momGrowthText,
        categorySales,
        totalCatalogVolume,
        totalCategoryValue: totalCategoryValue === 1 && categorySales[0]?.value === 0 ? 0 : totalCategoryValue,
        karatBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching live analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live analytics' },
      { status: 500 }
    );
  }
}
