'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Layers,
} from 'lucide-react';
import { ProductItem } from '@/lib/types';
import { ProductCard } from '@/components/shop/ProductCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StaggerContainer, StaggerItem, FadeInUp } from '@/components/animations/Motion';

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedKarat, setSelectedKarat] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    if (searchParams.get('category')) {
      setSelectedCategory(searchParams.get('category') || 'ALL');
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedKarat !== 'ALL') params.append('karat', selectedKarat);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error('Failed to fetch products for catalog', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedKarat, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const categories = [
    { id: 'ALL', label: 'All Jewelry' },
    { id: 'NECKLACES', label: 'Necklaces & Chains' },
    { id: 'RINGS', label: 'Rings & Solitaires' },
    { id: 'BRACELETS', label: 'Bracelets' },
    { id: 'BANGLES', label: 'Bangles' },
    { id: 'PENDANTS', label: 'Pendants' },
    { id: 'EARRINGS', label: 'Earrings' },
  ];

  const karats = ['ALL', '24K', '22K', '18K', '14K', '10K'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-[#FCFCF9]">
      {/* Header & Search */}
      <FadeInUp className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gold-500/20 mb-5 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Jewelry Catalog
          </h1>
          <p className="text-xs text-neutral-600">
            Solid gold jewelry available for one-time checkout or 0% layaway.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <Input
            placeholder="Search gold jewelry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="text-xs"
          />
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button type="submit" size="sm" variant="primary" className="text-xs">
              Search
            </Button>
          </motion.div>
        </form>
      </FadeInUp>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                isSelected
                  ? 'text-white border-gold-500 shadow-2xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-gold-500 hover:text-gold-800'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="category-pill-active"
                  className="absolute inset-0 bg-gold-500 rounded-lg -z-0"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Filter and Sorting Control Bar */}
      <FadeInUp className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-gold-500/25 mb-6 shadow-2xs">
        {/* Karat Filter Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-neutral-500 font-bold mr-1">Karat:</span>
          {karats.map((k) => (
            <motion.button
              key={k}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedKarat(k)}
              className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer ${
                selectedKarat === k
                  ? 'bg-gold-500 text-white border-gold-500 shadow-2xs'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-gold-500'
              }`}
            >
              {k}
            </motion.button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-500 font-bold whitespace-nowrap">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-44 bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:border-gold-500 focus:outline-none font-medium transition-colors"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="weight-asc">Weight: Light to Heavy</option>
            <option value="weight-desc">Weight: Heavy to Light</option>
          </select>
        </div>
      </FadeInUp>

      {/* Product Grid Area */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent mb-3"
          />
          <p className="text-xs text-neutral-600 font-semibold">Loading catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <FadeInUp className="py-16 text-center rounded-2xl bg-white border border-gold-500/25 p-6 shadow-xs">
          <Layers className="w-10 h-10 text-gold-500/50 mx-auto mb-2" />
          <h3 className="text-base font-bold text-neutral-900 font-serif">No jewelry pieces match your criteria</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Try resetting your filters to discover more items.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedKarat('ALL');
              setSearchQuery('');
            }}
            className="mt-3 text-xs font-bold"
          >
            Reset Filters
          </Button>
        </FadeInUp>
      ) : (
        <AnimatePresence mode="wait">
          <StaggerContainer
            key={`${selectedCategory}-${selectedKarat}-${sortBy}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {products.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </AnimatePresence>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent animate-spin mb-4" />
          <p className="text-xs text-neutral-600 font-semibold">Loading Catalog...</p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
