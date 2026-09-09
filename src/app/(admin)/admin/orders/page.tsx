'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  Save,
  Plus,
  Trash2,
  Package,
  User,
  CreditCard,
  Building,
  Edit2,
  FileText,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
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
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  status: 'PENDING' | 'PAID';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create Order Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('custom');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('Store Pickup / Counter Handover');
  const [orderType, setOrderType] = useState<'CASH' | 'LAYAWAY'>('CASH');
  const [orderStatus, setOrderStatus] = useState('CONFIRMED');
  const [paymentMethod, setPaymentMethod] = useState('GCASH');
  const [isPaid, setIsPaid] = useState(true);
  const [courier, setCourier] = useState('Store Counter Handover');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Layaway Options for Manual Order
  const [termMonths, setTermMonths] = useState<number>(3);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(5000);
  const [frequency, setFrequency] = useState<'TWICE_MONTHLY' | 'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);

  // Items in new order
  const [orderItems, setOrderItems] = useState([
    {
      productId: '',
      name: '18K Gold Jewelry Item',
      karat: '18K',
      weightGrams: 5.0,
      craftFee: 1500,
      price: 20000,
      quantity: 1,
    },
  ]);

  // Edit Order Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    status: 'CONFIRMED',
    courier: '',
    trackingNumber: '',
    totalAmount: 0,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchOrdersAndData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, custRes, prodRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);

      const ordersData = await ordersRes.json();
      if (ordersData.success && ordersData.orders) {
        setOrders(ordersData.orders);
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
      console.error('Failed to load orders data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndData();
  }, []);

  const newOrderTotal = orderItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const remainingBalance = Math.max(0, newOrderTotal - downPaymentAmount);

  // Auto calculate layaway schedule when in LAYAWAY mode
  useEffect(() => {
    if (orderType !== 'LAYAWAY' || remainingBalance <= 0 || termMonths <= 0) {
      setInstallments([]);
      return;
    }

    const count = termMonths * (frequency === 'TWICE_MONTHLY' ? 2 : frequency === 'WEEKLY' ? 4 : 1);
    const equalAmount = count > 0 ? Number((remainingBalance / count).toFixed(2)) : 0;
    const start = new Date(startDate || new Date());
    const generated: InstallmentRow[] = [];

    for (let i = 1; i <= count; i++) {
      const nextDate = new Date(start);
      if (frequency === 'MONTHLY') {
        nextDate.setMonth(start.getMonth() + i);
      } else if (frequency === 'TWICE_MONTHLY') {
        nextDate.setDate(start.getDate() + i * 15);
      } else if (frequency === 'WEEKLY') {
        nextDate.setDate(start.getDate() + i * 7);
      }

      const dateStr = nextDate.toISOString().split('T')[0];
      const amt = i === count ? Number((remainingBalance - equalAmount * (count - 1)).toFixed(2)) : equalAmount;

      generated.push({
        installmentNumber: i,
        dueDate: dateStr,
        amountDue: amt,
        status: 'PENDING',
      });
    }

    setInstallments(generated);
  }, [startDate, remainingBalance, frequency, termMonths, orderType]);

  // Filtered & Paginated
  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllOnPageSelected =
    paginated.length > 0 && paginated.every((o) => selectedIds.includes(o.id));

  const handleSelectAll = () => {
    if (isAllOnPageSelected) {
      const pageIds = new Set(paginated.map((o) => o.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...paginated.map((o) => o.id)]));
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
      title: 'Delete Selected Orders?',
      text: `Are you sure you want to delete ${selectedIds.length} selected order(s) and their payment records? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete All',
      isDanger: true,
    });

    if (!confirmed) return;

    setIsDeletingBulk(true);
    try {
      const res = await fetch(`/api/orders?ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        await showSuccessAlert('Orders Deleted!', `${selectedIds.length} order(s) have been permanently removed.`);
        fetchOrdersAndData();
      } else {
        await showErrorAlert('Failed to Delete', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Could not delete orders.');
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
      setShippingAddress(found.address || 'Store Pickup');
    }
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const copy = [...orderItems];
    copy[index] = {
      ...copy[index],
      productId: prod.id,
      name: prod.name,
      karat: prod.karat || '18K',
      weightGrams: prod.weightGrams || 5.0,
      craftFee: prod.craftFee || 0,
      price: prod.basePrice || 20000,
    };
    setOrderItems(copy);
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const copy = [...orderItems];
    copy[index] = { ...copy[index], [field]: val };
    setOrderItems(copy);
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      {
        productId: '',
        name: 'Fine Gold Item',
        karat: '18K',
        weightGrams: 3.5,
        craftFee: 1000,
        price: 15000,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSetDownPaymentPercent = (pct: number) => {
    const calculated = Math.round((newOrderTotal * (pct / 100)) / 100) * 100;
    setDownPaymentAmount(calculated);
  };

  const handleUpdateInstallmentDate = (idx: number, newDate: string) => {
    const copy = [...installments];
    copy[idx].dueDate = newDate;
    setInstallments(copy);
  };

  // Create Order Submit
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      await showErrorAlert('Missing Customer Name', 'Please enter a customer name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: selectedCustomerId !== 'custom' ? selectedCustomerId : undefined,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items: orderItems,
        orderType,
        status: orderStatus,
        paymentMethod,
        isPaid,
        courier,
        trackingNumber,
        termMonths: Number(termMonths),
        frequency,
        downPaymentAmount: Number(downPaymentAmount),
        startDate,
        installments,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        await showSuccessAlert(
          orderType === 'LAYAWAY' ? 'Layaway Plan Created!' : 'Order Created!',
          `Order ${data.order?.orderNumber || ''} has been registered successfully.`
        );
        fetchOrdersAndData();
      } else {
        await showErrorAlert('Order Creation Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Failed to create order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Order Modal
  const handleOpenEditOrder = (order: any) => {
    setEditingOrder(order);
    setEditFormData({
      customerName: order.user?.name || '',
      customerEmail: order.user?.email || '',
      customerPhone: order.user?.phone || '',
      shippingAddress: order.shippingAddress || '',
      status: order.status || 'CONFIRMED',
      courier: order.courier || '',
      trackingNumber: order.trackingNumber || '',
      totalAmount: order.totalAmount || 0,
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Order
  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: editingOrder.id,
          ...editFormData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        await showSuccessAlert('Order Updated!', `Changes to ${editingOrder.orderNumber} have been saved.`);
        fetchOrdersAndData();
      } else {
        await showErrorAlert('Failed to Update', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error updating order.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Update Status Quick Dropdown
  const handleQuickUpdateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Status updated to ${status}`, 'success');
        fetchOrdersAndData();
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    const confirmed = await showConfirmDialog({
      title: `Delete Order ${orderNumber}?`,
      text: 'Are you sure you want to delete this order? All associated installment schedules and invoice records will be removed.',
      confirmButtonText: 'Yes, Delete Order',
      isDanger: true,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds((prev) => prev.filter((i) => i !== orderId));
        await showSuccessAlert('Order Deleted', `Order ${orderNumber} was removed successfully.`);
        fetchOrdersAndData();
      } else {
        await showErrorAlert('Failed to Delete', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error deleting order.');
    }
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <FadeInUp className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block mb-1">
            Order Fulfillment
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Orders & Deliveries
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
              Create Manual Order
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchOrdersAndData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Refresh
            </Button>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Search Input & Bulk Action Bar */}
      <div className="space-y-3">
        <FadeInUp className="max-w-md">
          <Input
            placeholder="Filter orders by number, customer, tracking..."
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
          entityName="orders"
        />
      </div>

      {/* Data Table */}
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
                <th className="text-left p-4">Order & Date</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Items / Mass</th>
                <th className="text-right p-4">Total Value</th>
                <th className="text-center p-4">Status</th>
                <th className="text-left p-4">Courier / Tracking</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-600" />
                    Loading orders...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-neutral-500">
                    <ShoppingBag className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  const itemCount = order.orderItems?.length || 0;
                  const firstItem = order.orderItems?.[0]?.product?.name || 'Gold Jewelry';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        isSelected ? 'bg-gold-500/5' : ''
                      }`}
                    >
                      <td className="w-10 p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(order.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gold-700 text-xs">
                            {order.orderNumber}
                          </span>
                          <Badge
                            variant={order.orderType === 'LAYAWAY' ? 'gold' : 'emerald'}
                            size="sm"
                          >
                            {order.orderType}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-neutral-900 block">{order.user?.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {order.user?.phone || order.user?.email}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-neutral-800 block line-clamp-1">
                          {firstItem} {itemCount > 1 ? `+${itemCount - 1} more` : ''}
                        </span>
                        <span className="text-[10px] text-gold-700 font-mono font-bold">
                          {formatGrams(order.totalGoldWeightGrams || 0)}
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono font-black text-neutral-900 text-sm">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="p-4 text-center">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleQuickUpdateStatus(order.id, e.target.value)}
                          className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-[11px] font-bold text-neutral-900 focus:border-gold-500 cursor-pointer shadow-2xs"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      <td className="p-4">
                        <span className="text-neutral-700 block font-medium text-[11px]">
                          {order.courier || 'Store Handover'}
                        </span>
                        {order.trackingNumber && (
                          <span className="text-[10px] text-neutral-500 font-mono block">
                            {order.trackingNumber}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditOrder(order)}
                            className="p-1.5 rounded-lg text-gold-700 hover:text-gold-900 hover:bg-gold-500/10 cursor-pointer"
                            title="Edit Order Particulars"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <Link href={`/invoice/${order.id}`}>
                            <button
                              className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                              title="View Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer"
                            title="Delete Order"
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

      {/* EDIT ORDER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Order • ${editingOrder?.orderNumber || ''}`}
        subtitle="Update customer details, dispatch status, tracking number, or totals."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Customer Name</label>
              <input
                type="text"
                value={editFormData.customerName}
                onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-medium"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={editFormData.customerEmail}
                onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Order Amount (₱)</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={editFormData.totalAmount === 0 ? '' : editFormData.totalAmount}
                onChange={(e) => setEditFormData({ ...editFormData, totalAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-700 block mb-1">Shipping / Handover Address</label>
            <input
              type="text"
              value={editFormData.shippingAddress}
              onChange={(e) => setEditFormData({ ...editFormData, shippingAddress: e.target.value })}
              className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Order Status</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-bold"
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Courier Service</label>
              <input
                type="text"
                value={editFormData.courier}
                onChange={(e) => setEditFormData({ ...editFormData, courier: e.target.value })}
                placeholder="LBC, J&T, Counter Handover"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Tracking Code</label>
              <input
                type="text"
                value={editFormData.trackingNumber}
                onChange={(e) => setEditFormData({ ...editFormData, trackingNumber: e.target.value })}
                placeholder="e.g. TRK-88120"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono"
              />
            </div>
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
              Save Order Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE MANUAL ORDER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Manual Order"
        subtitle="Record an offline, store walk-in, cash sale, or custom 0% Layaway plan."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrderSubmit} className="space-y-5 text-xs">
          {/* Customer Selection */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-gold-500/25 space-y-2.5">
            <span className="font-bold text-neutral-800 uppercase block text-[11px]">
              Customer Particulars
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
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-bold">Phone Number</label>
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

            <div>
              <label className="text-[10px] text-neutral-500 block mb-0.5 font-bold">Shipping / Release Address</label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Store Pickup, BGC Taguig, Metro Manila"
                className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-800 uppercase text-[11px]">
                Jewelry Item(s)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-bold text-gold-700 hover:text-gold-900 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {orderItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                      placeholder="Item Description"
                      className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold"
                    />
                    {products.length > 0 && (
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-36 bg-white border border-neutral-300 rounded-lg p-1.5 text-xs"
                      >
                        <option value="">Catalog...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-0.5">Karat</label>
                      <select
                        value={item.karat}
                        onChange={(e) => handleUpdateItem(idx, 'karat', e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg p-1 text-xs font-bold"
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
                        className="w-full bg-white border border-neutral-300 rounded-lg p-1 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value === '' ? 1 : parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-white border border-neutral-300 rounded-lg p-1 text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-0.5">Price (₱)</label>
                      <input
                        type="number"
                        step="100"
                        placeholder="0"
                        value={item.price === 0 ? '' : item.price}
                        onChange={(e) => handleUpdateItem(idx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-neutral-300 rounded-lg p-1 text-xs font-mono font-black text-gold-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-neutral-900 text-white font-mono">
              <span className="text-xs">Order Total Amount:</span>
              <span className="text-base font-black text-gold-400">{formatCurrency(newOrderTotal)}</span>
            </div>
          </div>

          {/* Payment Mode & Layaway Terms Selector */}
          <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-3">
            <span className="font-bold text-neutral-800 uppercase block text-[11px]">
              Transaction Type & Terms
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('CASH')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  orderType === 'CASH'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                💵 Full Cash Sale
              </button>

              <button
                type="button"
                onClick={() => setOrderType('LAYAWAY')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  orderType === 'LAYAWAY'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                🔒 0% Layaway (Choose Months)
              </button>
            </div>

            {/* LAYAWAY TERMS (Months, Downpayment, Frequency, Calendar Dates) */}
            {orderType === 'LAYAWAY' && (
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-600 block mb-1 font-bold">
                      📅 Duration / Months to Pay
                    </label>
                    <select
                      value={termMonths}
                      onChange={(e) => setTermMonths(parseInt(e.target.value) || 2)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-xs font-bold text-gold-700"
                    >
                      <option value={2}>2 Months Plan</option>
                      <option value={3}>3 Months Plan</option>
                      <option value={4}>4 Months Plan</option>
                      <option value={6}>6 Months Plan</option>
                      <option value={8}>8 Months Plan</option>
                      <option value={10}>10 Months Plan</option>
                      <option value={12}>12 Months Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-600 block mb-1 font-bold">
                      Payment Frequency
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as any)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-xs font-medium"
                    >
                      <option value="MONTHLY">Monthly (Every 30 days)</option>
                      <option value="TWICE_MONTHLY">Twice a Month (Every 15 days)</option>
                      <option value="WEEKLY">Weekly (Every 7 days)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-600 block mb-1 font-bold">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1 text-xs font-mono font-bold cursor-pointer"
                    />
                  </div>
                </div>

                {/* Downpayment */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-neutral-600 font-bold">Initial Downpayment (₱)</label>
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
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-1.5 text-xs font-mono font-bold"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                    <span>Remaining Balance: <b className="text-neutral-900 font-mono">{formatCurrency(remainingBalance)}</b></span>
                    <span>Installments: <b className="text-neutral-900 font-mono">{installments.length} Dues</b></span>
                  </div>
                </div>

                {/* Installments Due Dates Schedule */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-neutral-600 uppercase font-bold block">
                    Calculated Installment Due Dates ({termMonths} Months):
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {installments.map((inst, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
                      >
                        <span className="font-mono text-neutral-500 text-[11px] w-6">#{inst.installmentNumber}</span>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => handleUpdateInstallmentDate(idx, e.target.value)}
                          className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-neutral-900 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-neutral-900 text-right">
                          {formatCurrency(inst.amountDue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method & Initial Status */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
            <div>
              <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Initial Dispatch Status</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-bold"
              >
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PROCESSING">PROCESSING (In Vault)</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 block mb-1 font-bold">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-medium"
              >
                <option value="GCASH">GCash</option>
                <option value="CASH">Cash Over-The-Counter</option>
                <option value="BANK_TRANSFER">Bank Wire (BDO / BPI)</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
              </select>
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
              {orderType === 'LAYAWAY' ? `Create ${termMonths}-Month Layaway Order` : 'Create Cash Order'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
