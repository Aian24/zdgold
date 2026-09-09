import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShieldCheck,
  Scale,
  ShoppingBag,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { LayawaySimulator } from '@/components/shop/LayawaySimulator';
import { ProductDetailActions } from '@/components/shop/ProductDetailActions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

async function getProduct(idOrSlug: string) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!product) return null;

    const spotRate = await prisma.goldRate.findUnique({
      where: { karat: product.karat },
    });

    return {
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      spotRate: spotRate?.pricePerGram || 86.40,
    };
  } catch (e) {
    console.error('Error loading product:', e);
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const primaryImage = product.images[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800';
  const price = (product as any).calculatedPrice ?? product.basePrice;
  const goldValue = Number((product.weightGrams * product.spotRate).toFixed(2));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 bg-[#FCFCF9]">
      {/* Back to Catalog Breadcrumb */}
      <div>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-xs font-bold text-gold-700 hover:text-gold-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jewelry Catalog
        </Link>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-gold-500/30 shadow-lg">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              priority
              className="object-cover object-center"
            />

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge variant="outline-gold" size="md" className="bg-white/95 backdrop-blur-md">
                {product.karat} SOLID GOLD
              </Badge>
              {product.hallmarkCertNumber && (
                <Badge variant="emerald" size="md" className="bg-white/95 backdrop-blur-md">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Hallmark: {product.hallmarkCertNumber}
                </Badge>
              )}
            </div>

            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-gold-500/30 text-xs font-mono font-bold text-neutral-800 flex items-center gap-1.5 shadow-sm">
              <Scale className="w-4 h-4 text-gold-600" />
              Weight: {formatGrams(product.weightGrams)}
            </div>
          </div>
        </div>

        {/* Right Column: Specifications & Checkout Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="text-xs font-bold text-gold-700 uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <span>{product.category}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">In Stock ({product.stockQuantity} Available)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-neutral-900 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Price & Gold Value Breakdown Card */}
          <div className="rounded-3xl bg-white border border-gold-500/30 p-6 space-y-4 shadow-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-neutral-500 font-bold uppercase">Total Retail Cash Price</span>
              <span className="text-3xl font-black text-neutral-900 font-mono tracking-tight">
                {formatCurrency(price)}
              </span>
            </div>

            {/* Transparent Goldsmith Breakdown */}
            <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Gold Melt Value</span>
                <span className="font-bold text-neutral-800 font-mono">{formatCurrency(goldValue)}</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Craftsmanship Fee</span>
                <span className="font-bold text-neutral-800 font-mono">{formatCurrency(product.craftFee)}</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 col-span-2 sm:col-span-1">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Spot Rate Applied</span>
                <span className="font-bold text-gold-700 font-mono">{formatCurrency(product.spotRate)}/g</span>
              </div>
            </div>

            {/* Actions */}
            <ProductDetailActions product={product as any} />
          </div>

          {/* Product Description */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Fine Craftsmanship & Details</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="flex items-center gap-2 text-neutral-700">
                <span className="font-bold text-gold-700">Purity:</span>
                <span>{product.karat} ({(product.purityPercentage * 100).toFixed(1)}% Solid Gold)</span>
              </div>
              {product.dimensions && (
                <div className="flex items-center gap-2 text-neutral-700">
                  <span className="font-bold text-gold-700">Dimensions:</span>
                  <span>{product.dimensions}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Layaway Contract Simulator Section */}
      <section id="layaway" className="pt-4">
        <LayawaySimulator product={product as any} />
      </section>
    </div>
  );
}
