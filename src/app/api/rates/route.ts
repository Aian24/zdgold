import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { KARAT_PURITY_RATIOS } from '@/lib/gold-pricing';

export async function GET() {
  try {
    const rates = await prisma.goldRate.findMany({
      orderBy: { karat: 'desc' },
    });

    return NextResponse.json({ success: true, rates });
  } catch (error) {
    console.error('Error fetching gold rates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gold rates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base24kPrice, change24h } = body;

    if (!base24kPrice || base24kPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid base 24K price per gram is required' },
        { status: 400 }
      );
    }

    const karats = ['24K', '22K', '18K', '14K', '10K'] as const;

    for (const k of karats) {
      const purity = KARAT_PURITY_RATIOS[k];
      const computedRate = Number((base24kPrice * (purity / 0.999)).toFixed(2));

      await prisma.goldRate.upsert({
        where: { karat: k },
        update: {
          pricePerGram: computedRate,
          change24h: change24h ?? 0.0,
          lastUpdated: new Date(),
        },
        create: {
          karat: k,
          purityRatio: purity,
          pricePerGram: computedRate,
          change24h: change24h ?? 0.0,
        },
      });
    }

    // Also update dynamic basePrice for auto-priced products
    const products = await prisma.product.findMany({
      where: { isAutoPriced: true },
    });

    for (const prod of products) {
      const purity = KARAT_PURITY_RATIOS[prod.karat as keyof typeof KARAT_PURITY_RATIOS] || 0.75;
      const rateForKarat = Number((base24kPrice * (purity / 0.999)).toFixed(2));
      const newBasePrice = Number((prod.weightGrams * rateForKarat + prod.craftFee).toFixed(2));

      await prisma.product.update({
        where: { id: prod.id },
        data: { basePrice: newBasePrice },
      });
    }

    const updatedRates = await prisma.goldRate.findMany({
      orderBy: { karat: 'desc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Gold rates and catalog prices updated successfully',
      rates: updatedRates,
    });
  } catch (error) {
    console.error('Error updating gold rates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update gold rates' },
      { status: 500 }
    );
  }
}
