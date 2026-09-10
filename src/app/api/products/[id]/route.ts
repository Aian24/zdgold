import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      },
    });
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: any = { ...body };
    if (data.weightGrams !== undefined && data.weightGrams !== '') data.weightGrams = parseFloat(String(data.weightGrams));
    if (data.craftFee !== undefined && data.craftFee !== '') data.craftFee = parseFloat(String(data.craftFee));
    if (data.basePrice !== undefined && data.basePrice !== '') data.basePrice = parseFloat(String(data.basePrice));
    if (data.stockQuantity !== undefined && data.stockQuantity !== '') {
      data.stockQuantity = Math.max(0, parseInt(String(data.stockQuantity), 10));
    }
    if (data.purityPercentage !== undefined && data.purityPercentage !== '') {
      data.purityPercentage = parseFloat(String(data.purityPercentage));
    }
    if (data.images && Array.isArray(data.images)) {
      data.images = JSON.stringify(data.images);
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        ...updated,
        images: typeof updated.images === 'string' ? JSON.parse(updated.images) : updated.images,
      },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.orderItem.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product removed from inventory',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
