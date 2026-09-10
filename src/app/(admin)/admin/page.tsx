'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Lock,
  Scale,
  RefreshCw,
  ArrowRight,
  PieChart,
  BarChart3,
  Layers,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/animations/Motion';

const DEFAULT_ANALYTICS = {
  totalCollectedRevenue: 0,
  totalGoldGramsSold: 0,
  totalOrdersCount: 0,
  activeLayawayContractsCount: 0,
  completedLayawayContractsCount: 0,
  totalLayawayReceivables: 0,
  totalLayawayContractValue: 0,
  overdueInstallmentsCount: 0,
  productCount: 0,
  customerCount: 0,
  lowStockCount: 0,
  recentPayments: [],
  monthlySales: [
    { month: 'Jan', fullMonth: 'January', year: 2026, upfront: 0, layaway: 0, total: 0 },
    { month: 'Feb', fullMonth: 'February', year: 2026, upfront: 0, layaway: 0, total: 0 },
    { month: 'Mar', fullMonth: 'March', year: 2026, upfront: 0, layaway: 0, total: 0 },
    { month: 'Apr', fullMonth: 'April', year: 2026, upfront: 0, layaway: 0, total: 0 },
    { month: 'May', fullMonth: 'May', year: 2026, upfront: 0, layaway: 0, total: 0 },
    { month: 'Jun', fullMonth: 'June', year: 2026, upfront: 0, layaway: 0, total: 0 },
  ],
  peakMonth: { name: 'N/A', amount: 0 },
  momGrowthText: '+0.0% MoM Growth',
  categorySales: [
    { name: 'Fine Gold Jewelry', category: 'JEWELRY', count: 0, value: 0, percentage: 100, color: '#D4AF37' },
  ],
  totalCatalogVolume: 0,
};

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to parse analytics');
      }
    } catch (e: any) {
      console.error('Failed to load admin analytics:', e);
      setFetchError(e.message || 'Failed to load dashboard data');
      setAnalytics((prev: any) => prev || DEFAULT_ANALYTICS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading && !analytics) {
    return (
      <div className="py-24 text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full mx-auto shadow-sm"
        />
        <div className="space-y-1">
          <p className="text-sm text-neutral-800 font-bold">Loading Live Dashboard Analytics...</p>
          <p className="text-xs text-neutral-400">Fetching live jewelry catalog, ledger orders & collections</p>
        </div>
      </div>
    );
  }

  const currentData = analytics || DEFAULT_ANALYTICS;
  const monthlySales = currentData.monthlySales || [];
  const maxMonthlyRevenue = Math.max(...monthlySales.map((s: any) => s.total || 0), 1);
  const categorySales = currentData.categorySales || [];

  return (
    <div className="space-y-8 overflow-hidden">
      {/* Header */}
      <FadeInUp className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gold-700 uppercase tracking-widest">
              Live Database Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Dashboard Analytics
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAnalytics}
              isLoading={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              className="text-xs font-bold"
            >
              Refresh
            </Button>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Error Alert Banner if any */}
      {fetchError && (
        <FadeInUp className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Could not load the latest live data: {fetchError}. Showing cached overview.</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchAnalytics} className="text-xs font-bold flex-shrink-0">
            Retry
          </Button>
        </FadeInUp>
      )}

      {/* KPI Stats Grid with Stagger Entrance */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Collected Cash */}
        <StaggerItem>
          <Link href="/admin/orders">
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white border border-gold-500/25 p-5 space-y-2 shadow-xs hover:border-gold-500/50 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-neutral-500 uppercase">Total Collected</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
                {formatCurrency(currentData.totalCollectedRevenue || 0)}
              </div>
              <span className="text-[11px] text-emerald-700 block font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {currentData.totalOrdersCount || 0} Total Orders
              </span>
            </motion.div>
          </Link>
        </StaggerItem>

        {/* 2. Layaway Receivables */}
        <StaggerItem>
          <Link href="/admin/layaway">
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white border border-gold-500/25 p-5 space-y-2 shadow-xs hover:border-gold-500/50 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-neutral-500 uppercase">Layaway Receivables</span>
                <div className="p-2 rounded-xl bg-gold-500/15 text-gold-700 border border-gold-500/30">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gold-700 font-mono">
                {formatCurrency(currentData.totalLayawayReceivables || 0)}
              </div>
              <span className="text-[11px] text-neutral-500 block font-medium">
                {currentData.activeLayawayContractsCount || 0} Active Locked Contracts
              </span>
            </motion.div>
          </Link>
        </StaggerItem>

        {/* 3. Gold Volume Sold */}
        <StaggerItem>
          <Link href="/admin/products">
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white border border-gold-500/25 p-5 space-y-2 shadow-xs hover:border-gold-500/50 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-neutral-500 uppercase">Total Gold Sold</span>
                <div className="p-2 rounded-xl bg-gold-500/15 text-gold-700 border border-gold-500/30">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
                {formatGrams(currentData.totalGoldGramsSold || 0)}
              </div>
              <span className="text-[11px] text-neutral-500 block font-medium">
                {currentData.productCount || 0} Products in Catalog
              </span>
            </motion.div>
          </Link>
        </StaggerItem>

        {/* 4. Active Customers */}
        <StaggerItem>
          <Link href="/admin/customers">
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-white border border-gold-500/25 p-5 space-y-2 shadow-xs hover:border-gold-500/50 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-neutral-500 uppercase">Registered Clients</span>
                <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700 border border-neutral-300">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono">
                {currentData.customerCount || 0}
              </div>
              <span className="text-[11px] text-neutral-500 block font-medium">
                Active Client Accounts
              </span>
            </motion.div>
          </Link>
        </StaggerItem>
      </StaggerContainer>

      {/* 2. CHARTS SECTION (Animated Bar Graph & Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BAR GRAPH: Monthly Revenue & Collections with Growing Animation */}
        <FadeInUp className="lg:col-span-7 rounded-3xl bg-white border border-gold-500/30 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gold-600" />
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Monthly Revenue & Layaway Collections
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gold-500" />
                <span className="text-neutral-600">Upfront Cash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-200" />
                <span className="text-neutral-600">Layaway</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Canvas with Dynamic Grow */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {monthlySales.map((item: any, idx: number) => {
              const totalHeight = item.total > 0 ? (item.total / maxMonthlyRevenue) * 100 : 4;
              const upfrontHeight = item.total > 0 ? (item.upfront / item.total) * 100 : 50;
              const layawayHeight = item.total > 0 ? (item.layaway / item.total) * 100 : 50;
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={`${item.month}-${idx}`}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip on Hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: -5, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute -top-14 z-20 bg-neutral-900 text-white p-2.5 rounded-xl text-[10px] font-mono shadow-xl whitespace-nowrap pointer-events-none"
                      >
                        <div className="font-bold text-gold-400">{item.fullMonth || item.month} {item.year}: {formatCurrency(item.total)}</div>
                        <div className="text-neutral-300">Cash: {formatCurrency(item.upfront)}</div>
                        <div className="text-neutral-300">Layaway: {formatCurrency(item.layaway)}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Animated Stacked Growing Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${totalHeight}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className={`w-full max-w-[42px] rounded-t-xl overflow-hidden flex flex-col justify-end group-hover:scale-105 group-hover:shadow-md transition-transform ${
                      item.total === 0 ? 'bg-neutral-100 opacity-60' : ''
                    }`}
                  >
                    {item.total > 0 ? (
                      <>
                        {/* Layaway Segment */}
                        <div
                          style={{ height: `${layawayHeight}%` }}
                          className="w-full bg-amber-200/90 hover:bg-amber-300 transition-colors"
                        />
                        {/* Upfront Cash Segment */}
                        <div
                          style={{ height: `${upfrontHeight}%` }}
                          className="w-full bg-gold-500 hover:bg-gold-600 transition-colors"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-neutral-200/60" />
                    )}
                  </motion.div>

                  {/* Month Label */}
                  <span className="text-xs font-bold text-neutral-600 mt-2 font-mono group-hover:text-gold-700 transition-colors">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart Sub-summary */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Peak Month:{' '}
              <b>
                {currentData.peakMonth?.name || 'N/A'}{' '}
                ({formatCurrency(currentData.peakMonth?.amount || 0)})
              </b>
            </span>
            <span className="text-emerald-700 font-bold font-mono">
              {currentData.momGrowthText || '+0.0% MoM Growth'}
            </span>
          </div>
        </FadeInUp>

        {/* PIE / DONUT GRAPH: Sales by Category with Stroke Animation */}
        <FadeInUp className="lg:col-span-5 rounded-3xl bg-white border border-gold-500/30 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gold-600" />
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Sales & Stock by Category
              </h3>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Live Share</span>
          </div>

          {/* Visual Category Donut Representation & List */}
          <div className="flex items-center gap-6 py-2">
            {/* Donut SVG */}
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {categorySales.map((cat: any, idx: number) => {
                  const pct = Math.max(cat.percentage, 1);
                  const strokeDasharray = `${pct} ${100 - pct}`;
                  const strokeDashoffset = -categorySales
                    .slice(0, idx)
                    .reduce((acc: number, c: any) => acc + (c.percentage || 0), 0);

                  return (
                    <motion.circle
                      key={cat.name}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={cat.color || '#D4AF37'}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                      onMouseEnter={() => setHoveredCategory(cat.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <PieChart className="w-5 h-5 text-gold-500/30" />
              </div>
            </div>

            {/* Category Breakdown Progress Bars */}
            <div className="flex-1 space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {categorySales.map((cat: any, idx: number) => (
                <div
                  key={cat.name}
                  onMouseEnter={() => setHoveredCategory(cat.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    hoveredCategory === cat.name ? 'bg-gold-500/10' : ''
                  }`}
                >
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-bold text-neutral-800 flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="font-mono font-bold text-neutral-900">{cat.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                      style={{ backgroundColor: cat.color }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex justify-between text-xs text-neutral-500 font-mono">
            <span>Total Catalog Value</span>
            <span className="font-bold text-neutral-900">
              {formatCurrency(currentData.totalCatalogVolume || currentData.totalCategoryValue || 0)}
            </span>
          </div>
        </FadeInUp>
      </div>

      {/* 3. RECENT AUDIT TRANSACTIONS TABLE */}
      <FadeInUp className="rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Recent Payments & Layaway Deposits
            </h3>
            <span className="text-xs text-neutral-500 font-mono">Live Audit Transaction Log</span>
          </div>
          <Link
            href="/admin/receipts"
            className="text-xs font-bold text-gold-700 hover:text-gold-900 flex items-center gap-1 group"
          >
            <span>View All Receipts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[11px]">
                <th className="text-left py-2.5">Receipt / Inv #</th>
                <th className="text-left py-2.5">Customer</th>
                <th className="text-center py-2.5">Type</th>
                <th className="text-center py-2.5">Method</th>
                <th className="text-right py-2.5">Amount</th>
                <th className="text-right py-2.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(!currentData.recentPayments || currentData.recentPayments.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400 font-mono">
                    No recent payments or layaway deposits recorded yet.
                  </td>
                </tr>
              ) : (
                currentData.recentPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 font-mono font-bold text-gold-700">
                      {payment.invoiceNumber || payment.paymentNumber}
                    </td>
                    <td className="py-3 text-neutral-900 font-semibold">
                      {payment.user?.name || 'Walk-in Customer'}
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={
                          payment.paymentType === 'DOWN_PAYMENT'
                            ? 'gold'
                            : payment.paymentType === 'INSTALLMENT'
                            ? 'outline-gold'
                            : 'emerald'
                        }
                        size="sm"
                      >
                        {payment.paymentType}
                      </Badge>
                    </td>
                    <td className="py-3 text-center text-neutral-700 font-mono font-medium">
                      {payment.paymentMethod}
                    </td>
                    <td className="py-3 text-right font-mono font-black text-neutral-900 text-sm">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 text-right text-neutral-500 font-mono text-[11px]">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeInUp>
    </div>
  );
}
