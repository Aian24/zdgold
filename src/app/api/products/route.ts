import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const karat = searchParams.get('karat');
    const minWeight = searchParams.get('minWeight');
    const maxWeight = searchParams.get('maxWeight');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort'); // price-asc, price-desc, weight-asc, weight-desc, newest
    const includeSold = searchParams.get('includeSold');

    const where: any = {};

    // By default for customer storefront, only show available (in-stock) products
    if (includeSold !== 'true') {
      where.stockQuantity = { gt: 0 };
    }

    if (category && category !== 'ALL') {
      where.category = category.toUpperCase();
    }

    if (karat && karat !== 'ALL') {
      where.karat = karat.toUpperCase();
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (minWeight || maxWeight) {
      where.weightGrams = {};
      if (minWeight) where.weightGrams.gte = parseFloat(minWeight);
      if (maxWeight) where.weightGrams.lte = parseFloat(maxWeight);
    }

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { hallmarkCertNumber: { contains: search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { basePrice: 'asc' };
    if (sort === 'price-desc') orderBy = { basePrice: 'desc' };
    if (sort === 'weight-asc') orderBy = { weightGrams: 'asc' };
    if (sort === 'weight-desc') orderBy = { weightGrams: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const products = await prisma.product.findMany({
      where,
      orderBy,
    });

    const formatted = products.map((p) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    }));

    return NextResponse.json({ success: true, products: formatted });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      category,
      karat,
      purityPercentage,
      weightGrams,
      craftFee,
      basePrice,
      isAutoPriced,
      stockQuantity,
      isFeatured,
      images,
      hallmarkCertNumber,
      dimensions,
    } = body;

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const parsedBasePrice = basePrice !== undefined && basePrice !== '' ? parseFloat(String(basePrice)) : 0;
    const parsedCraftFee = craftFee !== undefined && craftFee !== '' ? parseFloat(String(craftFee)) : 0;
    const parsedWeight = weightGrams !== undefined && weightGrams !== '' ? parseFloat(String(weightGrams)) : 0;
    const parsedStock = stockQuantity !== undefined && stockQuantity !== '' ? parseInt(String(stockQuantity), 10) : 10;

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: `${generatedSlug}-${Date.now().toString().slice(-4)}`,
        description,
        category,
        karat,
        purityPercentage: purityPercentage ? parseFloat(String(purityPercentage)) : 0.75,
        weightGrams: parsedWeight,
        craftFee: parsedCraftFee,
        basePrice: parsedBasePrice,
        isAutoPriced: isAutoPriced ?? false,
        stockQuantity: Math.max(0, parsedStock),
        isFeatured: isFeatured ?? false,
        images: Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([images]),
        hallmarkCertNumber: hallmarkCertNumber || null,
        dimensions: dimensions || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: {
        ...newProduct,
        images: JSON.parse(newProduct.images),
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids') || searchParams.get('id');

    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: 'Product ID(s) required' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').filter(Boolean);

    // Delete any dependent OrderItem records referencing these products
    await prisma.orderItem.deleteMany({
      where: { productId: { in: ids } },
    });

    await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `${ids.length} product(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting product(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product(s): ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
