'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Printer,
  Save,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  RefreshCw,
  Search,
  CheckCircle2,
  UserCheck,
  Coins,
  CreditCard,
  RotateCcw,
  Eye,
  FileCheck,
  FileText,
} from 'lucide-react';
import { GoldKarat } from '@/lib/types';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettings } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination, BulkActionBar } from '@/components/ui/DataTableControls';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showToast,
} from '@/lib/swal';

interface ReceiptItem {
  id: string;
  name: string;
  karat: string;
  weightGrams: number;
  price: number;
  quantity: number;
}

interface InstallmentRow {
  id: string;
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  amountDue: number;
  status: 'PENDING' | 'PAID';
}

export default function AdminReceiptsPage() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'generator' | 'ledger'>('generator');

  // Client Details (Simple)
  const [clientName, setClientName] = useState<string>('Maria Santos');
  const [clientPhone, setClientPhone] = useState<string>('+63 917 888 2345');
  const [clientEmail, setClientEmail] = useState<string>('maria.santos@example.ph');
  const [receiptNumber, setReceiptNumber] = useState<string>(`DG-OR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Transaction Settings
  const [transactionType, setTransactionType] = useState<'LAYAWAY' | 'CASH'>('LAYAWAY');
  const [paymentMethod, setPaymentMethod] = useState<string>('GCash');

  // Items
  const [items, setItems] = useState<ReceiptItem[]>([
    {
      id: '1',
      name: '18K Saudi Gold Franco Chain',
      karat: '18K',
      weightGrams: 12.5,
      price: 48000,
      quantity: 1,
    },
  ]);

  // Layaway Setup
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(10000);
  const [frequency, setFrequency] = useState<'TWICE_MONTHLY' | 'MONTHLY' | 'WEEKLY'>('TWICE_MONTHLY');
  const [installmentCount, setInstallmentCount] = useState<number>(6);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [savedReceipts, setSavedReceipts] = useState<any[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [searchLedger, setSearchLedger] = useState('');

  // Selection & Pagination for Saved Receipts Tab
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calculations
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weightGrams) || 0) * (Number(item.quantity) || 1), 0);
  const remainingBalance = Math.max(0, totalAmount - (transactionType === 'LAYAWAY' ? downPaymentAmount : totalAmount));

  // Generate Layaway Schedule automatically
  useEffect(() => {
    if (transactionType !== 'LAYAWAY' || remainingBalance <= 0 || installmentCount <= 0) {
      setInstallments([]);
      return;
    }

    const equalAmount = Number((remainingBalance / installmentCount).toFixed(2));
    const start = new Date(startDate || new Date());
    const generated: InstallmentRow[] = [];

    for (let i = 1; i <= installmentCount; i++) {
      const nextDate = new Date(start);
      if (frequency === 'MONTHLY') {
        nextDate.setMonth(start.getMonth() + i);
      } else if (frequency === 'TWICE_MONTHLY') {
        nextDate.setDate(start.getDate() + i * 15);
      } else if (frequency === 'WEEKLY') {
        nextDate.setDate(start.getDate() + i * 7);
      }

      const dateStr = nextDate.toISOString().split('T')[0];
      const amount = i === installmentCount ? Number((remainingBalance - equalAmount * (installmentCount - 1)).toFixed(2)) : equalAmount;

      generated.push({
        id: `inst-${i}`,
        installmentNumber: i,
        dueDate: dateStr,
        amountDue: amount,
        status: 'PENDING',
      });
    }

    setInstallments(generated);
  }, [startDate, remainingBalance, frequency, installmentCount, transactionType]);

  // Update Item
  const handleUpdateItem = (index: number, field: keyof ReceiptItem, val: any) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: val };
    setItems(copy);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        name: 'Gold Ring / Pendant',
        karat: '18K',
        weightGrams: 3.5,
        price: 15000,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Update Installment Row Date or Amount
  const handleUpdateInstallment = (index: number, field: keyof InstallmentRow, val: any) => {
    const copy = [...installments];
    copy[index] = { ...copy[index], [field]: val };
    setInstallments(copy);
  };

  // Quick Preset Downpayment
  const handleSetDownPaymentPercent = (percent: number) => {
    const val = Math.round((totalAmount * (percent / 100)) / 100) * 100;
    setDownPaymentAmount(val);
  };

  // Fetch receipts ledger
  const fetchReceiptsLedger = async () => {
    setIsLoadingLedger(true);
    try {
      const res = await fetch('/api/receipts');
      const data = await res.json();
      if (data.success && data.receipts) {
        setSavedReceipts(data.receipts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchReceiptsLedger();
    }
  }, [activeTab]);

  // Filtered & Paginated for Ledger
  const filteredReceipts = savedReceipts.filter(
    (r) =>
      r.orderNumber?.toLowerCase().includes(searchLedger.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(searchLedger.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(searchLedger.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReceipts.length / pageSize) || 1;
  const paginatedReceipts = filteredReceipts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllOnPageSelected =
    paginatedReceipts.length > 0 && paginatedReceipts.every((r) => selectedIds.includes(r.id));

  const handleSelectAll = () => {
    if (isAllOnPageSelected) {
      const pageIds = new Set(paginatedReceipts.map((r) => r.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...paginatedReceipts.map((r) => r.id)]));
      setSelectedIds(combined);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteReceipts = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await showConfirmDialog({
      title: 'Delete Selected Receipts?',
      text: `Are you sure you want to delete ${selectedIds.length} receipt record(s)?`,
      confirmButtonText: 'Yes, Delete All',
      isDanger: true,
    });

    if (!confirmed) return;

    setIsDeletingBulk(true);
    try {
      const res = await fetch(`/api/receipts?ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        await showSuccessAlert('Receipts Deleted', `${selectedIds.length} receipt records were deleted.`);
        fetchReceiptsLedger();
      } else {
        await showErrorAlert('Delete Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error deleting receipts');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleDeleteReceipt = async (id: string, orderNumber: string) => {
    const confirmed = await showConfirmDialog({
      title: `Delete Receipt ${orderNumber}?`,
      text: 'Are you sure you want to remove this receipt ledger record?',
      confirmButtonText: 'Yes, Delete',
      isDanger: true,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/receipts?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        await showSuccessAlert('Receipt Deleted', `Receipt ${orderNumber} was removed.`);
        fetchReceiptsLedger();
      } else {
        await showErrorAlert('Delete Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error deleting receipt');
    }
  };

  // Save to database
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const payload = {
        client: {
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          address: 'Store Pickup / Counter Release',
        },
        transactionType,
        items,
        pricing: {
          subtotal: totalAmount,
          totalAmount,
          totalWeightGrams: totalWeight,
          downPaymentAmount: transactionType === 'LAYAWAY' ? downPaymentAmount : totalAmount,
          remainingBalance,
        },
        layawayTerms: transactionType === 'LAYAWAY' ? {
          startDate,
          frequency,
          termMonths: Math.ceil(installments.length / (frequency === 'TWICE_MONTHLY' ? 2 : 1)),
          installments,
        } : null,
        paymentDetails: {
          receiptNumber,
          paymentMethod,
          referenceCode: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
          amountPaid: transactionType === 'LAYAWAY' ? downPaymentAmount : totalAmount,
        },
      };

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        await showSuccessAlert(
          'Receipt Saved!',
          `Official receipt ${data.orderNumber} is saved and available in the ledger.`
        );
      } else {
        await showErrorAlert('Save Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Network error saving receipt.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setReceiptNumber(`DG-OR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setClientName('Maria Santos');
    setClientPhone('+63 917 888 2345');
    setTransactionType('LAYAWAY');
    setFrequency('TWICE_MONTHLY');
    setInstallmentCount(6);
    setDownPaymentAmount(10000);
    showToast('Receipt editor reset', 'info');
  };

  return (
    <div className="space-y-6 overflow-hidden max-w-6xl mx-auto">
      {/* Top Header Controls (Hidden on print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-serif text-neutral-900">
              Receipt Generator & Ledger
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Create simple, authentic receipts for Cash or 0% Layaway with calendar due dates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveToDatabase}
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Save Receipt
            </Button>
            <Button
              variant="gold-outline"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs font-bold bg-white"
            >
              Print Receipt
            </Button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Receipt Editor & Preview
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Saved Receipts Table
          </button>
        </div>
      </div>

      {/* GENERATOR TAB */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: SIMPLE FORM INPUTS (Hidden on print) */}
          <div className="no-print lg:col-span-5 space-y-4">
            {/* 1. Client Info */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-2xs">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                1. Client & Receipt Details
              </span>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-medium text-neutral-600 block mb-0.5">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:bg-white focus:border-gold-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 block mb-0.5">Phone / Contact</label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+63 917..."
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-900 focus:bg-white focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 block mb-0.5">Receipt No.</label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900 focus:bg-white focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Jewelry Item */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  2. Item Description & Price
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[11px] font-bold text-gold-700 hover:text-gold-900 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                        placeholder="e.g. 18K Saudi Gold Franco Chain"
                        className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs font-bold text-neutral-900"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-neutral-500 block mb-0.5">Karat</label>
                        <select
                          value={item.karat}
                          onChange={(e) => handleUpdateItem(idx, 'karat', e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-lg p-1 text-xs font-bold"
                        >
                          <option value="24K">24K</option>
                          <option value="22K">22K</option>
                          <option value="18K">18K</option>
                          <option value="14K">14K</option>
                          <option value="10K">10K</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-500 block mb-0.5">Weight (g)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          value={item.weightGrams === 0 ? '' : item.weightGrams}
                          onChange={(e) => handleUpdateItem(idx, 'weightGrams', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-neutral-200 rounded-lg p-1 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-500 block mb-0.5">Price (₱)</label>
                        <input
                          type="number"
                          step="500"
                          placeholder="0"
                          value={item.price === 0 ? '' : item.price}
                          onChange={(e) => handleUpdateItem(idx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-neutral-300 rounded-lg p-1 text-xs font-mono font-bold text-neutral-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 text-xs border-t border-neutral-100">
                <span className="text-neutral-500">Total Price:</span>
                <span className="text-sm font-mono font-black text-neutral-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* 3. Payment Mode & Layaway Terms */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-2xs">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                3. Payment Plan & Dates
              </span>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionType('LAYAWAY')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    transactionType === 'LAYAWAY'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  0% Layaway (Installments)
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('CASH')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    transactionType === 'CASH'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  Full Cash (Paid in Full)
                </button>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[11px] font-medium text-neutral-600 block mb-0.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 font-medium"
                >
                  <option value="GCash">GCash</option>
                  <option value="Maya">Maya</option>
                  <option value="Bank Wire (BDO/BPI)">Bank Wire (BDO / BPI)</option>
                  <option value="Cash">Cash (Over the counter)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Post-dated Check">Post-dated Check</option>
                </select>
              </div>

              {/* Layaway Parameters (If Layaway) */}
              {transactionType === 'LAYAWAY' && (
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  {/* Downpayment */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-medium text-neutral-600">Downpayment Deposit (₱)</label>
                      <div className="flex gap-1">
                        {[10, 20, 30, 50].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleSetDownPaymentPercent(p)}
                            className="px-1.5 py-0.5 bg-neutral-100 hover:bg-gold-100 text-[10px] rounded font-mono"
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="500"
                      placeholder="0"
                      value={downPaymentAmount === 0 ? '' : downPaymentAmount}
                      onChange={(e) => setDownPaymentAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900"
                    />
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Remaining Balance: <b className="text-neutral-900 font-mono">{formatCurrency(remainingBalance)}</b>
                    </span>
                  </div>

                  {/* Frequency & Start Date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-neutral-600 block mb-0.5">Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as any)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                      >
                        <option value="TWICE_MONTHLY">Twice a Month (Every 15d)</option>
                        <option value="MONTHLY">Monthly (Every 30d)</option>
                        <option value="WEEKLY">Weekly (Every 7d)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-neutral-600 block mb-0.5"># of Payments</label>
                      <select
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(parseInt(e.target.value) || 1)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                      >
                        <option value={1}>1 Payment (1 Month)</option>
                        <option value={2}>2 Payments</option>
                        <option value={3}>3 Payments</option>
                        <option value={4}>4 Payments</option>
                        <option value={6}>6 Payments</option>
                        <option value={8}>8 Payments</option>
                        <option value={10}>10 Payments</option>
                        <option value={12}>12 Payments</option>
                      </select>
                    </div>
                  </div>

                  {/* Start Date Calendar Picker */}
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 flex items-center gap-1 mb-0.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-gold-600 inline" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-neutral-900 cursor-pointer"
                    />
                  </div>

                  {/* Exact Due Dates Calendar Picker Table */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-neutral-700 uppercase block">
                      Installment Due Dates (Click Calendar to Change)
                    </span>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {installments.map((inst, idx) => (
                        <div
                          key={inst.id}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
                        >
                          <span className="font-mono text-neutral-500 text-[11px] w-6">#{inst.installmentNumber}</span>
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => handleUpdateInstallment(idx, 'dueDate', e.target.value)}
                            className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-neutral-900 cursor-pointer"
                          />
                          <input
                            type="number"
                            placeholder="0"
                            value={inst.amountDue === 0 ? '' : inst.amountDue}
                            onChange={(e) => handleUpdateInstallment(idx, 'amountDue', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            className="w-20 bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-[11px] font-mono text-right font-bold text-neutral-900"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CLEAN REAL-LIFE RECEIPT PREVIEW (PRINTABLE CANVAS) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="no-print flex items-center justify-between text-xs text-neutral-500">
              <span>Receipt Preview (What will be printed / issued)</span>
              <span className="font-mono text-[11px]">80mm / A4 Standard Format</span>
            </div>

            {/* REAL-LIFE AUTHENTIC CLEAN RECEIPT SLIP */}
            <div
              id="printable-receipt"
              className="bg-white border border-neutral-300 rounded-xl p-6 sm:p-8 space-y-5 text-neutral-900 font-mono shadow-sm w-full max-w-[380px] mx-auto print:w-[380px] print:max-w-[380px] print:min-w-[380px] print:mx-auto print:p-4 print:border-0 print:border-none print:rounded-none print:shadow-none"
            >
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-300">
                {settings.logoUrl && (
                  <div className="w-12 h-12 mx-auto mb-1.5 rounded-full overflow-hidden border border-neutral-300 flex items-center justify-center bg-white shadow-2xs">
                    <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-cover" />
                  </div>
                )}
                <h2 className="text-lg font-black tracking-wider uppercase font-serif text-neutral-950">
                  {settings.companyName}
                </h2>
                <p className="text-[11px] text-neutral-600 font-medium">
                  {settings.tagline || 'Fine Gold Jewelry & 0% Interest Layaway'}
                </p>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  {settings.address}<br />
                  Tel: {settings.phone}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-2.5 py-0.5 rounded border border-neutral-400 text-[10px] font-bold uppercase tracking-wide">
                    {transactionType === 'LAYAWAY' ? '0% LAYAWAY SALES INVOICE' : 'OFFICIAL CASH RECEIPT'}
                  </span>
                </div>
              </div>

              {/* Receipt Meta & Customer */}
              <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">OR No:</span>
                  <span className="font-bold">{receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Date:</span>
                  <span>{new Date(issueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Client:</span>
                  <span className="font-bold">{clientName}</span>
                </div>
                {clientPhone && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Contact:</span>
                    <span>{clientPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Payment:</span>
                  <span>{paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pb-3 border-b border-dashed border-neutral-300">
                <div className="flex justify-between text-[10px] text-neutral-500 uppercase font-bold">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold block">{item.name}</span>
                      <span className="text-[10px] text-neutral-500">{item.karat} • {formatGrams(item.weightGrams)}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="text-xs space-y-1.5 pb-3 border-b border-dashed border-neutral-300">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL AMOUNT:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>

                {transactionType === 'LAYAWAY' && (
                  <>
                    <div className="flex justify-between text-neutral-700">
                      <span>DOWNPAYMENT PAID:</span>
                      <span className="font-bold">{formatCurrency(downPaymentAmount)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-900 font-bold">
                      <span>REMAINING BALANCE:</span>
                      <span className="text-sm font-black">{formatCurrency(remainingBalance)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Layaway Schedule (If Layaway) */}
              {transactionType === 'LAYAWAY' && installments.length > 0 && (
                <div className="space-y-1.5 pb-3 border-b border-dashed border-neutral-300">
                  <span className="text-[10px] font-bold text-neutral-600 uppercase block">
                    Payment Schedule ({frequency === 'TWICE_MONTHLY' ? 'Twice a Month' : frequency}):
                  </span>
                  <div className="space-y-1 text-[11px]">
                    {installments.map((inst) => (
                      <div key={inst.id} className="flex justify-between items-center">
                        <span className="text-neutral-700">
                          #{inst.installmentNumber} • {new Date(inst.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="font-bold">{formatCurrency(inst.amountDue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Authentic Simple Footer & Signatures */}
              <div className="space-y-5 pt-1 text-[10px] text-neutral-600 text-center">
                <p className="leading-tight italic">
                  {transactionType === 'LAYAWAY'
                    ? '0% Interest Layaway. Gold spot rate is locked. Items are safely held in vault until fully paid.'
                    : 'Thank you for your purchase! All items are 100% genuine certified gold.'}
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
                  *** OFFICIAL {settings.companyName ? settings.companyName.toUpperCase() : 'GOLD JEWELRY'} RECEIPT ***
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAVED RECEIPTS LEDGER TAB */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="max-w-sm w-full">
              <Input
                placeholder="Search receipts by order #, client..."
                value={searchLedger}
                onChange={(e) => {
                  setSearchLedger(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
                className="text-xs"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchReceiptsLedger}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Refresh
            </Button>
          </div>

          <BulkActionBar
            selectedCount={selectedIds.length}
            onClearSelection={() => setSelectedIds([])}
            onBulkDelete={handleBulkDeleteReceipts}
            isDeleting={isDeletingBulk}
            entityName="receipts"
          />

          <div className="rounded-2xl theme-card overflow-hidden shadow-2xs">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs theme-table">
                <thead>
                  <tr className="border-b theme-table-header font-mono text-[11px]">
                    <th className="w-10 p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAllOnPageSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                        title="Select all on current page"
                      />
                    </th>
                    <th className="text-left p-3">OR Number</th>
                    <th className="text-left p-3">Client</th>
                    <th className="text-center p-3">Type</th>
                    <th className="text-right p-3">Total Amount</th>
                    <th className="text-center p-3">Date</th>
                    <th className="text-right p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoadingLedger ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-neutral-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-600" />
                        Loading receipts...
                      </td>
                    </tr>
                  ) : paginatedReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-neutral-500">
                        <Receipt className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                        No saved receipts found.
                      </td>
                    </tr>
                  ) : (
                    paginatedReceipts.map((receipt, idx) => {
                      const isSelected = selectedIds.includes(receipt.id);

                      return (
                        <tr
                          key={receipt.id}
                          className={`theme-table-row transition-colors ${
                            idx % 2 === 1 ? 'theme-table-row-alt' : ''
                          } ${isSelected ? 'bg-gold-500/10' : ''}`}
                        >
                          <td className="w-10 p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(receipt.id)}
                              className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                            />
                          </td>
                          <td className="p-3 font-mono font-bold text-gold-700">{receipt.orderNumber}</td>
                          <td className="p-3 font-bold text-neutral-900">{receipt.user?.name}</td>
                          <td className="p-3 text-center">
                            <Badge variant={receipt.orderType === 'LAYAWAY' ? 'gold' : 'emerald'} size="sm">
                              {receipt.orderType}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-neutral-900">
                            {formatCurrency(receipt.totalAmount)}
                          </td>
                          <td className="p-3 text-center font-mono text-neutral-500">
                            {new Date(receipt.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/invoice/${receipt.id}`}>
                                <Button variant="gold-outline" size="sm" className="text-xs py-0.5 px-2 font-bold">
                                  View
                                </Button>
                              </Link>
                              <button
                                onClick={() => handleDeleteReceipt(receipt.id, receipt.orderNumber)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Receipt"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="block md:hidden p-3 space-y-3">
              {isLoadingLedger ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-600" />
                  Loading receipts...
                </div>
              ) : paginatedReceipts.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  <Receipt className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                  No saved receipts found.
                </div>
              ) : (
                paginatedReceipts.map((receipt) => {
                  const isSelected = selectedIds.includes(receipt.id);

                  return (
                    <div
                      key={receipt.id}
                      className="p-4 rounded-2xl border transition-all space-y-3"
                      style={{
                        backgroundColor: isSelected ? 'rgba(212,175,55,0.08)' : 'var(--theme-bg-card, #FFFFFF)',
                        borderColor: isSelected ? 'var(--theme-primary, #D4AF37)' : 'var(--theme-border-card, #E8DFCA)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(receipt.id)}
                            className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                          />
                          <div>
                            <span className="font-mono font-bold text-xs" style={{ color: 'var(--theme-primary, #D4AF37)' }}>
                              {receipt.orderNumber}
                            </span>
                            <span className="text-[10px] block mt-0.5" style={{ color: 'var(--theme-text-muted, #787878)' }}>
                              {new Date(receipt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge variant={receipt.orderType === 'LAYAWAY' ? 'gold' : 'emerald'} size="sm">
                            {receipt.orderType}
                          </Badge>
                          <Link href={`/invoice/${receipt.id}`}>
                            <button
                              className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                              title="View Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteReceipt(receipt.id, receipt.orderNumber)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}>
                        <span className="font-bold text-xs" style={{ color: 'var(--theme-text-primary, #171717)' }}>
                          {receipt.user?.name || 'Walk-In Customer'}
                        </span>
                        <span className="font-mono font-black text-sm" style={{ color: 'var(--theme-text-primary, #171717)' }}>
                          {formatCurrency(receipt.totalAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredReceipts.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
