'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Lock,
  CheckCircle2,
  ShieldCheck,
  Scale,
  ArrowRight,
  User as UserIcon,
  Wallet,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { useCart, useAuth, useSettings } from '@/lib/store';
import { calculateLayawayPlan } from '@/lib/layaway';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as 'CASH' | 'LAYAWAY') || 'LAYAWAY';
  const initialDown = parseInt(searchParams.get('downPercent') || '20', 10);
  const initialTerm = parseInt(searchParams.get('term') || '6', 10);

  const { items, subtotal, totalGrams, clearCart, isLoaded } = useCart();
  const { user, openAuthModal } = useAuth();
  const { settings } = useSettings();

  const [checkoutMode, setCheckoutMode] = useState<'CASH' | 'LAYAWAY'>(initialMode);
  const [downPercent, setDownPercent] = useState<number>(initialDown);
  const [termMonths, setTermMonths] = useState<number>(initialTerm);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MAYA' | 'GCASH'>('CASH');

  // Customer form state (Philippines defaults)
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+63 ');
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || 'Metro Manila');
  const [postalCode, setPostalCode] = useState(user?.zipCode || '');

  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
      if (user.phone) setCustomerPhone(user.phone);
      if (user.address) setShippingAddress(user.address);
      if (user.city) setCity(user.city);
      if (user.zipCode) setPostalCode(user.zipCode);
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleteData, setOrderCompleteData] = useState<any>(null);

  const plan = calculateLayawayPlan(subtotal, downPercent, termMonths);
  const totalDueToday = checkoutMode === 'LAYAWAY' ? plan.downPaymentAmount : subtotal;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        orderType: checkoutMode,
        userId: user?.id,
        items,
        shippingAddress,
        city,
        postalCode,
        paymentMethod,
        downPaymentPercent: downPercent,
        termMonths,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#F5E296', '#FFF0B8', '#AA7C11'],
          });
        } catch (e) {}

        setOrderCompleteData(data.data);
        clearCart();
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (e) {
      console.error('Checkout failed', e);
      alert('Network error while processing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center flex items-center justify-center">
        <Spinner size="lg" label="Preparing Checkout..." />
      </div>
    );
  }

  // Order Completion Success Screen
  if (orderCompleteData) {
    const isLayaway = orderCompleteData.type === 'LAYAWAY';
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-5 bg-[#FCFCF9]">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-gold-700 uppercase tracking-wider">
            {isLayaway ? 'Layaway Contract Confirmed & Price Locked' : 'Order Confirmed'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Thank You, {customerName}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
            {isLayaway
              ? `Contract #${orderCompleteData.contract?.contractNumber} is active with gold rate locked in.`
              : `Order #${orderCompleteData.order?.orderNumber} has been verified.`}
          </p>
        </div>

        {/* Receipt / Contract Highlight Box */}
        <div className="rounded-2xl bg-white border border-gold-500/30 p-5 text-left max-w-md mx-auto space-y-2.5 text-xs shadow-xs">
          <div className="flex justify-between pb-2 border-b border-neutral-100">
            <span className="text-neutral-500">Transaction</span>
            <span className="font-mono font-bold text-neutral-900">
              {orderCompleteData.payment?.paymentNumber || 'PAY-2026-CONFIRMED'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">Paid Today</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {formatCurrency(orderCompleteData.payment?.amount)}
            </span>
          </div>

          {isLayaway && (
            <>
              <div className="flex justify-between">
                <span className="text-neutral-500">Remaining Balance</span>
                <span className="font-mono font-bold text-neutral-900">
                  {formatCurrency(orderCompleteData.contract?.remainingBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Monthly Installment</span>
                <span className="font-mono font-bold text-gold-700">
                  {formatCurrency(orderCompleteData.contract?.monthlyInstallment)}/mo
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Link href="/account">
            <Button variant="primary" size="md" className="text-xs uppercase tracking-wider font-bold">
              View Layaway Hub
            </Button>
          </Link>
          <Link href={`/invoice/${orderCompleteData.order?.id || orderCompleteData.contract?.id || 'DG-2026-001'}`}>
            <Button variant="secondary" size="md" className="text-xs uppercase tracking-wider font-bold">
              Print Invoice
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 bg-[#FCFCF9]">
      <div className="flex flex-col sm:flex-row items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black font-serif text-neutral-900">
            Secure Checkout & Price Lock
          </h1>
          <p className="text-xs text-neutral-500">
            Purchase fine jewelry outright or lock in spot price via 0% layaway.
          </p>
        </div>

        {!user && (
          <button
            type="button"
            onClick={() => openAuthModal('signin')}
            className="text-xs font-bold text-gold-700 hover:text-gold-900 bg-gold-500/15 border border-gold-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <UserIcon className="w-3.5 h-3.5 text-gold-600" />
            <span>Sign In with Google / Email</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Agreement, Delivery & Payment */}
          <div className="lg:col-span-7 space-y-4">
            {/* Mode Toggle */}
            <div className="rounded-2xl bg-white border border-gold-500/30 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                1. Select Agreement
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCheckoutMode('LAYAWAY')}
                  className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                    checkoutMode === 'LAYAWAY'
                      ? 'bg-gold-500 text-white border-gold-500 shadow-2xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-gold-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5" />
                    <span>0% Price-Lock Layaway</span>
                  </div>
                  <p className="text-[10px] opacity-90 mt-0.5">
                    Pay 20%–50% today. Freeze gold spot price.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutMode('CASH')}
                  className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                    checkoutMode === 'CASH'
                      ? 'bg-gold-500 text-white border-gold-500 shadow-2xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-gold-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Full Cash Settlement</span>
                  </div>
                  <p className="text-[10px] opacity-90 mt-0.5">
                    Pay 100% upfront for immediate courier dispatch.
                  </p>
                </button>
              </div>

              {/* Layaway Options */}
              {checkoutMode === 'LAYAWAY' && (
                <div className="pt-3 border-t border-neutral-100 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">
                        Down Payment %
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[20, 30, 50].map((pct) => (
                          <button
                            type="button"
                            key={pct}
                            onClick={() => setDownPercent(pct)}
                            className={`py-1.5 px-2 text-xs font-bold rounded-lg border cursor-pointer ${
                              downPercent === pct
                                ? 'bg-gold-500 text-white border-gold-500 shadow-2xs'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">
                        Terms
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 3, 6, 9, 12].map((m) => (
                          <button
                            type="button"
                            key={m}
                            onClick={() => setTermMonths(m)}
                            className={`py-1.5 px-1 text-xs font-bold rounded-lg border cursor-pointer ${
                              termMonths === m
                                ? 'bg-gold-500 text-white border-gold-500 shadow-2xs'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                            }`}
                          >
                            {m}mo
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-[11px] text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                    <span>Price Freeze Guarantee: Spot rate locked for {termMonths} months.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Delivery Info */}
            <div className="rounded-2xl bg-white border border-gold-500/30 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                2. Delivery & Customer Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
                <Input
                  label="Delivery Address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                />
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  label="Postal Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="rounded-2xl bg-white border border-gold-500/30 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                3. Payment Method (Philippines)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'CASH', label: 'Cash / COD', desc: 'Vault pickup or COD courier', icon: Banknote },
                  { id: 'MAYA', label: 'Maya', desc: 'Maya QR / Account', icon: Wallet },
                  { id: 'GCASH', label: 'GCash', desc: 'GCash Express / QR', icon: Smartphone },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3 rounded-xl text-center border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-gold-500 text-white border-gold-500 shadow-2xs ring-2 ring-gold-500/20'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-gold-500 hover:bg-gold-500/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gold-600'}`} />
                      <span className="truncate w-full text-xs font-bold">{pm.label}</span>
                      <span className={`text-[10px] truncate max-w-full font-normal ${isSelected ? 'text-white/85' : 'text-neutral-500'}`}>
                        {pm.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Details / Instructions Banner */}
              <div className="mt-2 p-3 rounded-xl bg-gold-500/10 border border-gold-500/30 text-xs text-neutral-800">
                {paymentMethod === 'CASH' && (
                  <p>
                    <strong className="text-gold-800 font-bold">Cash / COD:</strong> Settle payment in cash upon insured vault courier delivery to your address or in-person pickup.
                  </p>
                )}
                {paymentMethod === 'MAYA' && (
                  <p>
                    <strong className="text-gold-800 font-bold">Maya:</strong> Pay via Maya QR code or transfer to our verified merchant account upon checkout.
                  </p>
                )}
                {paymentMethod === 'GCASH' && (
                  <p>
                    <strong className="text-gold-800 font-bold">GCash:</strong> Pay via GCash Express Send or scan official QR code to our verified merchant number.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-5 rounded-2xl bg-white border border-gold-500/30 p-5 space-y-4 sticky top-20 shadow-xs">
            <h3 className="text-sm font-bold font-serif text-neutral-900 pb-2 border-b border-neutral-100">
              Payment Breakdown
            </h3>

            {/* Cart Items Preview */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-neutral-900 block line-clamp-1">{item.product.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Qty: {item.quantity} • {formatGrams(item.product.weightGrams * item.quantity)} ({item.product.karat})
                    </span>
                  </div>
                  <span className="font-bold text-neutral-900 font-mono">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Gold Weight</span>
                <span className="font-mono font-bold text-neutral-900">{formatGrams(totalGrams)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Retail Value</span>
                <span className="font-mono font-bold text-neutral-900">{formatCurrency(subtotal)}</span>
              </div>

              {checkoutMode === 'LAYAWAY' && (
                <>
                  <div className="flex justify-between text-gold-800 font-semibold">
                    <span>Deposit Due Today ({downPercent}%)</span>
                    <span className="font-mono font-bold">{formatCurrency(plan.downPaymentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Remaining ({termMonths} Months)</span>
                    <span className="font-mono font-bold text-neutral-800">{formatCurrency(plan.remainingBalance)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Monthly Installment</span>
                    <span className="font-mono font-bold text-gold-700">{formatCurrency(plan.monthlyInstallment)}/mo</span>
                  </div>
                </>
              )}
            </div>

            {/* Total Due Box */}
            <div className="rounded-xl bg-[#FCFCF9] border border-gold-500/30 p-3.5 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900 uppercase block">Total Due Today</span>
                <span className="text-[10px] text-neutral-500">
                  {checkoutMode === 'LAYAWAY' ? 'Deposit & Freeze' : 'Full Payment'}
                </span>
              </div>
              <span className="text-xl font-black text-neutral-900 font-mono">
                {formatCurrency(totalDueToday)}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full text-xs font-bold uppercase tracking-wider"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {checkoutMode === 'LAYAWAY'
                ? `Lock Price & Pay Deposit (${formatCurrency(totalDueToday)})`
                : `Authorize Full Cash Payment (${formatCurrency(totalDueToday)})`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-24 text-center flex items-center justify-center">
          <Spinner size="lg" label="Loading Checkout..." />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
