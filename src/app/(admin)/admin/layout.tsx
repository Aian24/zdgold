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
} from 'lucide-react';
import { useAuth, useSettings } from '@/lib/store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/layaway', label: 'Layaways', icon: Lock },
    { href: '/admin/receipts', label: 'Receipts', icon: Receipt },
    { href: '/admin/rates', label: 'Gold Rates', icon: TrendingUp },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1A1A1A] flex flex-col md:flex-row overflow-x-hidden print:bg-white print:overflow-visible">
      {/* Mobile Admin Header */}
      <div className="no-print md:hidden flex items-center justify-between p-4 bg-white border-b border-gold-500/20 sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-8 h-8 rounded-full bg-gold-500 text-white flex items-center justify-center font-bold text-xs shadow-xs"
          >
            DG
          </motion.div>
          <span className="font-serif font-bold text-neutral-900">{settings.companyName} Admin</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-neutral-700 rounded-lg hover:bg-neutral-100 cursor-pointer"
        >
          {sidebarOpen ? <X className="w-6 h-6 text-gold-600" /> : <Menu className="w-6 h-6 text-gold-600" />}
        </motion.button>
      </div>

      {/* Sidebar Navigation with Spring Animations */}
      <aside
        className={`no-print fixed md:sticky top-0 h-screen w-60 bg-white border-r border-gold-500/20 p-5 flex flex-col justify-between z-40 transition-transform duration-300 shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <Link href="/admin" className="flex items-center gap-3 pb-5 border-b border-neutral-100 group">
            {settings.logoUrl ? (
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="w-9 h-9 rounded-full overflow-hidden border border-gold-500/40 bg-white flex items-center justify-center shadow-xs"
              >
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.08, rotate: 4 }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center p-0.5 shadow-xs"
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="font-serif font-black text-gold-600 text-xs">
                    {settings.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'DG'}
                  </span>
                </div>
              </motion.div>
            )}
            <div>
              <span className="text-xs font-black font-serif text-neutral-900 tracking-wider uppercase block group-hover:text-gold-700 transition-colors">
                {settings.companyName}
              </span>
              <span className="text-[10px] text-gold-600 uppercase font-mono font-bold">
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
                    className={`relative z-10 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-neutral-600 hover:text-gold-700 hover:bg-gold-500/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gold-600'}`} />
                    <span>{item.label}</span>
                  </motion.div>

                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active-tab"
                      className="absolute inset-0 bg-gold-500 rounded-xl shadow-xs z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="pt-4 border-t border-neutral-100 space-y-2">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gold-800 bg-gold-500/10 border border-gold-500/30 hover:bg-gold-500/20 transition-colors cursor-pointer"
            >
              <Store className="w-4 h-4 text-gold-600" />
              <span>View Storefront</span>
            </motion.div>
          </Link>
          <div className="px-3.5 py-1 text-[11px] text-neutral-500 font-medium truncate">
            Admin: <b className="text-neutral-900">{user?.name || 'Executive Admin'}</b>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Canvas with Smooth Route Fade */}
      <main className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto max-w-7xl print:p-0 print:max-w-none print:overflow-visible">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
