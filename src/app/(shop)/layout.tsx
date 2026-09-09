import React from 'react';
import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';
import { MobileNav } from '@/components/shop/MobileNav';
import { AuthModal } from '@/components/shop/AuthModal';
import { CartToast } from '@/components/shop/CartToast';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FCFCF9] text-[#1A1A1A]">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <MobileNav />
      <AuthModal />
      <CartToast />
    </div>
  );
}
