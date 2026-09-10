'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Upload,
  Tag,
  Zap,
  EyeOff,
  Eye,
  DollarSign,
} from 'lucide-react';
import { ProductItem, GoldKarat, ProductCategory, GoldRateData } from '@/lib/types';
import { formatCurrency, formatGrams, DEFAULT_GOLD_RATES } from '@/lib/gold-pricing';
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
  GoldSwal,
} from '@/lib/swal';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'SOLD'>('ALL');

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
    weightGrams: 5.0,
    craftFee: 0,
    basePrice: 18200.0,
    stockQuantity: 1,
    isFeatured: false,
    images: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
    hallmarkCertNumber: '',
    dimensions: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && data.rates) {
        const rateMap: Record<string, number> = {};
        data.rates.forEach((r: GoldRateData) => {
          rateMap[r.karat] = r.pricePerGram;
        });
        setRates(rateMap);
      }
    } catch (e) {
      console.error('Failed to load gold rates', e);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products?includeSold=true');
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
    fetchRates();
  }, []);

  const getSpotRateForKarat = (karat: GoldKarat) => {
    return rates[karat] || DEFAULT_GOLD_RATES[karat]?.pricePerGram || 3640.0;
  };

  const handleAutoCalculatePrice = () => {
    const rate = getSpotRateForKarat(formData.karat);
    const weight = Number(formData.weightGrams) || 0;
    const computed = Number((weight * rate).toFixed(2));
    setFormData((prev) => ({ ...prev, basePrice: computed }));
    showToast(`Price computed: ₱${computed.toLocaleString()} (${weight}g @ ₱${rate}/g)`, 'info');
  };

  const getProductImage = (product: ProductItem): string => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (typeof product.images === 'string') {
      const imgStr = product.images as string;
      if (imgStr.startsWith('http') || imgStr.startsWith('/')) {
        return imgStr;
      }
    }
    return 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800';
  };

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

  // Filtered & Paginated
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.karat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'IN_STOCK') return p.stockQuantity > 0;
    if (statusFilter === 'SOLD') return p.stockQuantity <= 0;
    return true;
  });

  const totalInStock = products.filter((p) => p.stockQuantity > 0).length;
  const totalSold = products.filter((p) => p.stockQuantity <= 0).length;

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
    const defaultKarat: GoldKarat = '18K';
    const defaultWeight = 5.0;
    const defaultRate = getSpotRateForKarat(defaultKarat);
    const defaultPrice = Number((defaultWeight * defaultRate).toFixed(2));

    setFormData({
      name: '',
      description: 'Solid fine gold jewelry.',
      category: 'NECKLACES',
      karat: defaultKarat,
      weightGrams: defaultWeight,
      craftFee: 0,
      basePrice: defaultPrice,
      stockQuantity: 1,
      isFeatured: false,
      images: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
      hallmarkCertNumber: '',
      dimensions: '',
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
      craftFee: 0,
      basePrice: product.basePrice,
      stockQuantity: product.stockQuantity,
      isFeatured: product.isFeatured,
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : (product.images as any) || '',
      hallmarkCertNumber: '',
      dimensions: '',
    });
    setIsModalOpen(true);
  };

  // Toggle Mark as Sold (Sets stock to 0)
  const handleMarkAsSold = async (product: ProductItem) => {
    const confirmed = await showConfirmDialog({
      title: `Mark "${product.name}" as Sold?`,
      text: 'Setting the stock to 0 will immediately hide this product from the customer storefront.',
      confirmButtonText: 'Yes, Mark as Sold',
      isDanger: false,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: 0 }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`"${product.name}" marked as SOLD and hidden from store.`, 'success');
        fetchProducts();
      } else {
        await showErrorAlert('Update Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Failed to update product status.');
    }
  };

  // Restock Product (Sets stock > 0)
  const handleRestockProduct = async (product: ProductItem) => {
    const { value: newQty } = await GoldSwal.fire({
      title: `Restock "${product.name}"`,
      text: 'Enter available stock quantity to make this product visible in the store:',
      input: 'number',
      inputValue: '1',
      inputAttributes: {
        min: '1',
        step: '1',
      },
      showCancelButton: true,
      confirmButtonText: 'Restock Product',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || parseInt(value, 10) <= 0) {
          return 'Please enter a valid quantity of 1 or more.';
        }
      },
    });

    if (!newQty) return;

    try {
      const qty = parseInt(newQty, 10);
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: qty }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`"${product.name}" restocked with ${qty} pcs and is now visible!`, 'success');
        fetchProducts();
      } else {
        await showErrorAlert('Update Failed', data.error);
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Failed to restock product.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirmDialog({
      title: `Delete ${name}?`,
      text: 'Are you sure you want to permanently remove this item from the gold inventory?',
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
    if (!formData.name.trim()) {
      await showErrorAlert('Missing Title', 'Please provide a product title.');
      return;
    }

    if (formData.basePrice === undefined || formData.basePrice === null || isNaN(Number(formData.basePrice))) {
      await showErrorAlert('Missing Price', 'Please enter a valid selling price for this product.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(String(formData.basePrice)),
          craftFee: 0,
          weightGrams: parseFloat(String(formData.weightGrams || 0)),
          stockQuantity: parseInt(String(formData.stockQuantity || 0), 10),
          images: [formData.images],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        await showSuccessAlert(
          editingProduct ? 'Product Saved!' : 'Product Created!',
          `${formData.name} (Price: ${formatCurrency(formData.basePrice)}) has been saved successfully.`
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
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage product selling prices, stock quantities, and availability. Sold items are automatically hidden from the storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchProducts();
                fetchRates();
              }}
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

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              All Products ({products.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('IN_STOCK');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'IN_STOCK'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              In Stock ({totalInStock})
            </button>
            <button
              onClick={() => {
                setStatusFilter('SOLD');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'SOLD'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Sold / Hidden ({totalSold})
            </button>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-80">
            <Input
              placeholder="Search by title, karat, category..."
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
          entityName="products"
        />
      </div>

      {/* Table & Mobile Cards */}
      <FadeInUp className="rounded-3xl theme-card overflow-hidden shadow-sm">
        {/* Desktop Data Table */}
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
                <th className="text-left p-4">Item & Visual</th>
                <th className="text-center p-4">Category</th>
                <th className="text-center p-4">Purity & Mass</th>
                <th className="text-right p-4">Selling Price (₱)</th>
                <th className="text-center p-4">Status & Stock</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-600" />
                    Loading products...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-neutral-500">
                    <Package className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((product, idx) => {
                  const isSelected = selectedIds.includes(product.id);
                  const isSold = product.stockQuantity <= 0;
                  const img = getProductImage(product);

                  return (
                    <tr
                      key={product.id}
                      className={`theme-table-row transition-colors ${
                        idx % 2 === 1 ? 'theme-table-row-alt' : ''
                      } ${isSelected ? 'bg-gold-500/10' : ''} ${isSold ? 'opacity-75 bg-neutral-50/50' : ''}`}
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
                            {isSold && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-[9px] font-black text-rose-300 uppercase tracking-tighter">SOLD</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block text-xs line-clamp-1">
                              {product.name}
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

                      <td className="p-4 text-right font-mono font-black text-neutral-900 text-sm">
                        {formatCurrency(product.basePrice)}
                      </td>

                      <td className="p-4 text-center font-mono">
                        {isSold ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <EyeOff className="w-3 h-3 text-rose-600" />
                            SOLD (HIDDEN)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Eye className="w-3 h-3 text-emerald-600" />
                            IN STOCK ({product.stockQuantity})
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Toggle Mark as Sold / Restock Button */}
                          {isSold ? (
                            <button
                              onClick={() => handleRestockProduct(product)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                              title="Restock and make visible in store"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Restock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsSold(product)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 flex items-center gap-1 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                              title="Mark as Sold (Set stock to 0 & hide from store)"
                            >
                              <Tag className="w-3 h-3" />
                              Mark Sold
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-gold-700 hover:text-gold-900 hover:bg-gold-500/10 cursor-pointer border border-transparent hover:border-gold-500/30"
                            title="Edit product price and details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer border border-transparent hover:border-rose-300"
                            title="Delete product"
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
              Loading products...
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              <Package className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              No products found matching your search.
            </div>
          ) : (
            paginated.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              const isSold = product.stockQuantity <= 0;
              const img = getProductImage(product);

              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${isSold ? 'bg-neutral-50/70 border-neutral-200' : 'bg-white border-neutral-200'}`}
                  style={{
                    backgroundColor: isSelected ? 'rgba(212,175,55,0.08)' : undefined,
                    borderColor: isSelected ? 'var(--theme-primary, #D4AF37)' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-gold-600 focus:ring-gold-500 cursor-pointer accent-gold-600"
                      />
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-gold-500/20 flex-shrink-0">
                        <Image src={img} alt={product.name} fill className="object-cover" />
                        {isSold && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[9px] font-black text-rose-300 uppercase">SOLD</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-bold block text-sm line-clamp-1 text-neutral-900">
                          {product.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isSold ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              ● SOLD OUT (HIDDEN)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              ● {product.stockQuantity} in stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 rounded-lg text-gold-700 hover:bg-gold-500/10 cursor-pointer"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
                    <Badge variant="slate" size="sm">{product.category}</Badge>
                    <span className="text-xs font-mono font-bold text-gold-700">
                      {product.karat} • {formatGrams(product.weightGrams)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">Selling Price</span>
                      <span className="font-mono font-black text-base text-neutral-900">
                        {formatCurrency(product.basePrice)}
                      </span>
                    </div>

                    <div>
                      {isSold ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRestockProduct(product)}
                          leftIcon={<RefreshCw className="w-3 h-3" />}
                          className="text-xs font-bold text-emerald-700 border-emerald-300 bg-emerald-50"
                        >
                          Restock
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMarkAsSold(product)}
                          leftIcon={<Tag className="w-3 h-3" />}
                          className="text-xs font-bold text-rose-700 border-rose-300 bg-rose-50"
                        >
                          Mark Sold
                        </Button>
                      )}
                    </div>
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

      {/* Simplified Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Gold Inventory Item'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Product Title"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. 18K Solid Gold Cuban Link Bracelet"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              options={[
                { label: 'Necklaces', value: 'NECKLACES' },
                { label: 'Rings', value: 'RINGS' },
                { label: 'Bracelets', value: 'BRACELETS' },
                { label: 'Bangles', value: 'BANGLES' },
                { label: 'Pendants', value: 'PENDANTS' },
                { label: 'Earrings', value: 'EARRINGS' },
              ]}
            />

            <Select
              label="Gold Karat"
              value={formData.karat}
              onChange={(e) => setFormData({ ...formData, karat: e.target.value as any })}
              options={[
                { label: '18K', value: '18K' },
                { label: '24K', value: '24K' },
                { label: '22K', value: '22K' },
                { label: '14K', value: '14K' },
                { label: '10K', value: '10K' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">
                Weight (Grams)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 5.50"
                value={formData.weightGrams === 0 ? '' : formData.weightGrams}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weightGrams: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 font-mono text-neutral-900 shadow-xs focus:border-gold-500 focus:outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">
                Stock Quantity (Pieces)
              </label>
              <input
                type="number"
                min="0"
                placeholder="1"
                value={formData.stockQuantity === 0 ? '0' : formData.stockQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stockQuantity: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 font-mono text-neutral-900 shadow-xs focus:border-gold-500 focus:outline-none font-bold"
                required
              />
            </div>
          </div>

          {/* Simple Selling Price Input with Quick Spot Rate Helper */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-gold-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-neutral-900 uppercase flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gold-600" />
                Item Selling Price (₱)
              </label>

              <button
                type="button"
                onClick={handleAutoCalculatePrice}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-500 text-white font-bold text-[11px] hover:bg-gold-600 cursor-pointer transition-colors shadow-2xs"
                title="Compute Weight x Spot Rate"
              >
                <Zap className="w-3 h-3 text-yellow-200 fill-yellow-200" />
                Compute from Spot Rate
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-base text-gold-700">
                ₱
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.basePrice === 0 ? '' : formData.basePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basePrice: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full pl-8 pr-3 py-2 bg-white border border-gold-500/40 rounded-xl font-mono text-base font-black text-neutral-900 shadow-2xs focus:border-gold-600 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>Spot Rate: {formatCurrency(getSpotRateForKarat(formData.karat))}/g</span>
              <span className="font-mono font-bold text-neutral-800">{formatCurrency(formData.basePrice)}</span>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <label className="block text-xs font-bold text-neutral-800 uppercase">
              Product Jewelry Photo
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-neutral-300 flex-shrink-0">
                {formData.images ? (
                  <img src={formData.images} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                    <Package className="w-5 h-5" />
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
                  {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>
            </div>
            <Input
              label="Or Image URL"
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              placeholder="https://..."
              className="text-xs"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-xs text-neutral-900 focus:border-gold-500 focus:outline-none shadow-xs"
              required
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
              className="font-bold"
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
