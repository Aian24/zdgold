'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Scale,
  TrendingUp,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { GoldKarat } from '@/lib/types';
import {
  KARAT_PURITY_RATIOS,
  DEFAULT_GOLD_RATES,
  calculateGoldScrapValue,
  formatCurrency,
  formatGrams,
} from '@/lib/gold-pricing';
import { Button } from '@/components/ui/Button';

export default function GoldCalculatorPage() {
  const [karat, setKarat] = useState<GoldKarat>('24K');
  const [weight, setWeight] = useState<number>(25);
  const [unit, setUnit] = useState<'GRAMS' | 'OUNCES' | 'TOLAS'>('GRAMS');
  const [spotRates, setSpotRates] = useState<Record<string, number>>({
    '24K': 86.40,
    '22K': 79.15,
    '18K': 64.80,
    '14K': 50.54,
    '10K': 36.03,
  });

  useEffect(() => {
    fetch('/api/rates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.rates) {
          const map: Record<string, number> = {};
          data.rates.forEach((r: any) => {
            map[r.karat] = r.pricePerGram;
          });
          setSpotRates(map);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Convert unit to grams
  const weightInGrams = unit === 'GRAMS' ? weight : unit === 'OUNCES' ? weight * 31.1035 : weight * 11.6638;

  const currentSpotRate = spotRates[karat] || DEFAULT_GOLD_RATES[karat]?.pricePerGram || 86.40;
  const purity = KARAT_PURITY_RATIOS[karat];
  const pureGoldGrams = weightInGrams * purity;
  const marketValue = weightInGrams * currentSpotRate;

  // Scrap / Payout value
  const scrapCalc = calculateGoldScrapValue(
    weightInGrams,
    karat,
    2.5,
    spotRates['24K'] || 86.40
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 bg-[#FCFCF9] text-[#1A1A1A]">
      <div>
        <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block mb-1">
          Precision Valuation Engine
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-serif text-neutral-900">
          Live Gold Purity & Value Calculator
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl">
          Calculate the pure gold content, London spot market worth, and instant melt valuation for any fine gold piece in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Form */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 font-serif pb-3 border-b border-gold-500/20">
            Gold Parameters
          </h2>

          {/* Karat Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex justify-between">
              <span>Gold Karat Purity</span>
              <span className="text-gold-700 font-mono font-bold">{(purity * 100).toFixed(1)}% Fine Gold</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['24K', '22K', '18K', '14K', '10K'] as GoldKarat[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKarat(k)}
                  className={`py-2.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                    karat === k
                      ? 'bg-gold-500 text-white border-gold-600 shadow-xs font-black'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-gold-500/40'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Input & Unit Selector */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Weight / Mass
              </label>
              <div className="flex gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                {(['GRAMS', 'OUNCES', 'TOLAS'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      unit === u ? 'bg-gold-500 text-white' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="0"
                value={weight === 0 ? '' : weight}
                onChange={(e) => setWeight(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-gold-500/30 rounded-xl p-3 text-lg font-mono font-bold text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gold-700 uppercase">
                {unit}
              </span>
            </div>
          </div>

          {/* Current Live Rate Tag */}
          <div className="p-3.5 bg-[#FAF8F2] rounded-2xl border border-gold-500/20 flex items-center justify-between text-xs">
            <span className="text-neutral-600 font-medium">Spot Rate for {karat}:</span>
            <span className="font-mono font-bold text-gold-700 text-sm">
              {formatCurrency(currentSpotRate)}/g
            </span>
          </div>
        </div>

        {/* Right Output Valuation Cards */}
        <div className="lg:col-span-6 space-y-6">
          {/* Market Value Box */}
          <div className="rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block mb-1">
                Estimated Spot Market Value
              </span>
              <div className="text-3xl sm:text-4xl font-black text-neutral-900 font-mono tracking-tight">
                {formatCurrency(marketValue)}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Based on London Bullion Market live spot rate of {formatCurrency(spotRates['24K'] || 86.40)}/g for 99.99% pure gold.
              </p>
            </div>

            {/* Content Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200 text-xs">
              <div className="bg-[#FAF8F2] p-3.5 rounded-2xl border border-gold-500/15">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Total Gold Mass</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">{formatGrams(weightInGrams)}</span>
              </div>
              <div className="bg-[#FAF8F2] p-3.5 rounded-2xl border border-gold-500/15">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Pure 24K Gold Content</span>
                <span className="font-mono font-bold text-gold-700 text-sm">{formatGrams(pureGoldGrams)}</span>
              </div>
            </div>

            {/* Scrap Melt Payout Estimate */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-300 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-emerald-900 font-bold">Instant Vault Buyback / Scrap Payout:</span>
                <span className="font-mono font-bold text-emerald-700 text-base">
                  {formatCurrency(scrapCalc.netPayout)}
                </span>
              </div>
              <p className="text-[10px] text-emerald-600">
                Includes standard 2.5% assay refining deduction.
              </p>
            </div>

            {/* Layaway Action */}
            <Link href="/catalog">
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs font-bold uppercase tracking-wider"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Shop Certified {karat} Gold Catalog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
