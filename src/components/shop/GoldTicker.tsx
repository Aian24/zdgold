'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Sparkles, RefreshCw, Calculator } from 'lucide-react';
import { GoldRateData } from '@/lib/types';
import { DEFAULT_GOLD_RATES, formatCurrency } from '@/lib/gold-pricing';

export const GoldTicker: React.FC = () => {
  const [rates, setRates] = useState<GoldRateData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('Live');
  const [isLoading, setIsLoading] = useState(false);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && data.rates) {
        setRates(data.rates);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.error('Failed to fetch rates for ticker', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000); // 1 min refresh
    return () => clearInterval(interval);
  }, []);

  const displayRates = rates.length > 0
    ? rates
    : Object.entries(DEFAULT_GOLD_RATES).map(([karat, info]) => ({
        id: karat,
        karat: karat as any,
        purityRatio: 1,
        pricePerGram: info.pricePerGram,
        change24h: info.change24h,
        lastUpdated: new Date(),
      }));

  return (
    <div className="w-full bg-obsidian-400 border-b border-gold-500/20 py-2 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Market Status Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-gold-300 font-bold uppercase tracking-wider hidden sm:inline">
            London Gold Spot Rate
          </span>
          <span className="text-gold-300 font-bold uppercase tracking-wider sm:hidden">
            Spot Rate
          </span>
          <span className="text-gold-200/40 text-[10px]">({lastUpdated})</span>
        </div>

        {/* Ticker Rates */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-0.5">
          {displayRates.map((rate) => (
            <div key={rate.karat} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="font-bold text-gold-400 font-mono">{rate.karat}</span>
              <span className="text-gold-100 font-semibold">{formatCurrency(rate.pricePerGram)}/g</span>
              <span className="text-[10px] text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +{rate.change24h}%
              </span>
            </div>
          ))}
        </div>

        {/* Quick Calculator Shortcut */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/calculator"
            className="flex items-center gap-1 text-gold-400 hover:text-gold-200 font-semibold transition-colors text-xs"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Gold Calculator</span>
          </Link>
          <button
            onClick={fetchRates}
            disabled={isLoading}
            className="text-gold-400/60 hover:text-gold-200 transition-colors p-1"
            title="Refresh Live Rates"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
