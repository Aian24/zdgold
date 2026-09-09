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

  // Filtered & Paginated
  const filtered = contracts.filter(
    (c) =>
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user?.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search Bar & Bulk Action Bar */}
      <div className="space-y-3">
        <FadeInUp className="max-w-md">
          <Input
            placeholder="Search by contract #, customer name, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </FadeInUp>

        <BulkActionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onBulkDelete={handleBulkDelete}
          isDeleting={isDeletingBulk}
          entityName="contracts"
        />
      </div>

      {/* Contracts Table */}
      <FadeInUp className="rounded-3xl bg-white border border-gold-500/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-[#FAF8F2] text-neutral-600 uppercase font-mono text-[11px]">
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
                    No layaway contracts found matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map((contract) => {
                  const isSelected = selectedIds.includes(contract.id);
                  const progress = calculateLayawayProgress(contract.totalAmount, contract.remainingBalance);

                  return (
                    <tr
                      key={contract.id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        isSelected ? 'bg-gold-500/5' : ''
                      }`}
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
          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-3 gap-3">
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

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
              className="font-bold"
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
        <form onSubmit={handleCreateLayawaySubmit} className="space-y-5 text-xs">
          {/* Customer Selection */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-gold-500/25 space-y-2.5">
            <span className="font-bold text-neutral-800 uppercase block text-[11px]">
              Customer Information
            </span>
            <div>
              <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Select Existing Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-medium"
              >
                <option value="custom">👤 Walk-In Customer / Custom Entry</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) {c.phone ? `• ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-bold">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-bold">Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+63 917..."
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-bold">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="client@example.ph"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Jewelry Item & Total Value */}
          <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-800 uppercase block text-[11px]">
                Jewelry Item & Contract Value
              </span>
              {products.length > 0 && (
                <select
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 text-[11px]"
                >
                  <option value="">Choose Catalog Item...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-bold">Item Description</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-bold">Weight (g)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={itemWeight === 0 ? '' : itemWeight}
                  onChange={(e) => setItemWeight(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-bold">Total Price (₱) *</label>
                <input
                  type="number"
                  step="100"
                  placeholder="0"
                  value={totalAmount === 0 ? '' : totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-mono font-bold text-neutral-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Downpayment & Frequency Terms */}
          <div className="space-y-3">
            <span className="font-bold text-neutral-800 uppercase block text-[11px]">
              Layaway Terms & Calendar Pickers
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-neutral-500 font-bold">Downpayment (₱)</label>
                  <div className="flex gap-1">
                    {[10, 20, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleSetDownPaymentPercent(pct)}
                        className="px-1.5 py-0.5 bg-neutral-100 hover:bg-gold-100 text-[10px] rounded font-mono"
                      >
                        {pct}%
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
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-medium"
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
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-medium"
                >
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

            {/* Start Date & Dues */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">
                  📅 Contract Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-mono font-bold cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Downpayment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-medium"
                >
                  <option value="GCASH">GCash</option>
                  <option value="CASH">Store Vault Cash</option>
                  <option value="BANK_TRANSFER">Bank Wire</option>
                  <option value="CREDIT_CARD">Card Terminal</option>
                </select>
              </div>
            </div>

            {/* Installment Table with Date Pickers */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] text-neutral-600 uppercase font-bold block">
                Installment Schedule (Calendar Date Pickers)
              </span>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
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

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-neutral-900 text-white font-mono">
              <span className="text-xs">Remaining Balance:</span>
              <span className="text-base font-black text-gold-400">{formatCurrency(remainingBalance)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="font-bold"
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
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FAF8F2] border border-gold-500/20">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedContract(null)}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isProcessing}
                  className="font-bold shadow-xs"
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
