'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Lock,
  User as UserIcon,
  Gem,
  RefreshCw,
  Truck,
  CheckCircle2,
  Calendar,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { useAuth, useSettings } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/gold-pricing';

export default function OrderHistoryPage() {
  const { user, openAuthModal } = useAuth();
  const { settings } = useSettings();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CASH' | 'LAYAWAY'>('ALL');

  const fetchOrders = async () => {
    if (!user || (!user.id && !user.email)) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (user.id) params.append('userId', user.id);
      if (user.email) params.append('userEmail', user.email);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.success && Array.isArray(data.orders) ? data.orders : []);
    } catch (e) {
      console.error('Failed to load order history', e);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ALL') return true;
    return order.orderType === activeTab;
  });

  const cashCount = orders.filter((o) => o.orderType === 'CASH').length;
  const layawayCount = orders.filter((o) => o.orderType === 'LAYAWAY').length;

  const parseProductImages = (imagesField: any): string[] => {
    if (!imagesField) return ['/images/jewelry-placeholder.png'];
    if (Array.isArray(imagesField)) return imagesField;
    try {
      const parsed = JSON.parse(imagesField);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['/images/jewelry-placeholder.png'];
    } catch {
      return [imagesField];
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 bg-[#FCFCF9]">
        <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-700 shadow-sm">
          <FileText className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Sign In to View Order History
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Access your direct gold purchases, active 0% layaway orders, official receipts, and tracking status.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => openAuthModal('signin')}
            className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider"
          >
            Sign In to Your Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 bg-[#FCFCF9] text-[#1A1A1A]">
      {/* Customer Header Banner */}
      <div className="rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 text-center md:text-left">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border border-gold-500/40 shadow-xs flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/40 flex items-center justify-center text-gold-700 flex-shrink-0 shadow-xs font-serif font-black text-xl">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h1 className="text-xl sm:text-2xl font-black font-serif text-neutral-900">
                {user.name}
              </h1>
              <Badge variant="gold" size="sm">
                {user.role === 'ADMIN' ? 'EXECUTIVE ADMIN' : 'VERIFIED CLIENT'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {user.email} • {user.phone || 'No phone set'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link href="/layaways">
            <Button variant="secondary" size="sm" leftIcon={<Lock className="w-3.5 h-3.5" />} className="text-xs font-bold">
              Active Layaways ({layawayCount})
            </Button>
          </Link>

          <Link href="/profile">
            <Button variant="secondary" size="sm" leftIcon={<UserIcon className="w-3.5 h-3.5" />} className="text-xs font-bold">
              Profile Settings
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchOrders}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs font-bold"
          >
            Refresh
          </Button>

          <Link href="/catalog">
            <Button variant="gold-outline" size="sm" leftIcon={<Gem className="w-3.5 h-3.5" />} className="text-xs font-bold">
              Gold Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Page Title & Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-neutral-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold-600" />
            Order History & Receipts
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Complete record of your fine gold acquisitions, including full payments and 0% layaway orders.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-gold-500/25 shadow-2xs self-start md:self-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-gold-500 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('CASH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CASH'
                ? 'bg-gold-500 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Full Cash ({cashCount})
          </button>
          <button
            onClick={() => setActiveTab('LAYAWAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'LAYAWAY'
                ? 'bg-gold-500 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            0% Layaway ({layawayCount})
          </button>
        </div>
      </div>

      {/* Orders Listing */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 text-center flex items-center justify-center">
            <Spinner size="lg" label="Retrieving your order records..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white border border-gold-500/25 p-8 space-y-3 shadow-sm">
            <ShoppingBag className="w-10 h-10 text-gold-500/50 mx-auto" />
            <h3 className="text-base font-bold text-neutral-900 font-serif">
              {activeTab === 'ALL'
                ? 'No Orders Found'
                : activeTab === 'LAYAWAY'
                ? 'No Layaway Orders Found'
                : 'No Cash Orders Found'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {activeTab === 'ALL'
                ? 'You have not placed any orders yet. Discover our certified gold jewelry catalog.'
                : activeTab === 'LAYAWAY'
                ? 'You have no layaway orders. Lock in spot gold prices with flexible 0% interest terms.'
                : 'You have no full cash orders.'}
            </p>
            <Link href="/catalog">
              <Button variant="primary" size="sm" leftIcon={<Gem className="w-3.5 h-3.5" />} className="text-xs font-bold">
                Explore Gold Collections
              </Button>
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isLayaway = order.orderType === 'LAYAWAY';
            const contract = order.layawayContract;
            const items = order.orderItems || [];

            return (
              <div
                key={order.id}
                className="rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 space-y-5 shadow-sm transition-all hover:shadow-md"
              >
                {/* Header: Order Number, Type, Status, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gold-500/20 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-gold-700 text-base sm:text-lg">
                        {order.orderNumber}
                      </span>
                      {isLayaway ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-800 text-[11px] font-bold">
                          <Lock className="w-3 h-3 text-gold-600" />
                          0% Layaway Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                          <CreditCard className="w-3 h-3 text-blue-600" />
                          Full Cash Order
                        </span>
                      )}
                      <Badge
                        variant={
                          order.status === 'DELIVERED'
                            ? 'emerald'
                            : order.status === 'PROCESSING' || order.status === 'CONFIRMED'
                            ? 'gold'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • {items.length} Item(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/invoice/${order.id}`}>
                      <Button
                        variant="gold-outline"
                        size="sm"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                        className="text-xs font-bold whitespace-nowrap"
                      >
                        Official Receipt
                      </Button>
                    </Link>
                    {isLayaway && (
                      <Link href="/layaways">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Lock className="w-3.5 h-3.5" />}
                          className="text-xs font-bold whitespace-nowrap"
                        >
                          Layaway Portal
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Ordered Items Preview */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-gold-600" />
                    Ordered Jewelry Pieces
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item: any) => {
                      const prod = item.product || {};
                      const images = parseProductImages(prod.images);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F2] border border-gold-500/20"
                        >
                          <div className="w-14 h-14 rounded-xl bg-white border border-gold-500/30 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                            <img
                              src={images[0]}
                              alt={prod.name || 'Gold Jewelry'}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h5 className="text-xs font-bold text-neutral-900 truncate">
                              {prod.name || 'Solid Gold Item'}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                              <span className="font-mono font-bold text-gold-700">{item.karat || prod.karat || '18K'}</span>
                              <span>•</span>
                              <span>{item.weightGrams || prod.weightGrams || 0}g</span>
                              <span>•</span>
                              <span>Qty: {item.quantity || 1}</span>
                            </div>
                            <span className="font-mono font-bold text-xs text-neutral-900 block mt-0.5">
                              {formatCurrency(item.totalPrice || item.unitPrice || 0)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Layaway Breakdown (If Layaway Order) */}
                {isLayaway && contract && (
                  <div className="p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-gold-800">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Contract: {contract.contractNumber}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                        Locked Gold: ₱{contract.lockedGoldSpotRate}/g
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-neutral-500 block uppercase font-bold">Contract Total</span>
                        <span className="font-mono font-bold text-neutral-900 text-sm">{formatCurrency(contract.totalAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block uppercase font-bold">Down Payment ({contract.downPaymentPercent}%)</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">{formatCurrency(contract.downPaymentAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block uppercase font-bold">Remaining Balance</span>
                        <span className="font-mono font-bold text-gold-700 text-sm">{formatCurrency(contract.remainingBalance)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block uppercase font-bold">Term / Monthly</span>
                        <span className="font-mono font-bold text-neutral-800 text-sm">{contract.termMonths} Mo ({formatCurrency(contract.monthlyInstallment)}/mo)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary Footer: Address & Total */}
                <div className="pt-3 border-t border-gold-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <Truck className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                      <span>
                        <b>Delivery / Handover:</b> {order.shippingAddress || 'Store Pickup'}, {order.city || 'Metro Manila'}
                      </span>
                    </div>
                    {order.trackingNumber && (
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Tracking: {order.courier || 'Armored Vault'} — #{order.trackingNumber}
                      </p>
                    )}
                  </div>

                  <div className="text-right sm:self-auto self-end">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                      Total Order Value
                    </span>
                    <span className="font-mono font-black text-base sm:text-lg text-neutral-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
