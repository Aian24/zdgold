'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Scale,
  RefreshCw,
  Search,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { ProductItem, GoldKarat, ProductCategory } from '@/lib/types';
import { formatCurrency, formatGrams } from '@/lib/gold-pricing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { motion } from 'framer-motion';
import { FadeInUp } from '@/components/animations/Motion';
import { Pagination, BulkActionBar } from '@/components/ui/DataTableControls';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showToast,
} from '@/lib/swal';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'NECKLACES' as ProductCategory,
    karat: '18K' as GoldKarat,
    weightGrams: 20.0,
    craftFee: 200.0,
    basePrice: 1500.0,
    stockQuantity: 10,
    isFeatured: false,
    images: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
    hallmarkCertNumber: 'DG-AU-CERT-2026',
    dimensions: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setFormData((prev) => ({ ...prev, images: json.url }));
        showToast('Photo uploaded successfully', 'success');
      } else {
        await showErrorAlert('Upload Failed', json.error || 'Failed to upload product photo');
      }
    } catch (err) {
      console.error('Product image upload error:', err);
      // Fallback: convert file to Data URL directly in browser
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (dataUrl) {
          setFormData((prev) => ({ ...prev, images: dataUrl }));
          showToast('Photo loaded! Click Save to apply.', 'info');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered & Paginated
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.karat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllOnPageSelected =
    paginated.length > 0 && paginated.every((p) => selectedIds.includes(p.id));

  const handleSelectAll = () => {
    if (isAllOnPageSelected) {
      const pageIds = new Set(paginated.map((p) => p.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...paginated.map((p) => p.id)]));
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
      title: 'Delete Selected Products?',
      text: `Are you sure you want to delete ${selectedIds.length} selected product(s) from the catalog?`,
      confirmButtonText: 'Yes, Delete All',
      isDanger: true,
    });

    if (!confirmed) return;

    setIsDeletingBulk(true);
    try {
      const res = await fetch(`/api/products?ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        await showSuccessAlert('Products Removed', `${selectedIds.length} product(s) were deleted successfully.`);
        fetchProducts();
      } else {
        await showErrorAlert('Delete Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Failed to delete products.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: 'Solid luxury gold crafted to highest standards.',
      category: 'NECKLACES',
      karat: '18K',
      weightGrams: 25.0,
      craftFee: 250.0,
      basePrice: 1870.0,
      stockQuantity: 8,
      isFeatured: false,
      images: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
      hallmarkCertNumber: `DG-CERT-${Math.floor(1000 + Math.random() * 9000)}`,
      dimensions: '22 inches, 4.0mm width',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      karat: product.karat,
      weightGrams: product.weightGrams,
      craftFee: product.craftFee,
      basePrice: product.basePrice,
      stockQuantity: product.stockQuantity,
      isFeatured: product.isFeatured,
      images: Array.isArray(product.images) ? product.images[0] : product.images,
      hallmarkCertNumber: product.hallmarkCertNumber || '',
      dimensions: product.dimensions || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirmDialog({
      title: `Delete ${name}?`,
      text: 'Are you sure you want to remove this item from the jewelry inventory?',
      confirmButtonText: 'Yes, Delete Item',
      isDanger: true,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        await showSuccessAlert('Product Deleted', `${name} has been removed from inventory.`);
        fetchProducts();
      } else {
        await showErrorAlert('Delete Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Failed to delete product.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: [formData.images],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        await showSuccessAlert(
          editingProduct ? 'Product Saved!' : 'Product Created!',
          `${formData.name} has been successfully saved to the gold catalog.`
        );
        fetchProducts();
      } else {
        await showErrorAlert('Save Failed', data.error || 'Failed to save product');
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Error while saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <FadeInUp className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block mb-1">
            Inventory Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Products Catalog
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchProducts}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Refresh
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs font-bold shadow-sm"
            >
              Add New Product
            </Button>
          </motion.div>
        </div>
      </FadeInUp>

      {/* Search Input & Bulk Action Bar */}
      <div className="space-y-3">
        <FadeInUp className="flex items-center gap-3 max-w-md">
          <Input
            placeholder="Filter inventory by name, karat, category..."
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
          entityName="products"
        />
      </div>

      {/* Table */}
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
                <th className="text-left p-4">Item & Visual</th>
                <th className="text-center p-4">Category</th>
                <th className="text-center p-4">Purity & Mass</th>
                <th className="text-right p-4">Craft Fee</th>
                <th className="text-right p-4">Price</th>
                <th className="text-center p-4">Stock</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-600" />
                    Loading products...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs text-neutral-500">
                    <Package className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const img =
                    Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0]
                      : 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800';

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-neutral-50 transition-colors ${
                        isSelected ? 'bg-gold-500/5' : ''
                      }`}
                    >
                      <td className="w-10 p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(product.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-gold-500/20 flex-shrink-0 shadow-xs">
                            <Image src={img} alt={product.name} fill className="object-cover" />
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block text-xs line-clamp-1">
                              {product.name}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-mono font-bold">
                              {product.hallmarkCertNumber || 'Certified'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <Badge variant="slate" size="sm">
                          {product.category}
                        </Badge>
                      </td>

                      <td className="p-4 text-center font-mono font-bold text-gold-700">
                        {product.karat} • {formatGrams(product.weightGrams)}
                      </td>

                      <td className="p-4 text-right font-mono text-neutral-700 font-medium">
                        {formatCurrency(product.craftFee)}
                      </td>

                      <td className="p-4 text-right font-mono font-black text-neutral-900 text-sm">
                        {formatCurrency(product.basePrice)}
                      </td>

                      <td className="p-4 text-center font-mono font-bold">
                        <span className={product.stockQuantity <= 5 ? 'text-rose-600' : 'text-emerald-700'}>
                          {product.stockQuantity} pcs
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-gold-700 hover:text-gold-900 hover:bg-gold-500/10 cursor-pointer"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Gold Product' : 'Add New Gold Inventory Item'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Product Title"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. 22K Royal Emirates Rope Chain"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              options={[
                { label: 'Necklaces & Chains', value: 'NECKLACES' },
                { label: 'Rings & Solitaires', value: 'RINGS' },
                { label: 'Bracelets & Links', value: 'BRACELETS' },
                { label: 'Bangles & Cuffs', value: 'BANGLES' },
                { label: 'Pendants & Medallions', value: 'PENDANTS' },
                { label: 'Earrings & Drops', value: 'EARRINGS' },
              ]}
            />

            <Select
              label="Gold Karat"
              value={formData.karat}
              onChange={(e) => setFormData({ ...formData, karat: e.target.value as any })}
              options={[
                { label: '24K (99.9% Pure)', value: '24K' },
                { label: '22K (91.6% Pure)', value: '22K' },
                { label: '18K (75.0% Pure)', value: '18K' },
                { label: '14K (58.5% Pure)', value: '14K' },
                { label: '10K (41.7% Pure)', value: '10K' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">Weight (Grams)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={formData.weightGrams === 0 ? '' : formData.weightGrams}
                onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-gold-500/30 rounded-xl p-2.5 font-mono text-neutral-900 shadow-xs focus:border-gold-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">Craft Fee (₱)</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={formData.craftFee === 0 ? '' : formData.craftFee}
                onChange={(e) => setFormData({ ...formData, craftFee: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-gold-500/30 rounded-xl p-2.5 font-mono text-neutral-900 shadow-xs focus:border-gold-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">Stock Quantity</label>
              <input
                type="number"
                placeholder="0"
                value={formData.stockQuantity === 0 ? '' : formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-white border border-gold-500/30 rounded-xl p-2.5 font-mono text-neutral-900 shadow-xs focus:border-gold-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-[#FAF8F2] border border-gold-500/20">
            <label className="block text-xs font-bold text-neutral-800 uppercase">
              Product Jewelry Photo
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-gold-500/30 flex-shrink-0">
                {formData.images ? (
                  <img src={formData.images} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                    <Package className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProductImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  {isUploadingImage ? 'Uploading Photo...' : 'Upload Image from Device'}
                </Button>
                <p className="text-[10px] text-neutral-500">Supports JPG, PNG, WebP up to 10MB</p>
              </div>
            </div>
            <Input
              label="Or Direct Image URL"
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              placeholder="https://..."
              className="text-xs"
              required
            />
          </div>

          <Input
            label="Hallmark Assay Certificate Code"
            value={formData.hallmarkCertNumber}
            onChange={(e) => setFormData({ ...formData, hallmarkCertNumber: e.target.value })}
            placeholder="e.g. DG-AU999-0091"
          />

          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-gold-500/30 rounded-xl p-2.5 text-xs text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="font-bold"
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
