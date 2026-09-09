'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Lock,
  Scale,
  Layers,
  Save,
} from 'lucide-react';
import { KARAT_PURITY_RATIOS, formatCurrency } from '@/lib/gold-pricing';
import { Button } from '@/components/ui/Button';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/animations/Motion';
import { showSuccessAlert, showErrorAlert, showToast } from '@/lib/swal';

export default function AdminRatesPage() {
  const [base24kPrice, setBase24kPrice] = useState<number>(4850.00);
  const [change24h, setChange24h] = useState<number>(1.45);
  const [currentRates, setCurrentRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && data.rates) {
        setCurrentRates(data.rates);
        const rate24 = data.rates.find((r: any) => r.karat === '24K');
        if (rate24) {
          setBase24kPrice(rate24.pricePerGram);
          setChange24h(rate24.change24h || 1.45);
        }
      }
    } catch (e) {
      console.error('Failed to fetch rates', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base24kPrice: parseFloat(base24kPrice.toString()),
          change24h: parseFloat(change24h.toString()),
        }),
      });

      const data = await res.json();
      if (data.success) {
        await showSuccessAlert(
          'Spot Rates Updated!',
          'New gold market rates have been applied across the live jewelry catalog.'
        );
        fetchRates();
      } else {
        await showErrorAlert('Update Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error updating gold spot rates.');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview derived rates
  const derivedRates = [
    { karat: '24K', purity: 0.999, rate: base24kPrice },
    { karat: '22K', purity: 0.916, rate: Number((base24kPrice * (0.916 / 0.999)).toFixed(2)) },
    { karat: '18K', purity: 0.750, rate: Number((base24kPrice * (0.750 / 0.999)).toFixed(2)) },
    { karat: '14K', purity: 0.585, rate: Number((base24kPrice * (0.585 / 0.999)).toFixed(2)) },
    { karat: '10K', purity: 0.417, rate: Number((base24kPrice * (0.417 / 0.999)).toFixed(2)) },
  ];

  return (
    <div className="max-w-4xl space-y-8 overflow-hidden">
      <FadeInUp>
        <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block mb-1">
          Market Pricing
        </span>
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
          Gold Spot Rates
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1">
          Adjust the baseline 24K spot market rate. All derived karat multipliers and auto-priced jewelry in the customer catalog will update immediately.
        </p>
      </FadeInUp>

      {/* Adjuster Form */}
      <FadeInUp>
        <form onSubmit={handleUpdateRates} className="rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                Base 24K Fine Gold Spot Price (₱ PHP/gram)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0"
                value={base24kPrice === 0 ? '' : base24kPrice}
                onChange={(e) => setBase24kPrice(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gold-500/30 rounded-xl p-3 text-xl font-mono font-black text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
                required
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Standard baseline: ₱4,850.00/g for 99.9% 24K pure gold
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                24H Market Trend Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={change24h === 0 ? '' : change24h}
                onChange={(e) => setChange24h(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gold-500/30 rounded-xl p-3 text-xl font-mono font-black text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
                required
              />
              <span className="text-[11px] text-emerald-700 mt-1 block font-bold">
                Displayed on the homepage ticker and live catalog
              </span>
            </div>
          </div>

          {/* Live Calculated Multipliers Preview with Animations */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Derived Real-Time Karat Rates:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {derivedRates.map((r, idx) => (
                <motion.div
                  key={r.karat}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-[#FAF8F2] p-3.5 rounded-2xl border border-gold-500/20 text-center"
                >
                  <span className="text-xs font-bold font-mono text-gold-700 block">{r.karat} Solid Gold</span>
                  <motion.div
                    key={`${r.karat}-${r.rate}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-base font-black font-mono text-neutral-900 my-1"
                  >
                    {formatCurrency(r.rate)}/g
                  </motion.div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {(r.purity * 100).toFixed(1)}% Purity
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={fetchRates}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reset
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                className="font-bold uppercase tracking-wider text-xs shadow-md"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Apply Live Spot Rates
              </Button>
            </motion.div>
          </div>
        </form>
      </FadeInUp>
    </div>
  );
}
