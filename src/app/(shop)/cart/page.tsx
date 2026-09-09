'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Scale,
  Lock,
} from 'lucide-react';
import { useCart } from '@/lib/store';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { Button } from '@/components/ui/Button';
import { FadeInUp } from '@/components/animations/Motion';

export default function CartPage() {
  const { items, itemCount, subtotal, totalGrams, totalCraftFee, updateQuantity, removeItem, clearCart, isLoaded } = useCart();
  const [checkoutMode, setCheckoutMode] = useState<'CASH' | 'LAYAWAY'>('LAYAWAY');

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-xs text-neutral-500">Loading Shopping Cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <FadeInUp className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-white border border-gold-500/30 flex items-center justify-center mx-auto text-gold-600 shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black font-serif text-neutral-900">Your Jewelry Cart is Empty</h1>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Explore our certified 22K rope chains, solitaire rings, and solid Cuban bracelets to start building your gold jewelry collection.
        </p>
        <div>
          <Link href="/catalog">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="primary" size="lg" className="text-xs font-bold uppercase tracking-wider shadow-md">
                Browse Jewelry Catalog
              </Button>
            </motion.div>
          </Link>
        </div>
      </FadeInUp>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 bg-[#FCFCF9]">
      {/* Header */}
      <FadeInUp className="flex items-center justify-between pb-6 border-b border-gold-500/20">
        <div>
          <span className="text-xs font-bold text-gold-600 uppercase tracking-widest block mb-1">
            Shopping Bag
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Review Your Gold Selection ({itemCount} {itemCount === 1 ? 'Piece' : 'Pieces'})
          </h1>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors font-semibold cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Cart
        </motion.button>
      </FadeInUp>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const img = Array.isArray(item.product.images) && item.product.images.length > 0
                ? item.product.images[0]
                : 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800';

              return (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl bg-white border border-gold-500/25 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between shadow-xs"
                >
                  {/* Product Info */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 border border-gold-500/30 flex-shrink-0">
                      <Image src={img} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-gold-700 uppercase">
                        {item.product.karat} SOLID GOLD • {formatGrams(item.product.weightGrams)}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900 line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controls & Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl p-1">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 rounded text-neutral-600 hover:bg-neutral-200 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </motion.button>
                      <span className="text-xs font-bold text-neutral-900 px-2 font-mono">{item.quantity}</span>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 rounded text-neutral-600 hover:bg-neutral-200 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <span className="text-base font-black text-neutral-900 font-mono block">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Order Summary & Checkout Mode Card */}
        <FadeInUp className="lg:col-span-4 rounded-3xl bg-white border border-gold-500/30 p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-bold font-serif text-neutral-900 pb-3 border-b border-neutral-100">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-gold-600" />
                Total Gold Mass
              </span>
              <span className="font-mono font-bold text-neutral-900">{formatGrams(totalGrams)}</span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>Total Craftsmanship Fees</span>
              <span className="font-mono font-bold text-neutral-900">{formatCurrency(totalCraftFee)}</span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>Insured Vault Courier</span>
              <span className="text-emerald-700 font-bold">COMPLIMENTARY</span>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-neutral-900 uppercase">Subtotal</span>
              <span className="text-2xl font-black text-neutral-900 font-mono">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          {/* Checkout Mode Selector */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Choose Checkout Mode:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['LAYAWAY', 'CASH'] as const).map((mode) => {
                const isSelected = checkoutMode === mode;
                return (
                  <motion.button
                    key={mode}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setCheckoutMode(mode)}
                    className={`relative p-3 rounded-2xl text-xs font-bold text-left border transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-white border-gold-500 shadow-sm'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-gold-500'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="cart-mode-active"
                        className="absolute inset-0 bg-gold-500 rounded-2xl -z-0"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-1.5 mb-1">
                      {mode === 'LAYAWAY' ? <Lock className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                      <span>{mode === 'LAYAWAY' ? 'Layaway' : 'Full Cash'}</span>
                    </div>
                    <span className="relative z-10 text-[10px] opacity-90 block font-normal">
                      {mode === 'LAYAWAY' ? 'From 20% Down' : '100% Upfront'}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* CTA Proceed Button */}
          <Link href={`/checkout?mode=${checkoutMode}`}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs font-bold uppercase tracking-wider mt-2 shadow-md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {checkoutMode === 'LAYAWAY' ? 'Configure Layaway Contract' : 'Proceed to Cash Checkout'}
              </Button>
            </motion.div>
          </Link>
        </FadeInUp>
      </div>
    </div>
  );
}
