'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Lock,
  ArrowRight,
  ChevronRight,
  Package,
} from 'lucide-react';
import { ProductItem } from '@/lib/types';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/lib/store';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/animations/Motion';

export default function HomePage() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState<ProductItem[]>([]);
  const [latest, setLatest] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && data.products) {
          setFeatured(data.products.slice(0, 4));
          setLatest(data.products);
        }
      } catch (e) {
        console.error('Error fetching products', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="space-y-12 pb-14 bg-[#FCFCF9] text-[#1A1A1A] overflow-hidden">
      {/* 1. HERO SHOWCASE */}
      <section className="relative pt-6 pb-8 md:pt-12 md:pb-14 border-b border-gold-500/20 bg-gradient-to-b from-[#FAF8F2] to-[#FCFCF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 space-y-4 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-block px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-800 text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              >
                Certified 14K, 18K, 22K & 24K Solid Gold Jewelry
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif text-neutral-900 tracking-tight leading-tight"
              >
                Masterpieces in <span className="gold-text-gradient">Pure Gold</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Welcome to <b>{settings.companyName}</b>. Handcrafted fine jewelry from royal chains to solitaire rings. Purchase upfront or lock in gold spot rates with our <b>0% Interest Layaway</b> from 20% down.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1"
              >
                <Link href="/catalog">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="primary"
                      size="md"
                      className="text-xs font-bold uppercase tracking-wider shadow-md"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Browse Catalog
                    </Button>
                  </motion.div>
                </Link>

                <Link href="/account">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="secondary"
                      size="md"
                      className="text-xs font-bold uppercase tracking-wider"
                      leftIcon={<Lock className="w-3.5 h-3.5 text-gold-600" />}
                    >
                      Layaway Hub
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-200 max-w-md mx-auto lg:mx-0 text-neutral-800"
              >
                <div>
                  <span className="block text-lg font-black text-neutral-900 font-serif">100%</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Hallmarked</span>
                </div>
                <div>
                  <span className="block text-lg font-black text-gold-700 font-serif">0%</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Layaway Fee</span>
                </div>
                <div>
                  <span className="block text-lg font-black text-neutral-900 font-serif">Direct</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">From Vault</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual Card - Brand Maison Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-gold-500/40 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.18),transparent_70%)] pointer-events-none" />

                {/* Brand Logo Emblem */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden flex items-center justify-center p-2 mb-3 group-hover:scale-105 transition-transform duration-500">
                  <Image
                    src={settings.logoUrl || '/images/logo.png'}
                    alt={settings.companyName || 'Danica Gold'}
                    fill
                    priority
                    className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
                  />
                </div>

                <div className="relative z-10 space-y-1.5 max-w-xs">
                  <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest block font-mono">
                    Official Fine Jewelry Maison
                  </span>
                  <h3 className="text-base sm:text-lg font-black font-serif text-white tracking-wide">
                    {settings.companyName || 'DANICA GOLD PHILIPPINES'}
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    {settings.tagline || 'Haute Joaillerie & Certified Fine Gold'}
                  </p>
                </div>

                <div className="relative z-10 mt-5 pt-4 border-t border-gold-500/20 w-full flex items-center justify-between text-[11px] font-mono text-gold-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Vault Certified
                  </span>
                  <span className="text-neutral-400">14K • 18K • 22K • 24K</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. HOW LAYAWAY WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="rounded-2xl bg-white border border-gold-500/25 p-5 md:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-black font-serif text-neutral-900">
                  0% Interest Gold Layaway Plan
                </h2>
                <p className="text-xs text-neutral-500">
                  Lock in today&apos;s gold spot rate. Even if market prices rise, your contract remains 100% frozen.
                </p>
              </div>
              <Link href="/catalog" className="text-xs font-bold text-gold-700 hover:text-gold-900 flex items-center gap-1 group">
                <span>View Eligible Items</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { step: '01', title: 'Choose Jewelry', desc: 'Select any 14K–24K chain, ring, or bracelet.' },
                { step: '02', title: 'Lock Gold Rate', desc: 'Deposit 20%, 30%, or 50% to freeze the spot price.' },
                { step: '03', title: 'Monthly Installments', desc: 'Pay over 1, 3, 6, 9, or 12 months at 0% interest.' },
                { step: '04', title: 'Claim & Release', desc: 'Claim in-store or receive securely upon contract completion.' },
              ].map((item) => (
                <StaggerItem key={item.step}>
                  <motion.div
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="p-3.5 rounded-xl bg-[#FCFCF9] border border-gold-500/20 hover:border-gold-500/50 hover:bg-white transition-colors h-full flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-black text-gold-600 font-mono block mb-1">STEP {item.step}</span>
                      <h3 className="text-xs font-bold text-neutral-900 mb-0.5">{item.title}</h3>
                      <p className="text-[11px] text-neutral-600 leading-snug">{item.desc}</p>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </FadeInUp>
      </section>

      {/* 3. FEATURED JEWELRY (Live from Database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUp className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black font-serif text-neutral-900">
              Featured Fine Jewelry
            </h2>
            <p className="text-xs text-neutral-500">Live products from our vault catalog</p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-bold text-gold-700 hover:text-gold-900 flex items-center gap-1 transition-colors group"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeInUp>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-neutral-500">Loading catalog...</p>
          </div>
        ) : featured.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-gold-500/20 text-xs text-neutral-500">
            <Package className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
            No products currently in catalog. Add jewelry from the admin dashboard.
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* 4. LATEST ARRIVALS (Live from Database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInUp className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black font-serif text-neutral-900">
              Latest Vault Arrivals
            </h2>
            <p className="text-xs text-neutral-500">Recently added certified pieces</p>
          </div>
          <Link
            href="/catalog"
            className="text-xs font-bold text-gold-700 hover:text-gold-900 flex items-center gap-1 transition-colors group"
          >
            <span>Filter All Categories</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeInUp>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-neutral-500">Loading catalog...</p>
          </div>
        ) : latest.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-gold-500/20 text-xs text-neutral-500">
            <Package className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
            No new arrivals registered yet.
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latest.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </div>
  );
}
