'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Lock,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { ProductItem } from '@/lib/types';
import { calculateLayawayPlan } from '@/lib/layaway';
import { formatCurrency } from '@/lib/gold-pricing';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/store';

interface LayawaySimulatorProps {
  product: ProductItem;
  initialDownPercent?: number;
  initialTerm?: number;
}

export const LayawaySimulator: React.FC<LayawaySimulatorProps> = ({
  product,
  initialDownPercent = 20,
  initialTerm = 6,
}) => {
  const router = useRouter();
  const { addItem } = useCart();
  const [downPercent, setDownPercent] = useState<number>(initialDownPercent);
  const [termMonths, setTermMonths] = useState<number>(initialTerm);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  const price = product.calculatedPrice ?? product.basePrice;
  const plan = calculateLayawayPlan(price, downPercent, termMonths);

  const handleStartLayaway = () => {
    addItem(product, 1);
    router.push(`/checkout?mode=LAYAWAY&downPercent=${downPercent}&term=${termMonths}`);
  };

  return (
    <div className="rounded-2xl bg-white border border-gold-500/25 p-5 md:p-6 shadow-xs text-neutral-900">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold font-serif text-neutral-900">
              Gold Price-Locked Layaway Plan
            </h3>
            <span className="bg-gold-500/15 text-gold-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              0% Interest
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Lock in today&apos;s price and pay in interest-free monthly installments.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold">
          <Lock className="w-3.5 h-3.5" />
          Price Locked
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Downpayment Selector */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 uppercase mb-1.5 flex items-center justify-between">
            <span>Down Payment Deposit</span>
            <span className="text-gold-700 font-mono font-bold">
              {formatCurrency(plan.downPaymentAmount)} ({downPercent}%)
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[20, 30, 50].map((pct) => {
              const isSelected = downPercent === pct;
              return (
                <motion.button
                  key={pct}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setDownPercent(pct)}
                  className={`relative py-1.5 px-2 rounded-lg text-xs font-bold transition-colors border cursor-pointer ${
                    isSelected
                      ? 'text-white border-gold-500 shadow-2xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-gold-500'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="down-percent-pill"
                      className="absolute inset-0 bg-gold-500 rounded-lg -z-0"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{pct}% Down</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Term Months Selector */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 uppercase mb-1.5 flex items-center justify-between">
            <span>Payment Duration</span>
            <span className="text-gold-700 font-mono font-bold">
              {termMonths} Months
            </span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[3, 6, 9, 12].map((months) => {
              const isSelected = termMonths === months;
              return (
                <motion.button
                  key={months}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setTermMonths(months)}
                  className={`relative py-1.5 px-1.5 rounded-lg text-xs font-bold transition-colors border cursor-pointer ${
                    isSelected
                      ? 'text-white border-gold-500 shadow-2xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-gold-500'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="term-months-pill"
                      className="absolute inset-0 bg-gold-500 rounded-lg -z-0"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{months} mo</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plan Calculation Summary Card */}
      <div className="rounded-xl bg-[#FCFCF9] border border-gold-500/20 p-3.5 mb-4">
        <div className="grid grid-cols-3 gap-3 text-left">
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">
              Due Today (Deposit)
            </span>
            <motion.span
              key={`dp-${plan.downPaymentAmount}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-black text-neutral-900 font-mono block"
            >
              {formatCurrency(plan.downPaymentAmount)}
            </motion.span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">
              Monthly Installment
            </span>
            <motion.span
              key={`mi-${plan.monthlyInstallment}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-black text-gold-700 font-mono block"
            >
              {formatCurrency(plan.monthlyInstallment)}/mo
            </motion.span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">
              Remaining Balance
            </span>
            <motion.span
              key={`rb-${plan.remainingBalance}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base font-bold text-neutral-800 font-mono block"
            >
              {formatCurrency(plan.remainingBalance)}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Toggle Schedule Details */}
      <div className="mb-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSchedule(!showSchedule)}
          className="text-xs text-gold-700 hover:text-gold-900 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{showSchedule ? 'Hide Payment Schedule' : 'View Monthly Payment Schedule'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSchedule ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {showSchedule && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 rounded-xl bg-neutral-50 border border-neutral-200 p-3 space-y-1.5">
                <div className="text-[10px] font-bold text-neutral-500 grid grid-cols-3 pb-1 border-b border-neutral-200 uppercase">
                  <span>Installment</span>
                  <span>Due Date</span>
                  <span className="text-right">Amount</span>
                </div>
                {plan.monthlySchedule.map((item) => (
                  <div
                    key={item.installmentNumber}
                    className="text-xs text-neutral-800 grid grid-cols-3 py-1 border-b border-neutral-100 last:border-0 font-mono"
                  >
                    <span className="text-gold-700 font-sans font-semibold">Payment #{item.installmentNumber}</span>
                    <span>
                      {item.dueDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-right font-bold text-neutral-900">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA Button */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleStartLayaway}
          variant="primary"
          size="md"
          className="w-full text-xs font-bold uppercase tracking-wider"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Lock Price & Start Layaway ({formatCurrency(plan.downPaymentAmount)} Down)
        </Button>
      </motion.div>
    </div>
  );
};
