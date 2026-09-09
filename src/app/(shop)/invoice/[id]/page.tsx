'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/lib/store';

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-500 font-mono">Generating Official Receipt & Invoice...</p>
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
          <Link href="/admin/orders">
            <Button variant="secondary" size="sm" className="text-xs">
              Back to Orders
            </Button>
          </Link>
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
    <div className="min-h-screen bg-[#FCFCF9] py-6 px-4 sm:px-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="max-w-[420px] mx-auto mb-6 no-print flex items-center justify-between pb-3 border-b border-gold-500/20">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-gold-700 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Link>

        <Button
          onClick={handlePrint}
          variant="primary"
          size="sm"
          className="text-xs font-bold shadow-xs"
          leftIcon={<Printer className="w-3.5 h-3.5" />}
        >
          Print / Save PDF
        </Button>
      </div>

      {/* REAL-LIFE AUTHENTIC CLEAN RECEIPT SLIP (ONE-SIZE PRINTABLE CANVAS) */}
      <div
        id="printable-receipt"
        className="bg-white border border-neutral-300 rounded-xl p-6 sm:p-8 space-y-5 text-neutral-900 font-mono shadow-md w-full max-w-[380px] mx-auto print:w-[380px] print:max-w-[380px] print:min-w-[380px] print:mx-auto print:p-6 print:border print:border-neutral-300 print:rounded-lg print:shadow-none"
      >
        {/* Receipt Header */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-300">
          {settings.logoUrl && (
            <div className="w-12 h-12 mx-auto mb-1.5 rounded-full overflow-hidden border border-neutral-300 flex items-center justify-center bg-white shadow-2xs">
              <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-lg font-black tracking-wider uppercase font-serif text-neutral-950">
            {settings.companyName || 'DANICA GOLD'}
          </h2>
          <p className="text-[11px] text-neutral-600 font-medium">
            {settings.tagline || 'Fine Jewelry & Haute Joaillerie'}
          </p>
          <p className="text-[10px] text-neutral-500 leading-tight">
            {settings.address || 'Flagship Boutique & Vault'}<br />
            Tel: {settings.phone || '+63 (02) 8888-GOLD'}
          </p>
          <div className="pt-2">
            <span className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${
              isLayaway
                ? 'border-gold-600 text-gold-800 bg-gold-50/60'
                : 'border-neutral-400 text-neutral-800'
            }`}>
              {isLayaway ? '0% LAYAWAY SALES INVOICE' : 'OFFICIAL CASH RECEIPT'}
            </span>
          </div>
        </div>

        {/* Receipt Meta & Customer */}
        <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-neutral-300">
          <div className="flex justify-between">
            <span className="text-neutral-500">OR / Inv No:</span>
            <span className="font-bold text-neutral-900">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Date:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Client:</span>
            <span className="font-bold text-neutral-900">{client?.name || 'Walk-in Customer'}</span>
          </div>
          {client?.phone && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Contact:</span>
              <span>{client.phone}</span>
            </div>
          )}
          {client?.address && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Address:</span>
              <span className="text-right truncate max-w-[200px]">{client.address}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Payment Mode:</span>
            <span className="font-bold">{paymentMethod}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2 pb-3 border-b border-dashed border-neutral-300">
          <div className="flex justify-between text-[10px] text-neutral-500 uppercase font-bold">
            <span>Description</span>
            <span>Amount</span>
          </div>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-start text-xs">
              <div className="pr-2">
                <span className="font-bold block text-neutral-900 leading-tight">{item.name}</span>
                <span className="text-[10px] text-neutral-500">
                  {item.karat} • {formatGrams(item.weightGrams)} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                </span>
              </div>
              <span className="font-bold text-neutral-900 whitespace-nowrap">
                {formatCurrency(item.totalPrice || (item.price * (item.quantity || 1)))}
              </span>
            </div>
          ))}
        </div>

        {/* Financial Totals */}
        <div className="text-xs space-y-1.5 pb-3 border-b border-dashed border-neutral-300">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL AMOUNT:</span>
            <span className="text-neutral-950 font-black">{formatCurrency(totalAmount)}</span>
          </div>

          {isLayaway && (
            <>
              <div className="flex justify-between text-neutral-700">
                <span>DOWNPAYMENT PAID:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(downPaymentAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-900 font-bold">
                <span>REMAINING BALANCE:</span>
                <span className="text-sm font-black text-gold-700">{formatCurrency(remainingBalance)}</span>
              </div>
            </>
          )}
        </div>

        {/* Layaway Schedule (If Layaway) */}
        {isLayaway && installments.length > 0 && (
          <div className="space-y-1.5 pb-3 border-b border-dashed border-neutral-300">
            <span className="text-[10px] font-bold text-neutral-700 uppercase block">
              Payment Schedule ({frequency === 'TWICE_MONTHLY' ? 'Twice a Month' : frequency === 'WEEKLY' ? 'Weekly' : 'Monthly'}):
            </span>
            <div className="space-y-1 text-[11px]">
              {installments.map((inst: any) => (
                <div key={inst.id || inst.installmentNumber} className="flex justify-between items-center">
                  <span className="text-neutral-700">
                    #{inst.installmentNumber} • {new Date(inst.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{formatCurrency(inst.amountDue)}</span>
                    {inst.status === 'PAID' && (
                      <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                        PAID
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Authentic Simple Footer & Signatures */}
        <div className="space-y-5 pt-1 text-[10px] text-neutral-600 text-center">
          <p className="leading-tight italic text-neutral-600">
            {isLayaway
              ? '0% Interest Layaway. Gold spot rate is locked. Items are safely held in vault until fully paid.'
              : 'Thank you for your purchase! All items are 100% genuine certified solid gold.'}
          </p>

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-center">
            <div>
              <div className="border-b border-neutral-400 pb-1 h-6"></div>
              <span className="text-[9px] uppercase block mt-1">Customer Signature</span>
            </div>
            <div>
              <div className="border-b border-neutral-400 pb-1 h-6"></div>
              <span className="text-[9px] uppercase block mt-1">Authorized Cashier</span>
            </div>
          </div>

          <div className="text-[9px] text-neutral-400 pt-1 font-mono">
            *** OFFICIAL DANICA GOLD RECEIPT ***
          </div>
        </div>
      </div>
    </div>
  );
}
