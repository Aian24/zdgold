import { GoldKarat } from './types';

export const KARAT_PURITY_RATIOS: Record<GoldKarat, number> = {
  '24K': 0.999,
  '22K': 0.916,
  '18K': 0.750,
  '14K': 0.585,
  '10K': 0.417,
};

// Default fallback gold rates per gram in Philippine Peso (PHP - ₱)
export const DEFAULT_GOLD_RATES: Record<GoldKarat, { pricePerGram: number; change24h: number }> = {
  '24K': { pricePerGram: 4850.00, change24h: 1.25 },
  '22K': { pricePerGram: 4440.00, change24h: 1.18 },
  '18K': { pricePerGram: 3640.00, change24h: 0.95 },
  '14K': { pricePerGram: 2840.00, change24h: 0.82 },
  '10K': { pricePerGram: 2020.00, change24h: 0.65 },
};

/**
 * Calculates dynamic gold product retail price in Philippine Pesos (PHP)
 * Formula: (Gold Weight in Grams * Gold Rate for Karat) + Craftsmanship Fee
 */
export function calculateProductPrice(
  weightGrams: number,
  karat: GoldKarat,
  craftFee: number = 0,
  currentRates?: Record<string, number>
): {
  goldValue: number;
  craftFee: number;
  totalPrice: number;
  ratePerGram: number;
} {
  const ratePerGram = currentRates?.[karat] ?? DEFAULT_GOLD_RATES[karat]?.pricePerGram ?? 4850.00;
  const goldValue = Number((weightGrams * ratePerGram).toFixed(2));
  const total = Number((goldValue + craftFee).toFixed(2));

  return {
    goldValue,
    craftFee,
    totalPrice: total,
    ratePerGram,
  };
}

/**
 * Format standard Philippine Peso currency string (₱123,456.78)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format gold weight with standard 'g' unit (e.g. 12.50g)
 */
export function formatGrams(grams: number | null | undefined): string {
  if (grams === undefined || grams === null || isNaN(grams)) return '0.00g';
  return `${Number(grams).toFixed(2)}g`;
}

/**
 * Calculate scrap or buyback payout value in PHP
 */
export function calculateGoldScrapValue(
  weightGrams: number,
  karat: GoldKarat,
  refiningDeductionPercent: number = 2.0, // 2% refining deduction
  base24kRate: number = 4850.00
): {
  pureGoldWeight: number;
  grossValue: number;
  deduction: number;
  netPayout: number;
} {
  const purity = KARAT_PURITY_RATIOS[karat] || 0.999;
  const pureGoldWeight = Number((weightGrams * purity).toFixed(3));
  const grossValue = Number((pureGoldWeight * base24kRate).toFixed(2));
  const deduction = Number((grossValue * (refiningDeductionPercent / 100)).toFixed(2));
  const netPayout = Number((grossValue - deduction).toFixed(2));

  return {
    pureGoldWeight,
    grossValue,
    deduction,
    netPayout,
  };
}
