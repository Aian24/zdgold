'use client';

import React from 'react';
import Link from 'next/link';
import { Award, Lock, Scale } from 'lucide-react';
import { useSettings } from '@/lib/store';

export const Footer: React.FC = () => {
  const { settings } = useSettings();

  return (
    <footer className="bg-white border-t border-gold-500/25 pt-16 pb-24 md:pb-12 text-neutral-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Guarantees Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-12 mb-12 border-b border-gold-500/15">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gold-500/15 text-gold-700 border border-gold-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">100% Certified Gold</h4>
              <p className="text-xs text-neutral-500 mt-1">Official purity hallmarks & assay certificate included.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gold-500/15 text-gold-700 border border-gold-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Price-Lock Layaway</h4>
              <p className="text-xs text-neutral-500 mt-1">Lock in spot rates today with 0% interest monthly terms.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-gold-500/15 text-gold-700 border border-gold-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">Transparent Pricing</h4>
              <p className="text-xs text-neutral-500 mt-1">Real-time live London market spot rates and craft fees.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-gold-500/15">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gold-500/40 flex items-center justify-center bg-white shadow-xs">
                  <img src={settings.logoUrl} alt={settings.companyName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center p-0.5 shadow-xs">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="font-serif font-black text-gold-600 text-xs">
                      {settings.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'DG'}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <span className="text-lg font-serif font-black text-neutral-900 tracking-wider uppercase block">
                  {settings.companyName}
                </span>
                {settings.tagline && (
                  <span className="text-[10px] text-gold-700 font-bold uppercase tracking-wider block">
                    {settings.tagline}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
              {settings.companyName} is a premier high jewelry maison specializing in certified solid 14K–24K gold necklaces, royal diamond-cut chains, solitaire rings, Cuban bracelets, and customizable price-locked layaway contracts.
            </p>
            <div className="text-xs text-neutral-600 font-medium">
              📍 {settings.address}
            </div>
            <div className="text-xs text-neutral-500">
              ✉️ {settings.email} • 📞 {settings.phone}
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-4">Jewelry Collections</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/catalog?category=NECKLACES" className="hover:text-gold-700 transition-colors">Necklaces & Emirates Chains</Link></li>
              <li><Link href="/catalog?category=RINGS" className="hover:text-gold-700 transition-colors">Solitaire & Crown Rings</Link></li>
              <li><Link href="/catalog?category=BRACELETS" className="hover:text-gold-700 transition-colors">Miami Cuban Bracelets</Link></li>
              <li><Link href="/catalog?category=BANGLES" className="hover:text-gold-700 transition-colors">Rose & Yellow Gold Bangles</Link></li>
              <li><Link href="/catalog?category=PENDANTS" className="hover:text-gold-700 transition-colors">Sovereign & Lotus Pendants</Link></li>
              <li><Link href="/catalog?category=EARRINGS" className="hover:text-gold-700 transition-colors">Filigree & Jhumka Earrings</Link></li>
            </ul>
          </div>

          {/* Layaway & Tools */}
          <div>
            <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-4">Client Services</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/account" className="hover:text-gold-700 transition-colors">Customer Portal</Link></li>
              <li><Link href="/calculator" className="hover:text-gold-700 transition-colors">Live Karat Calculator</Link></li>
              <li><Link href="/account" className="hover:text-gold-700 transition-colors">Layaway Payment Hub</Link></li>
              <li><Link href="/catalog" className="hover:text-gold-700 transition-colors">Price-Lock Guarantee</Link></li>
              <li><Link href="/admin" className="text-gold-700 font-bold hover:text-gold-900 transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h5 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-4">Security & Legal</h5>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li>Hallmark Assay Certified</li>
              <li>Anti-Money Laundering Compliant</li>
              <li>Sequential Invoicing</li>
              <li>Terms of Layaway</li>
              <li>Privacy & Vault Security</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>© {new Date().getFullYear()} {settings.companyName}. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Next.js & Capacitor</span>
            <span>•</span>
            <span className="text-gold-600 font-bold">White & Gold Edition</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
