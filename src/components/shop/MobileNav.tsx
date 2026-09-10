'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Calculator, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/lib/store';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/catalog', label: 'Catalog', icon: Grid },
    { href: '/calculator', label: 'Calc', icon: Calculator },
    { href: '/cart', label: 'Cart', icon: ShoppingBag, badge: itemCount },
    { href: '/account', label: 'Portal', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gold-500/30 md:hidden py-1.5 px-3 pb-safe shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-gold-700 font-bold bg-gold-500/15'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-gold-600' : 'text-neutral-500'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-gold-600 text-white font-black text-[10px] min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center shadow-xs border border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
