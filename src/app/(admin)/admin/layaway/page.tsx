'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  CreditCard,
  Plus,
  Trash2,
  Coins,
  UserCheck,
  Edit2,
} from 'lucide-react';
import { LayawayContractWithDetails } from '@/lib/types';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { calculateLayawayProgress, isInstallmentOverdue } from '@/lib/layaway';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeInUp } from '@/components/animations/Motion';
import { Pagination, BulkActionBar } from '@/components/ui/DataTableControls';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showToast,
} from '@/lib/swal';

interface InstallmentRow {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  status: 'PENDING' | 'PAID';
}

export default function AdminLayawayPage() {
  const [contracts, setContracts] = useState<LayawayContractWithDetails[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED'>('ALL');

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Contract for Admin inspection & payment recording
  const [selectedContract, setSelectedContract] = useState<LayawayContractWithDetails | null>(null);
  const [manualPayAmount, setManualPayAmount] = useState<string>('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<string>('GCASH');
  const [manualNotes, setManualNotes] = useState<string>('Offline payment entry');
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit Layaway Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<LayawayContractWithDetails | null>(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerPhone: '',
    status: 'ACTIVE',
    totalAmount: 0,
    remainingBalance: 0,
    notes: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Create Layaway Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('custom');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [itemName, setItemName] = useState('18K Saudi Gold Franco Chain 12.5g');
  const [itemKarat, setItemKarat] = useState('18K');
  const [itemWeight, setItemWeight] = useState(12.5);
  const [totalAmount, setTotalAmount] = useState(48000);
  const [downPaymentAmount, setDownPaymentAmount] = useState(10000);
  const [frequency, setFrequency] = useState<'TWICE_MONTHLY' | 'MONTHLY' | 'WEEKLY'>('TWICE_MONTHLY');
  const [installmentCount, setInstallmentCount] = useState(6);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('GCASH');

  const remainingBalance = Math.max(0, totalAmount - downPaymentAmount);

  // Filter out sold-out items from catalog
  const inStockProducts = products.filter((p) => (p.stockQuantity ?? 0) > 0);

  // Auto calculate schedule
  useEffect(() => {
    if (remainingBalance <= 0 || installmentCount <= 0) {
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
  }, [startDate, remainingBalance, frequency, installmentCount]);

  const fetchContractsAndData = async () => {
    setIsLoading(true);
    try {
      const [layawayRes, custRes, prodRes] = await Promise.all([
        fetch('/api/layaway'),
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);

      const data = await layawayRes.json();
      if (data.success && data.contracts) {
        setContracts(data.contracts);
      }

      const custData = await custRes.json();
      if (custData.success && custData.customers) {
        setCustomers(custData.customers);
      }

      const prodData = await prodRes.json();
      if (prodData.success && prodData.products) {
        setProducts(prodData.products);
      }
    } catch (e) {
      console.error('Failed to load layaway contracts', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContractsAndData();
  }, []);

  // Filter counts
  const totalActive = contracts.filter((c) => c.status === 'ACTIVE').length;
  const totalCompleted = contracts.filter((c) => c.status === 'COMPLETED').length;
  const totalOverdue = contracts.filter(
    (c) => c.status === 'ACTIVE' && c.installments?.some((inst) => isInstallmentOverdue(inst.dueDate, inst.status))
  ).length;
  const totalCancelled = contracts.filter((c) => c.status === 'CANCELLED' || c.status === 'DEFAULTED').length;

  // Filtered & Paginated
  const filtered = contracts.filter((c) => {
    if (statusFilter === 'ACTIVE' && c.status !== 'ACTIVE') return false;
    if (statusFilter === 'COMPLETED' && c.status !== 'COMPLETED') return false;
    if (statusFilter === 'OVERDUE') {
      const hasOverdue = c.status === 'ACTIVE' && c.installments?.some((inst) => isInstallmentOverdue(inst.dueDate, inst.status));
      if (!hasOverdue) return false;
    }
    if (statusFilter === 'CANCELLED' && c.status !== 'CANCELLED' && c.status !== 'DEFAULTED') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contractNumber.toLowerCase().includes(q) ||
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.user?.phone?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllOnPageSelected =
    paginated.length > 0 && paginated.every((c) => selectedIds.includes(c.id));

  const handleSelectAll = () => {
    if (isAllOnPageSelected) {
      const pageIds = new Set(paginated.map((c) => c.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...paginated.map((c) => c.id)]));
      setSelectedIds(combined);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await showConfirmDialog({
      title: 'Delete Selected Layaway Plans?',
      text: `Are you sure you want to delete ${selectedIds.length} selected layaway contract(s) and their installment schedules?`,
      confirmButtonText: 'Yes, Delete All',
      isDanger: true,
    });

    if (!confirmed) return;

    setIsDeletingBulk(true);
    try {
      const res = await fetch(`/api/layaway?ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        await showSuccessAlert('Contracts Deleted', `${selectedIds.length} layaway contract(s) removed.`);
        fetchContractsAndData();
      } else {
        await showErrorAlert('Failed to Delete', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error deleting contracts.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId === 'custom') return;
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name || '');
      setCustomerEmail(found.email || '');
      setCustomerPhone(found.phone || '');
    }
  };

  const handleProductSelect = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setItemName(prod.name);
    setItemKarat(prod.karat || '18K');
    setItemWeight(prod.weightGrams || 5.0);
    setTotalAmount(prod.basePrice || 20000);
  };

  const handleUpdateInstallment = (index: number, field: keyof InstallmentRow, val: any) => {
    const copy = [...installments];
    copy[index] = { ...copy[index], [field]: val };
    setInstallments(copy);
  };

  const handleSetDownPaymentPercent = (pct: number) => {
    const calculated = Math.round((totalAmount * (pct / 100)) / 100) * 100;
    setDownPaymentAmount(calculated);
  };

  // Submit Create Layaway
  const handleCreateLayawaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || totalAmount <= 0) {
      await showErrorAlert('Incomplete Form', 'Please fill out customer name and amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: selectedCustomerId !== 'custom' ? selectedCustomerId : undefined,
        customerName,
        customerEmail,
        customerPhone,
        items: [
          {
            name: itemName,
            karat: itemKarat,
            weightGrams: itemWeight,
            price: totalAmount,
            quantity: 1,
          },
        ],
        totalAmount,
        downPaymentAmount,
        frequency,
        termMonths: Math.ceil(installments.length / (frequency === 'TWICE_MONTHLY' ? 2 : 1)),
        startDate,
        installments,
        paymentMethod,
        notes: `0% Layaway plan (${frequency})`,
      };

      const res = await fetch('/api/layaway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        await showSuccessAlert(
          'Layaway Contract Created!',
          `Contract ${data.contract?.contractNumber || ''} created with locked spot gold pricing.`
        );
        fetchContractsAndData();
      } else {
        await showErrorAlert('Creation Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error creating layaway plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Layaway Modal
  const handleOpenEditContract = (contract: LayawayContractWithDetails) => {
    setEditingContract(contract);
    setEditFormData({
      customerName: contract.user?.name || '',
      customerPhone: contract.user?.phone || '',
      status: contract.status || 'ACTIVE',
      totalAmount: contract.totalAmount || 0,
      remainingBalance: contract.remainingBalance || 0,
      notes: contract.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Layaway
  const handleSaveEditContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/layaway', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: editingContract.id,
          ...editFormData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        await showSuccessAlert('Contract Updated!', `Contract ${editingContract.contractNumber} was updated successfully.`);
        fetchContractsAndData();
      } else {
        await showErrorAlert('Update Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error updating layaway contract');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Record Manual Installment Payment
  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !manualPayAmount) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/layaway/${selectedContract.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(manualPayAmount),
          paymentMethod: manualPaymentMethod,
          notes: manualNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedContract(null);
        await showSuccessAlert('Payment Recorded!', data.message);
        fetchContractsAndData();
      } else {
        await showErrorAlert('Payment Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error recording payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Contract
  const handleDeleteContract = async (contractId: string, contractNumber: string) => {
    const confirmed = await showConfirmDialog({
      title: `Delete Contract ${contractNumber}?`,
      text: 'Are you sure you want to delete this contract? All scheduled installments will be removed.',
      confirmButtonText: 'Yes, Delete Contract',
      isDanger: true,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/layaway?id=${contractId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds((prev) => prev.filter((i) => i !== contractId));
        await showSuccessAlert('Contract Deleted', `Contract ${contractNumber} was removed.`);
        fetchContractsAndData();
      } else {
        await showErrorAlert('Delete Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error deleting contract');
    }
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <FadeInUp className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block mb-1">
            Layaways Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Layaway Plans & Dues
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-bold shadow-xs"
            >
              Create Layaway Plan
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchContractsAndData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Refresh
            </Button>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              All Plans ({contracts.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('ACTIVE');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'ACTIVE'
                  ? 'bg-gold-700 text-white border-gold-700 shadow-xs'
                  : 'bg-gold-50 text-gold-900 border-gold-300 hover:border-gold-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gold-500"></span>
              Active ({totalActive})
            </button>
            <button
              onClick={() => {
                setStatusFilter('COMPLETED');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Completed ({totalCompleted})
            </button>
            <button
              onClick={() => {
                setStatusFilter('OVERDUE');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'OVERDUE'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50 text-rose-900 border-rose-300 hover:border-rose-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Overdue ({totalOverdue})
            </button>
            <button
              onClick={() => {
                setStatusFilter('CANCELLED');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                statusFilter === 'CANCELLED'
                  ? 'bg-neutral-700 text-white border-neutral-700 shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              Defaulted / Cancelled ({totalCancelled})
            </button>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-80">
            <Input
              placeholder="Filter plans by #, customer, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
              className="text-xs"
            />
          </div>
        </div>

        <BulkActionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onBulkDelete={handleBulkDelete}
          isDeleting={isDeletingBulk}
          entityName="contracts"
        />
      </div>

      {/* Contracts Table & Mobile Cards */}
      <FadeInUp className="rounded-3xl theme-card overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs theme-table">
            <thead>
              <tr className="border-b theme-table-header uppercase font-mono text-[11px]">
                <th className="w-10 p-4 text-center">
                  <input
                    type="checkbox"
                    checked={isAllOnPageSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                    title="Select all on current page"
                  />
                </th>
                <th className="text-left p-4">Contract #</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-right p-4">Total Value</th>
                <th className="text-right p-4">Down Payment</th>
                <th className="text-right p-4">Remaining Balance</th>
                <th className="text-center p-4">Progress</th>
                <th className="text-center p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-xs text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-600" />
                    Loading layaway plans...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-xs text-neutral-500">
                    <Lock className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                    No layaway contracts found matching your search or filter.
                  </td>
                </tr>
              ) : (
                paginated.map((contract, idx) => {
                  const isSelected = selectedIds.includes(contract.id);
                  const progress = calculateLayawayProgress(contract.totalAmount, contract.remainingBalance);

                  return (
                    <tr
                      key={contract.id}
                      className={`theme-table-row transition-colors ${
                        idx % 2 === 1 ? 'theme-table-row-alt' : ''
                      } ${isSelected ? 'bg-gold-500/10' : ''}`}
                    >
                      <td className="w-10 p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(contract.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                        />
                      </td>

                      <td className="p-4">
                        <span className="font-mono font-bold text-gold-700 block">
                          {contract.contractNumber}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(contract.startDate).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-neutral-900 block">{contract.user?.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {contract.user?.email || contract.user?.phone}
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono font-black text-neutral-900 text-sm">
                        {formatCurrency(contract.totalAmount)}
                      </td>

                      <td className="p-4 text-right font-mono text-emerald-700 font-bold">
                        {formatCurrency(contract.downPaymentAmount)} ({contract.downPaymentPercent}%)
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-gold-700 text-sm">
                        {formatCurrency(contract.remainingBalance)}
                      </td>

                      <td className="p-4 text-center">
                        <div className="w-20 mx-auto space-y-1">
                          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden border border-neutral-200">
                            <div
                              className="bg-gold-500 h-full rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-600 font-mono font-bold">{progress}%</span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <Badge
                          variant={contract.status === 'COMPLETED' ? 'emerald' : contract.status === 'DEFAULTED' ? 'rose' : 'gold'}
                          size="sm"
                        >
                          {contract.status}
                        </Badge>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedContract(contract);
                              setManualPayAmount(contract.monthlyInstallment?.toString() || '');
                            }}
                            className="text-xs py-0.5 px-2 font-bold"
                          >
                            Manage
                          </Button>

                          <button
                            onClick={() => handleOpenEditContract(contract)}
                            className="p-1.5 rounded-lg text-gold-700 hover:text-gold-900 hover:bg-gold-500/10 cursor-pointer"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <Link href={`/invoice/${contract.id}`}>
                            <button
                              className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                              title="Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          <button
                            onClick={() => handleDeleteContract(contract.id, contract.contractNumber)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete contract"
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

        {/* Mobile Responsive Cards View */}
        <div className="block md:hidden p-3 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-600" />
              Loading layaway plans...
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              <Lock className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              No layaway contracts found matching your search or filter.
            </div>
          ) : (
            paginated.map((contract) => {
              const isSelected = selectedIds.includes(contract.id);
              const progress = calculateLayawayProgress(contract.totalAmount, contract.remainingBalance);

              return (
                <div
                  key={contract.id}
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
                        onChange={() => handleToggleSelect(contract.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs" style={{ color: 'var(--theme-primary, #D4AF37)' }}>
                            {contract.contractNumber}
                          </span>
                          <Badge
                            variant={contract.status === 'COMPLETED' ? 'emerald' : contract.status === 'DEFAULTED' ? 'rose' : 'gold'}
                            size="sm"
                          >
                            {contract.status}
                          </Badge>
                        </div>
                        <span className="text-[10px] block mt-0.5" style={{ color: 'var(--theme-text-muted, #787878)' }}>
                          Started {new Date(contract.startDate).toLocaleDateString()} • {contract.termMonths}M Plan
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditContract(contract)}
                        className="p-1.5 rounded-lg text-gold-700 hover:bg-gold-500/10 cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <Link href={`/invoice/${contract.id}`}>
                        <button
                          className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                          title="Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDeleteContract(contract.id, contract.contractNumber)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete contract"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t" style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}>
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-bold block" style={{ color: 'var(--theme-text-primary, #171717)' }}>
                          {contract.user?.name || 'Walk-In Customer'}
                        </span>
                        <span className="text-[11px] font-mono" style={{ color: 'var(--theme-text-muted, #787878)' }}>
                          {contract.user?.phone || contract.user?.email || 'No contact'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] block" style={{ color: 'var(--theme-text-muted, #787878)' }}>
                          Total Value
                        </span>
                        <span className="font-mono font-black text-sm" style={{ color: 'var(--theme-text-primary, #171717)' }}>
                          {formatCurrency(contract.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar & Remaining */}
                  <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}>
                    <div className="flex justify-between text-xs font-mono">
                      <span style={{ color: 'var(--theme-text-muted, #787878)' }}>
                        Paid: {progress}% (DP: {formatCurrency(contract.downPaymentAmount)})
                      </span>
                      <span className="font-bold" style={{ color: 'var(--theme-primary, #D4AF37)' }}>
                        Due: {formatCurrency(contract.remainingBalance)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
                      <div
                        className="bg-gold-500 h-full rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedContract(contract);
                        setManualPayAmount(contract.monthlyInstallment?.toString() || '');
                      }}
                      className="w-full text-xs font-bold justify-center"
                    >
                      Manage & Post Payment
                    </Button>
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
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </FadeInUp>

      {/* EDIT LAYAWAY MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Layaway • ${editingContract?.contractNumber || ''}`}
        subtitle="Modify contract balance, status, customer phone, or administrative notes."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditContract} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Customer Name</label>
              <input
                type="text"
                value={editFormData.customerName}
                onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={editFormData.customerPhone}
                onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Total Contract (₱)</label>
              <input
                type="number"
                step="100"
                placeholder="0"
                value={editFormData.totalAmount === 0 ? '' : editFormData.totalAmount}
                onChange={(e) => setEditFormData({ ...editFormData, totalAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Remaining Due (₱)</label>
              <input
                type="number"
                step="100"
                placeholder="0"
                value={editFormData.remainingBalance === 0 ? '' : editFormData.remainingBalance}
                onChange={(e) => setEditFormData({ ...editFormData, remainingBalance: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono font-bold text-gold-700"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Status</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-bold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DEFAULTED">DEFAULTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-700 block mb-1">Admin Notes</label>
            <textarea
              rows={3}
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              className="w-full bg-white border border-neutral-300 rounded-lg p-2"
              placeholder="e.g. Terms adjusted per customer request..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-2 pt-3 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              className="w-full sm:w-auto font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
              className="w-full sm:w-auto font-bold"
            >
              Save Contract Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE LAYAWAY PLAN MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Layaway Plan"
        subtitle="Configure 0% interest terms, calendar payment dates, and downpayment deposit."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateLayawaySubmit} className="space-y-4 text-xs">
          {/* 1. Customer Selection Section */}
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-gold-500/25 space-y-3">
            <span className="font-bold text-neutral-800 uppercase block text-[11px] tracking-wide">
              Customer Information
            </span>
            <div>
              <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Select Existing Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-gold-500 focus:outline-none"
              >
                <option value="custom">Walk-In Customer / Custom Entry</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) {c.phone ? `• ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-gold-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+63 917..."
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@example.ph"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Jewelry Item & Contract Value */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-2xs">
            <span className="font-bold text-neutral-800 uppercase block text-[11px] tracking-wide">
              Jewelry Item & Contract Value
            </span>

            {inStockProducts.length > 0 && (
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">
                  Auto-Fill From In-Stock Catalog (Optional)
                </label>
                <select
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-gold-500 focus:outline-none"
                >
                  <option value="">Choose In-Stock Catalog Item...</option>
                  {inStockProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.karat}) • {formatCurrency(p.basePrice)} • Stock: {p.stockQuantity}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Item Description *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. 18K Saudi Gold Franco Chain"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-gold-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={itemWeight === 0 ? '' : itemWeight}
                  onChange={(e) => setItemWeight(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Total Price (₱) *</label>
                <input
                  type="number"
                  step="100"
                  placeholder="0"
                  value={totalAmount === 0 ? '' : totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-mono font-bold text-neutral-900 focus:ring-1 focus:ring-gold-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Layaway Terms & Calendar Pickers */}
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-gold-500/25 space-y-3.5">
            <span className="font-bold text-neutral-800 uppercase block text-[11px] tracking-wide">
              Layaway Terms & Payment Frequency
            </span>

            {/* Downpayment, Frequency, Installment Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Downpayment (₱)</label>
                <input
                  type="number"
                  step="500"
                  placeholder="0"
                  value={downPaymentAmount === 0 ? '' : downPaymentAmount}
                  onChange={(e) => setDownPaymentAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
                <div className="flex gap-1 mt-1.5">
                  {[10, 20, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSetDownPaymentPercent(pct)}
                      className="flex-1 py-1 bg-white hover:bg-gold-500/20 text-[10px] rounded font-mono font-bold text-neutral-700 transition-colors cursor-pointer border border-neutral-200"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-gold-500 focus:outline-none"
                >
                  <option value="TWICE_MONTHLY">Twice a Month (Every 15d)</option>
                  <option value="MONTHLY">Monthly (Every 30d)</option>
                  <option value="WEEKLY">Weekly (Every 7d)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Installments</label>
                <select
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-gold-500 focus:outline-none"
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

            {/* Start Date & Downpayment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-neutral-500 flex items-center gap-1 mb-1 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-gold-600 inline" /> Contract Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-mono font-bold cursor-pointer focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Downpayment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-medium focus:ring-1 focus:ring-gold-500 focus:outline-none"
                >
                  <option value="GCASH">GCash</option>
                  <option value="CASH">Store Vault Cash</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CREDIT_CARD">Card Terminal</option>
                </select>
              </div>
            </div>

            {/* Installment Schedule Table with Grid Alignments */}
            <div className="space-y-2 pt-2 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-700 uppercase font-bold tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold-600" /> Installment Schedule ({installments.length} Due Dates)
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Editable dates & amounts</span>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
                <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-neutral-100/80 border-b border-neutral-200 text-[10px] font-mono uppercase font-bold text-neutral-500">
                  <div className="col-span-2">#</div>
                  <div className="col-span-6">Due Date (Calendar)</div>
                  <div className="col-span-4 text-right">Amount Due (₱)</div>
                </div>
                <div className="max-h-44 overflow-y-auto divide-y divide-neutral-200/60 pr-0.5">
                  {installments.map((inst, idx) => (
                    <div
                      key={inst.id}
                      className="grid grid-cols-12 gap-2 items-center px-3 py-1.5 bg-white hover:bg-gold-50/30 transition-colors text-xs"
                    >
                      <div className="col-span-2 font-mono font-bold text-neutral-500 text-xs">
                        #{inst.installmentNumber}
                      </div>
                      <div className="col-span-6">
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => handleUpdateInstallment(idx, 'dueDate', e.target.value)}
                          className="w-full bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-neutral-800 cursor-pointer focus:ring-1 focus:ring-gold-500 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-mono text-neutral-400">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={inst.amountDue === 0 ? '' : inst.amountDue}
                            onChange={(e) => handleUpdateInstallment(idx, 'amountDue', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            className="w-full bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 rounded-md pl-5 pr-2 py-1 text-xs font-mono font-bold text-right text-neutral-900 focus:ring-1 focus:ring-gold-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remaining Balance Display */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-neutral-900 text-white font-mono shadow-inner">
              <span className="text-xs font-medium text-neutral-300">Remaining Balance:</span>
              <span className="text-base font-black text-gold-400 tracking-tight">{formatCurrency(remainingBalance)}</span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-2 pt-3 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              className="w-full sm:w-auto font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="w-full sm:w-auto font-bold"
            >
              Create Layaway Contract
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contract Detail & Manual Payment Modal */}
      {selectedContract && (
        <Modal
          isOpen={!!selectedContract}
          onClose={() => setSelectedContract(null)}
          title={`Contract Management • ${selectedContract.contractNumber}`}
          subtitle={`Customer: ${selectedContract.user?.name} (${selectedContract.user?.email || selectedContract.user?.phone})`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Contract Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FAF8F2] border border-gold-500/20">
              <div>
                <span className="text-neutral-500 block uppercase text-[10px] font-bold">Total Value</span>
                <span className="font-bold text-neutral-900 font-mono text-sm">{formatCurrency(selectedContract.totalAmount)}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase text-[10px] font-bold">Remaining</span>
                <span className="font-bold text-gold-700 font-mono text-sm">{formatCurrency(selectedContract.remainingBalance)}</span>
              </div>
              <div>
                <span className="text-neutral-500 block uppercase text-[10px] font-bold">Term</span>
                <span className="font-bold text-neutral-800 font-mono text-sm">{selectedContract.termMonths} Months</span>
              </div>
            </div>

            {/* Installment Schedule List */}
            <div className="space-y-2">
              <h4 className="font-bold text-neutral-800 uppercase tracking-wider">Installment Breakdown</h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedContract.installments?.map((inst) => {
                  const isPaid = inst.status === 'PAID';
                  const isOverdue = isInstallmentOverdue(inst.dueDate, inst.status);

                  return (
                    <div
                      key={inst.id}
                      className="p-3 rounded-xl bg-white border border-neutral-200 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-neutral-900">Payment #{inst.installmentNumber}</span>
                        <span className="text-[10px] text-neutral-500 ml-2 font-mono">
                          Due: {new Date(inst.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-neutral-900">{formatCurrency(inst.amountDue)}</span>
                        <Badge variant={isPaid ? 'emerald' : isOverdue ? 'rose' : 'amber'} size="sm">
                          {inst.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Record Manual Payment Form */}
            <form onSubmit={handleRecordManualPayment} className="pt-4 border-t border-neutral-200 space-y-3">
              <h4 className="font-bold text-gold-700 uppercase tracking-wider">Record Offline / Manual Settlement</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-800 font-bold mb-1">Amount (₱ PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualPayAmount}
                    onChange={(e) => setManualPayAmount(e.target.value)}
                    className="w-full bg-white border border-gold-500/30 rounded-xl p-2 font-mono text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-800 font-bold mb-1">Payment Method</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-gold-500/30 rounded-xl p-2 font-medium text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
                  >
                    <option value="GCASH">GCash</option>
                    <option value="CASH">Cash Over-The-Counter</option>
                    <option value="BANK_TRANSFER">Bank Wire</option>
                    <option value="CREDIT_CARD">Credit Card Terminal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-800 font-bold mb-1">Transaction Memo / Reference</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-white border border-gold-500/30 rounded-xl p-2 text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedContract(null)}
                  className="w-full sm:w-auto font-bold"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isProcessing}
                  className="w-full sm:w-auto font-bold shadow-xs"
                >
                  Confirm & Post Payment
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
