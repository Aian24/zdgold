'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useSettings, useAuth } from '@/lib/store';

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoice/${id}`);
      const data = await res.json();
      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      } else {
        setError(data.error || 'Failed to load invoice receipt.');
      }
    } catch (e) {
      console.error('Failed to load invoice', e);
      setError('Unable to retrieve invoice record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (user?.role === 'ADMIN') {
      router.push('/admin/orders');
    } else {
      router.push('/orders');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-28 text-center flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" label="Generating Official Receipt & Invoice..." />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">Receipt Not Found</h2>
        <p className="text-xs text-neutral-500">{error || 'Could not find the requested receipt or order.'}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
          >
            Back to Orders
          </button>
          <Button variant="primary" size="sm" onClick={fetchInvoice} className="text-xs" leftIcon={<RefreshCw className="w-3 h-3" />}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const {
    receiptNumber,
    transactionType,
    issueDate,
    client,
    paymentMethod,
    items = [],
    pricing = {},
    layawayTerms,
  } = invoice;

  const isLayaway = transactionType === 'LAYAWAY';
  const totalAmount = pricing.totalAmount || 0;
  const downPaymentAmount = pricing.downPaymentAmount || 0;
  const remainingBalance = pricing.remainingBalance || 0;
  const installments = layawayTerms?.installments || [];
  const frequency = layawayTerms?.frequency || 'MONTHLY';

  const formattedDate = new Date(issueDate || Date.now()).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#FCFCF9] py-4 px-4 sm:px-6 print:bg-white print:p-0 print:m-0">
      {/* Top Action Bar (hidden on print) */}
      <div className="max-w-xl mx-auto mb-4 no-print flex items-center justify-between pb-2 border-b border-gold-500/20">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 hover:text-black transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <Button
          onClick={handlePrint}
          variant="primary"
          size="sm"
          className="text-xs font-bold shadow-xs h-8"
          leftIcon={<Printer className="w-3.5 h-3.5" />}
        >
          Print / Save PDF
        </Button>
      </div>

      {/* REAL-LIFE AUTHENTIC CLEAN RECEIPT SLIP (FITS EXACTLY 1 SINGLE FULL HEIGHT PAGE) */}
      <div
        id="printable-receipt"
        className="bg-white border-2 border-black rounded-xl p-5 sm:p-6 space-y-3 text-black font-mono shadow-md w-full max-w-xl mx-auto print:max-w-none print:w-full print:p-4 print:space-y-4 print:border-0 print:border-none print:rounded-none print:shadow-none print:flex print:flex-col print:justify-between print:min-h-[92vh]"
      >
        {/* Top & Content Section */}
        <div className="space-y-3 print:space-y-4">
          {/* Receipt Header */}
          <div className="text-center space-y-1 pb-2.5 print:pb-4 border-b-2 border-dashed border-black">
            {settings.logoUrl && (
              <div className="w-12 h-12 print:w-14 print:h-14 mx-auto mb-1 rounded-full overflow-hidden border border-black flex items-center justify-center bg-white shadow-2xs">
                <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-cover" />
              </div>
            )}
            <h2 className="text-xl sm:text-2xl print:text-2xl font-black tracking-wider uppercase font-serif text-black leading-tight">
              {settings.companyName || 'ZD GOLD PHILIPPINES'}
            </h2>
            <p className="text-[11px] sm:text-xs print:text-xs text-black font-bold tracking-wide">
              {settings.tagline || 'Fine Gold Jewelry & 0% Interest Layaway'}
            </p>
            <p className="text-[10px] sm:text-[11px] print:text-xs text-black font-medium leading-tight">
              {settings.address || 'Metro Manila, Philippines'}<br />
              Tel: {settings.phone || '+63 (02) 8888-GOLD'}
            </p>
            <div className="pt-1.5 print:pt-2">
              <span className="inline-block px-3.5 py-1 rounded border border-black text-[11px] sm:text-xs print:text-xs font-black uppercase tracking-wider text-black bg-white">
                {isLayaway ? '0% LAYAWAY SALES INVOICE' : 'OFFICIAL CASH RECEIPT'}
              </span>
            </div>
          </div>

          {/* Receipt Meta & Customer */}
          <div className="text-[11px] sm:text-xs print:text-xs space-y-1 print:space-y-1.5 pb-2.5 print:pb-3 border-b-2 border-dashed border-black">
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">OR / Inv No:</span>
              <span className="font-black text-black">{receiptNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">Date:</span>
              <span className="font-semibold text-black">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">Client:</span>
              <span className="font-black text-black">{client?.name || 'Walk-in Customer'}</span>
            </div>
            {client?.phone && (
              <div className="flex justify-between items-center">
                <span className="font-bold text-black">Contact:</span>
                <span className="font-semibold text-black">{client.phone}</span>
              </div>
            )}
            {client?.address && (
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-black shrink-0">Address:</span>
                <span className="text-right font-medium text-black truncate max-w-[320px]">{client.address}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-bold text-black">Payment Mode:</span>
              <span className="font-black text-black uppercase">{paymentMethod}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 print:space-y-2.5 pb-2.5 print:pb-3 border-b-2 border-dashed border-black">
            <div className="flex justify-between text-[11px] sm:text-xs print:text-xs text-black uppercase font-black pb-0.5 border-b border-black">
              <span>Description</span>
              <span>Amount</span>
            </div>
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-[11px] sm:text-xs print:text-xs gap-4">
                <div className="pr-2">
                  <span className="font-black block text-black text-xs sm:text-sm print:text-sm leading-snug">{item.name}</span>
                  <span className="text-[10px] sm:text-[11px] print:text-xs font-semibold text-black">
                    {item.karat} • {formatGrams(item.weightGrams)} {item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}
                  </span>
                </div>
                <span className="font-black text-black text-xs sm:text-sm print:text-sm whitespace-nowrap">
                  {formatCurrency(item.totalPrice || (item.price * (item.quantity || 1)))}
                </span>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="space-y-1.5 print:space-y-2 pb-2.5 print:pb-3 border-b-2 border-dashed border-black text-xs sm:text-sm print:text-sm">
            <div className="flex justify-between items-baseline font-black text-sm sm:text-base print:text-base text-black">
              <span>TOTAL AMOUNT:</span>
              <span className="font-black font-mono">{formatCurrency(totalAmount)}</span>
            </div>

            {isLayaway && (
              <>
                <div className="flex justify-between items-baseline text-[11px] sm:text-xs print:text-xs font-bold text-black">
                  <span>DOWNPAYMENT PAID:</span>
                  <span className="font-black font-mono">{formatCurrency(downPaymentAmount)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs sm:text-sm print:text-sm font-black text-black pt-1 border-t border-black">
                  <span>REMAINING BALANCE:</span>
                  <span className="font-black font-mono">{formatCurrency(remainingBalance)}</span>
                </div>
              </>
            )}
          </div>

          {/* Layaway Schedule (If Layaway) */}
          {isLayaway && installments.length > 0 && (
            <div className="space-y-1.5 print:space-y-2 pb-2.5 print:pb-3 border-b-2 border-dashed border-black">
              <span className="text-[11px] sm:text-xs print:text-xs font-black text-black uppercase block">
                Payment Schedule ({frequency === 'TWICE_MONTHLY' ? 'Twice a Month' : frequency === 'WEEKLY' ? 'Weekly' : 'Monthly'}):
              </span>
              <div className="space-y-1 text-[11px] sm:text-xs print:text-xs">
                {installments.map((inst: any) => (
                  <div key={inst.id || inst.installmentNumber} className="flex justify-between items-center py-0.5">
                    <span className="text-black font-semibold">
                      #{inst.installmentNumber} • {new Date(inst.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black font-mono">{formatCurrency(inst.amountDue)}</span>
                      {inst.status === 'PAID' && (
                        <span className="text-[9px] px-1 py-0.2 border border-black text-black font-black uppercase">
                          PAID
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Authentic Compact Footer & Signatures (Pushed to bottom on print) */}
        <div className="space-y-3 print:space-y-4 pt-2 print:pt-4 text-center text-black">
          <p className="text-[10px] sm:text-[11px] print:text-xs font-medium italic text-black leading-tight">
            {isLayaway
              ? '0% Interest Layaway. Gold spot rate is locked. Items are safely held in vault until fully paid.'
              : 'Thank you for your purchase! All items are 100% genuine certified solid gold.'}
          </p>

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-6 print:gap-10 pt-2 print:pt-4 text-center">
            <div>
              <div className="border-b border-black pb-1 h-5 print:h-8"></div>
              <span className="text-[10px] print:text-xs uppercase font-bold text-black block mt-1">Customer Signature</span>
            </div>
            <div>
              <div className="border-b border-black pb-1 h-5 print:h-8"></div>
              <span className="text-[10px] print:text-xs uppercase font-bold text-black block mt-1">Authorized Cashier</span>
            </div>
          </div>

          <div className="text-[10px] print:text-xs font-bold font-mono text-black pt-1 tracking-wider">
            *** OFFICIAL {settings.companyName ? settings.companyName.toUpperCase() : 'ZD GOLD'} RECEIPT ***
          </div>
        </div>
      </div>
    </div>
  );
}
