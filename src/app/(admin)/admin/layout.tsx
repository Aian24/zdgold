'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Lock,
  TrendingUp,
  ShoppingBag,
  Users,
  Store,
  Menu,
  X,
  Settings,
  Receipt,
  Palette,
} from 'lucide-react';
import { useAuth, useSettings } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoaded, openAuthModal } = useAuth();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/layaway', label: 'Layaways', icon: Lock },
    { href: '/admin/receipts', label: 'Receipts', icon: Receipt },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/customization', label: 'Customization', icon: Palette },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F2]">
        <Spinner size="lg" label="Verifying Administrative Privileges..." />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F2] px-4">
        <div className="max-w-md w-full rounded-3xl bg-white border border-gold-500/30 p-8 text-center space-y-5 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-neutral-900">Restricted Administration Area</h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              You must be signed in with an authorized <span className="font-bold text-neutral-900">Administrator account</span> to access back-office management, layaway controls, and pricing settings.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link href="/" className="flex-1">
              <Button variant="secondary" size="md" className="w-full text-xs font-bold">
                Return to Store
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              onClick={() => openAuthModal('admin')}
              className="flex-1 text-xs font-bold"
            >
              Admin Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row overflow-x-hidden print:bg-white print:overflow-visible transition-colors duration-200"
      style={{
        backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
        color: 'var(--theme-text-primary, #1A1A1A)',
      }}
    >
      {/* Mobile Admin Header */}
      <div
        className="no-print md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-50 shadow-xs transition-colors duration-200"
        style={{
          backgroundColor: 'var(--theme-topbar-bg, #FFFFFF)',
          borderColor: 'var(--theme-border-card, #E8DFCA)',
          color: 'var(--theme-text-primary, #1A1A1A)',
        }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs"
            style={{
              backgroundColor: 'var(--theme-primary, #D4AF37)',
              color: 'var(--theme-primary-text, #FFFFFF)',
            }}
          >
            DG
          </motion.div>
          <span className="font-serif font-bold">{settings.companyName} Admin</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:opacity-80 cursor-pointer"
          style={{ color: 'var(--theme-primary, #D4AF37)' }}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Sidebar Navigation with Spring Animations */}
      <aside
        className={`no-print fixed md:sticky top-0 h-screen w-60 border-r p-5 flex flex-col justify-between z-40 transition-all duration-300 shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--theme-sidebar-bg, #FFFFFF)',
          color: 'var(--theme-sidebar-text, #1A1A1A)',
          borderColor: 'var(--theme-border-card, #E8DFCA)',
        }}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <Link
            href="/admin"
            className="flex items-center gap-3 pb-5 border-b group"
            style={{ borderColor: 'var(--theme-border-card, rgba(0,0,0,0.08))' }}
          >
            {settings.logoUrl ? (
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="w-9 h-9 rounded-full overflow-hidden border bg-white flex items-center justify-center shadow-xs"
                style={{ borderColor: 'var(--theme-primary, #D4AF37)' }}
              >
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.08, rotate: 4 }}
                className="w-9 h-9 rounded-full flex items-center justify-center p-0.5 shadow-xs"
                style={{
                  background: `linear-gradient(135deg, var(--theme-primary, #D4AF37) 0%, var(--theme-accent, #B8860B) 100%)`,
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--theme-sidebar-bg, #FFFFFF)' }}
                >
                  <span
                    className="font-serif font-black text-xs"
                    style={{ color: 'var(--theme-primary, #D4AF37)' }}
                  >
                    {settings.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'DG'}
                  </span>
                </div>
              </motion.div>
            )}
            <div>
              <span className="text-xs font-black font-serif tracking-wider uppercase block transition-colors">
                {settings.companyName}
              </span>
              <span
                className="text-[10px] uppercase font-mono font-bold"
                style={{ color: 'var(--theme-primary, #D4AF37)' }}
              >
                Admin Center
              </span>
            </div>
          </Link>

          {/* Navigation Links with Animated Active Pill */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="relative block"
                >
                  <motion.div
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative z-10 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors"
                    style={{
                      color: isActive
                        ? 'var(--theme-primary-text, #FFFFFF)'
                        : 'var(--theme-sidebar-text, #1A1A1A)',
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{
                        color: isActive
                          ? 'var(--theme-primary-text, #FFFFFF)'
                          : 'var(--theme-primary, #D4AF37)',
                      }}
                    />
                    <span>{item.label}</span>
                  </motion.div>

                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active-tab"
                      className="absolute inset-0 rounded-xl shadow-xs z-0"
                      style={{
                        backgroundColor: 'var(--theme-primary, #D4AF37)',
                      }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div
          className="pt-4 border-t space-y-2"
          style={{ borderColor: 'var(--theme-border-card, rgba(0,0,0,0.08))' }}
        >
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border"
              style={{
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                borderColor: 'var(--theme-border-card, rgba(212, 175, 55, 0.3))',
                color: 'var(--theme-sidebar-text, #1A1A1A)',
              }}
            >
              <Store className="w-4 h-4" style={{ color: 'var(--theme-primary, #D4AF37)' }} />
              <span>View Storefront</span>
            </motion.div>
          </Link>
          <div
            className="px-3.5 py-1 text-[11px] font-medium truncate opacity-75"
            style={{ color: 'var(--theme-sidebar-text, #1A1A1A)' }}
          >
            Admin: <b>{user?.name || 'Executive Admin'}</b>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Canvas with Smooth Route Fade */}
      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto max-w-none print:p-0 print:max-w-none print:overflow-visible">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
