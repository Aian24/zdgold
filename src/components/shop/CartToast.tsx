'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingBag, X, ArrowRight } from 'lucide-react';
import { ProductItem } from '@/lib/types';
import { formatCurrency } from '@/lib/gold-pricing';

export const CART_TOAST_EVENT = 'dg_cart_item_added';

export interface CartToastPayload {
  product: ProductItem;
  quantity: number;
}

export function triggerCartToast(product: ProductItem, quantity: number = 1) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CART_TOAST_EVENT, { detail: { product, quantity } })
    );
  }
}

export const CartToast: React.FC = () => {
  const [toastData, setToastData] = useState<{
    id: number;
    product: ProductItem;
    quantity: number;
  } | null>(null);

  useEffect(() => {
    let timeoutId: any = null;

    const handleCartEvent = (e: any) => {
      if (e.detail?.product) {
        setToastData({
          id: Date.now(),
          product: e.detail.product,
          quantity: e.detail.quantity || 1,
        });

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setToastData(null);
        }, 4000);
      }
    };

    window.addEventListener(CART_TOAST_EVENT, handleCartEvent);
    return () => {
      window.removeEventListener(CART_TOAST_EVENT, handleCartEvent);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <aside aria-label="Cart Notifications" className="fixed top-20 right-4 z-50 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toastData && (
          <motion.div
            key={toastData.id}
            initial={{ opacity: 0, y: -20, scale: 0.92, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -15, scale: 0.95, x: 20 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border border-gold-500/40 p-4 shadow-xl overflow-hidden relative"
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-700" />
                </span>
                <span>Added to your Bag!</span>
              </div>
              <button
                onClick={() => setToastData(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Product Snapshot */}
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-50 border border-gold-500/20 flex-shrink-0">
                <Image
                  src={
                    Array.isArray(toastData.product.images) && toastData.product.images.length > 0
                      ? toastData.product.images[0]
                      : 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=300'
                  }
                  alt={toastData.product.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-neutral-900 truncate">
                  {toastData.product.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono font-black text-neutral-900">
                    {formatCurrency(toastData.product.calculatedPrice ?? toastData.product.basePrice)}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Qty: {toastData.quantity}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
              <Link
                href="/cart"
                onClick={() => setToastData(null)}
                className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors text-center"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>View Bag</span>
              </Link>
              <Link
                href="/checkout"
                onClick={() => setToastData(null)}
                className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold transition-all shadow-2xs text-center"
              >
                <span>Checkout</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Countdown progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
