'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Menu,
  X,
  Lock,
  ChevronDown,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { useCart, useAuth, useSettings } from '@/lib/store';
import { formatCurrency } from '@/lib/gold-pricing';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { itemCount, subtotal } = useCart();
  const { user, openAuthModal, logout } = useAuth();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [cartBounceKey, setCartBounceKey] = useState(0);

  useEffect(() => {
    if (itemCount > 0) {
      setCartBounceKey((prev) => prev + 1);
    }
  }, [itemCount]);

  useEffect(() => {
    const handleCartAdd = () => {
      setCartBounceKey((prev) => prev + 1);
    };
    window.addEventListener('dg_cart_item_added', handleCartAdd);
    return () => window.removeEventListener('dg_cart_item_added', handleCartAdd);
  }, []);

  const navLinks = [
    { href: '/catalog', label: 'All Jewelry' },
    { href: '/catalog?category=NECKLACES', label: 'Necklaces' },
    { href: '/catalog?category=RINGS', label: 'Rings' },
    { href: '/catalog?category=BRACELETS', label: 'Bracelets' },
    { href: '/catalog?category=PENDANTS', label: 'Pendants' },
    { href: '/catalog?category=EARRINGS', label: 'Earrings' },
    { href: '/account', label: 'Layaway Hub' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gold-500/25 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          {/* Brand Logo & Company Name */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            {settings.logoUrl ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full overflow-hidden border border-gold-500/40 flex items-center justify-center bg-white shadow-xs"
              >
                <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-cover" />
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center p-0.5 shadow-xs"
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="font-serif font-black text-gold-600 text-xs">
                    {settings.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'DG'}
                  </span>
                </div>
              </motion.div>
            )}
            <div>
              <span className="text-sm sm:text-base font-black font-serif tracking-wider text-[#1A1A1A] uppercase group-hover:text-gold-600 transition-colors whitespace-nowrap">
                {settings.companyName}
              </span>
              <span className="block text-[8px] sm:text-[9px] text-gold-600 tracking-widest uppercase font-sans font-bold -mt-0.5 whitespace-nowrap">
                {settings.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 flex-nowrap whitespace-nowrap overflow-x-hidden">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'text-gold-700 bg-gold-500/15 border border-gold-500/40 shadow-2xs'
                      : 'text-neutral-700 hover:text-gold-700 hover:bg-gold-500/10'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 border border-gold-500/50 rounded-lg pointer-events-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* User Account Button */}
            {user ? (
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FAF8F2] border border-gold-500/30 text-neutral-800 hover:border-gold-500 transition-colors text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover border border-gold-500/40"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-700 flex items-center justify-center font-bold text-[10px]">
                      {user.name[0]}
                    </div>
                  )}
                  <span className="hidden sm:inline whitespace-nowrap font-bold text-xs">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gold-600 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-gold-500/40 p-2 shadow-xl z-50 origin-top-right"
                    >
                      <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                        <p className="text-xs font-bold text-neutral-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-gold-500/15 text-gold-800 font-mono text-[10px] font-bold uppercase">
                          {user.role === 'ADMIN' ? 'Admin Access' : 'Client Access'}
                        </span>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <Link
                          href="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-3 py-2 text-xs text-neutral-700 hover:bg-gold-500/15 hover:text-gold-800 rounded-xl font-medium transition-colors"
                        >
                          Customer Portal & Layaways
                        </Link>

                        {user.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-3 py-2 text-xs text-gold-700 font-bold hover:bg-gold-500/15 rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            <Lock className="w-3.5 h-3.5 text-gold-600" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left block px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl font-medium cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openAuthModal('signin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs transition-all shadow-2xs cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </motion.button>
            )}

            {/* Shopping Cart Button with Pop Animation */}
            <motion.div
              key={cartBounceKey}
              animate={cartBounceKey > 0 ? { scale: [1, 1.15, 0.95, 1], rotate: [0, -3, 3, 0] } : {}}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-500/15 to-gold-600/20 border border-gold-500/40 text-neutral-800 hover:border-gold-500 transition-all group whitespace-nowrap shadow-2xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-gold-600 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline text-xs font-bold text-neutral-900">
                  {subtotal > 0 ? formatCurrency(subtotal) : 'Cart'}
                </span>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center w-4 h-4 rounded-full bg-gold-500 text-white font-black text-[10px] shadow-xs"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gold-600" /> : <Menu className="w-5 h-5 text-gold-600" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with Animation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden overflow-hidden border-t border-gold-500/20 py-3 space-y-1"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-neutral-800 hover:bg-gold-500/15 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {!user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signin');
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-900 font-bold bg-gold-500/15 border border-gold-500/30 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-gold-600" />
                  <span>Sign In / Create Account</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 font-bold bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Sign Out ({user.name.split(' ')[0]})</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
