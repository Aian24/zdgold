'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingBag, Scale, Check } from 'lucide-react';
import { ProductItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { useCart } from '@/lib/store';

interface ProductCardProps {
  product: ProductItem;
  onOpenLayawayModal?: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
}) => {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const price = product.calculatedPrice ?? product.basePrice;
  const image = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800';

  // Quick layaway estimate (20% down, 6 months)
  const minDown = price * 0.2;
  const estimatedMonthly = (price - minDown) / 6;

  const handleAddToCart = () => {
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1600);
  };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="group rounded-2xl bg-white border border-gold-500/25 overflow-hidden flex flex-col justify-between transition-shadow duration-200 hover:border-gold-500/60 hover:shadow-lg"
    >
      {/* Product Image with Smooth Hover Zoom */}
      <div className="relative w-full aspect-square bg-[#FBFBFA] overflow-hidden">
        <Link href={`/product/${product.slug || product.id}`}>
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Karat Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <Badge variant="outline-gold" size="sm" className="bg-white/95 backdrop-blur-md font-bold text-[10px] py-0.5 px-2">
            {product.karat}
          </Badge>
        </div>

        {/* Weight Tag */}
        <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md border border-gold-500/30 text-[10px] font-mono font-bold text-neutral-800 flex items-center gap-1 z-10 shadow-2xs">
          <Scale className="w-3 h-3 text-gold-600" />
          {formatGrams(product.weightGrams)}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3.5 flex flex-col flex-grow justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between text-[10px] text-gold-700 uppercase tracking-wider font-bold mb-1">
            <span>{product.category}</span>
            {product.hallmarkCertNumber && (
              <span className="text-emerald-700 font-mono text-[9px]">
                Hallmarked
              </span>
            )}
          </div>

          <Link href={`/product/${product.slug || product.id}`}>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-gold-700 transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="pt-2 border-t border-neutral-100 space-y-2">
          {/* Price Header */}
          <div className="flex items-baseline justify-between">
            <span className="text-sm sm:text-base font-black text-neutral-900 font-mono">
              {formatCurrency(price)}
            </span>
            <span className="text-[10px] text-gold-800 font-mono font-bold bg-gold-500/10 px-1.5 py-0.5 rounded">
              ₱{Math.round(estimatedMonthly).toLocaleString()}/mo
            </span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1.5">
            <motion.div whileTap={{ scale: 0.94 }}>
              <Button
                variant={justAdded ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleAddToCart}
                leftIcon={justAdded ? <Check className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                className={`w-full text-[11px] h-8 font-bold transition-all ${
                  justAdded
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'hover:border-gold-500'
                }`}
              >
                {justAdded ? 'Added' : 'Add'}
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.94 }}>
              <Link href={`/product/${product.slug || product.id}`} className="w-full block">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-[11px] h-8 font-bold"
                >
                  View
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
