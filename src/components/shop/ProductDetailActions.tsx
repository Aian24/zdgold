'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Check, Lock, Plus, Minus, ArrowRight } from 'lucide-react';
import { ProductItem } from '@/lib/types';
import { useCart } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/gold-pricing';

export const ProductDetailActions: React.FC<{ product: ProductItem }> = ({ product }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const price = product.calculatedPrice ?? product.basePrice;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  const scrollToLayaway = () => {
    const el = document.getElementById('layaway');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Quantity & Add to Bag Row */}
      <div className="flex items-center gap-3">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-neutral-300 rounded-xl bg-white p-1 shadow-2xs">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </motion.button>
          <span className="w-10 text-center font-mono font-bold text-sm text-neutral-900">
            {quantity}
          </span>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setQuantity(Math.min(product.stockQuantity || 10, quantity + 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Add to Bag Button */}
        <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
          <Button
            variant={justAdded ? 'primary' : 'secondary'}
            size="lg"
            onClick={handleAddToCart}
            leftIcon={
              justAdded ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              ) : (
                <ShoppingBag className="w-4 h-4 text-gold-600" />
              )
            }
            className={`w-full text-xs font-bold uppercase tracking-wider transition-all h-11 ${
              justAdded
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                : 'hover:border-gold-500'
            }`}
          >
            {justAdded ? 'Added to Bag!' : `Add to Bag (${formatCurrency(price * quantity)})`}
          </Button>
        </motion.div>
      </div>

      {/* Instant Checkout & Layaway Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link href={`/checkout?productId=${product.id}&mode=CASH&qty=${quantity}`}>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="primary"
              size="md"
              className="w-full text-xs font-bold uppercase tracking-wider h-11 shadow-sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Instant Checkout
            </Button>
          </motion.div>
        </Link>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="gold-outline"
            size="md"
            onClick={scrollToLayaway}
            className="w-full text-xs font-bold uppercase tracking-wider h-11 bg-gold-500/10 hover:bg-gold-500/20"
            leftIcon={<Lock className="w-3.5 h-3.5 text-gold-600" />}
          >
            0% Layaway Calculator
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
