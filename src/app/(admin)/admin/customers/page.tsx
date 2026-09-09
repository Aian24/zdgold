'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Lock,
  DollarSign,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  UserCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/gold-pricing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import { FadeInUp } from '@/components/animations/Motion';
import { Pagination, BulkActionBar } from '@/components/ui/DataTableControls';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showToast,
} from '@/lib/swal';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    role: 'CUSTOMER',
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && data.customers) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtered & Paginated
  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()))
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
      title: 'Delete Selected Clients?',
      text: `Are you sure you want to delete ${selectedIds.length} customer account(s) and their order/layaway history?`,
      confirmButtonText: 'Yes, Delete Accounts',
      isDanger: true,
    });

    if (!confirmed) return;

    setIsDeletingBulk(true);
    try {
      const res = await fetch(`/api/customers?ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        await showSuccessAlert('Clients Removed', `${selectedIds.length} customer records deleted.`);
        fetchCustomers();
      } else {
        await showErrorAlert('Delete Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error deleting customers');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: 'Metro Manila',
      zipCode: '',
      role: 'CUSTOMER',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      zipCode: customer.zipCode || '',
      role: customer.role || 'CUSTOMER',
    });
    setIsEditModalOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        await showSuccessAlert('Client Registered!', `${formData.name} is now added to the CRM.`);
        fetchCustomers();
      } else {
        await showErrorAlert('Registration Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Network error adding customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCustomer.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        await showSuccessAlert('Client Updated!', `Profile for ${formData.name} was updated successfully.`);
        fetchCustomers();
      } else {
        await showErrorAlert('Update Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Network error updating customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    const confirmed = await showConfirmDialog({
      title: `Delete Client ${name}?`,
      text: 'Are you sure you want to delete this customer record? All linked order entries and layaways will be removed.',
      confirmButtonText: 'Yes, Delete Client',
      isDanger: true,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/customers?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        await showSuccessAlert('Client Deleted', `${name}'s account was deleted.`);
        fetchCustomers();
      } else {
        await showErrorAlert('Delete Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error deleting customer');
    }
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <FadeInUp className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block mb-1">
            Client Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Customers & VIP Clients
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-bold shadow-xs"
            >
              Add Client
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchCustomers}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Refresh CRM
            </Button>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Search Input & Bulk Action Bar */}
      <div className="space-y-3">
        <FadeInUp className="max-w-md">
          <Input
            placeholder="Search clients by name, email, phone, city..."
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
          entityName="customers"
        />
      </div>

      {/* Customers Table */}
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
                <th className="text-left p-4">Client</th>
                <th className="text-left p-4">Contact</th>
                <th className="text-left p-4">Location</th>
                <th className="text-center p-4">Role</th>
                <th className="text-center p-4">Active Layaways</th>
                <th className="text-right p-4">Total Collected</th>
                <th className="text-right p-4">Member Since</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-xs text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-600" />
                    Loading customers...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-xs text-neutral-500">
                    <Users className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map((client) => {
                  const isSelected = selectedIds.includes(client.id);

                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        isSelected ? 'bg-gold-500/5' : ''
                      }`}
                    >
                      <td className="w-10 p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(client.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {client.avatar ? (
                            <img
                              src={client.avatar}
                              alt={client.name}
                              className="w-8 h-8 rounded-full object-cover border border-gold-500/30 shadow-2xs flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {client.name?.[0] || 'C'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-neutral-900 block text-xs">{client.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              ID: {client.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-neutral-800 font-medium">{client.email}</p>
                        <p className="text-neutral-500 text-[11px] font-mono">{client.phone || 'No phone'}</p>
                      </td>

                      <td className="p-4 text-neutral-700">
                        <p className="font-medium">{client.city || 'Metro Manila'}</p>
                        <p className="text-[11px] text-neutral-500 truncate max-w-[160px]">{client.address || 'Philippines'}</p>
                      </td>

                      <td className="p-4 text-center font-mono">
                        <Badge variant={client.role === 'ADMIN' ? 'gold' : 'slate'} size="sm">
                          {client.role || 'CUSTOMER'}
                        </Badge>
                      </td>

                      <td className="p-4 text-center font-mono font-bold">
                        <Badge variant={client.activeLayaways > 0 ? 'gold' : 'slate'} size="sm">
                          {client.activeLayaways || 0} Active
                        </Badge>
                      </td>

                      <td className="p-4 text-right font-mono font-black text-emerald-700 text-sm">
                        {formatCurrency(client.totalSpend || 0)}
                      </td>

                      <td className="p-4 text-right text-neutral-500 font-mono text-[11px]">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 rounded-lg text-gold-700 hover:text-gold-900 hover:bg-gold-500/10 cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteCustomer(client.id, client.name)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer"
                            title="Delete Customer"
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

      {/* ADD CUSTOMER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Client"
        subtitle="Create a new client profile with contact and delivery details."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Maria Santos"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@domain.ph"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+63 917 888 1234"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Account Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-bold"
              >
                <option value="CUSTOMER">CUSTOMER (Standard)</option>
                <option value="ADMIN">ADMIN (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Unit, Building, Street"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Taguig City"
                className="w-full bg-white border border-neutral-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
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
              Create Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Client • ${editingCustomer?.name || ''}`}
        subtitle="Update contact details, role, or delivery address."
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Account Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-bold"
              >
                <option value="CUSTOMER">CUSTOMER (Standard)</option>
                <option value="ADMIN">ADMIN (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 block mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2"
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
              isLoading={isSubmitting}
              className="font-bold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
