'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Image as ImageIcon,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Save,
  Upload,
  Trash2,
  Camera,
  ShoppingBag,
} from 'lucide-react';
import { useSettings, SiteBrandSettings } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeInUp } from '@/components/animations/Motion';
import { showSuccessAlert, showErrorAlert, showToast } from '@/lib/swal';

export default function AdminSettingsPage() {
  const { settings, refreshSettings, updateSettingsLocal } = useSettings();
  const [formData, setFormData] = useState<SiteBrandSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setFormData((prev) => ({ ...prev, logoUrl: json.url }));
        showToast('Logo uploaded! Click Save to apply.', 'success');
      } else {
        await showErrorAlert('Upload Failed', json.error || 'Failed to upload image file.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: convert file to Data URL
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        if (dataUrl) {
          setFormData((prev) => ({ ...prev, logoUrl: dataUrl }));
          showToast('Logo loaded! Click Save to apply.', 'info');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        if (data.settings) {
          updateSettingsLocal(data.settings);
        } else {
          updateSettingsLocal(formData);
        }
        refreshSettings();
        await showSuccessAlert(
          'Settings Saved!',
          'Store branding, logo, and company information updated across all pages.'
        );
      } else {
        await showErrorAlert('Failed to Save', data.error || 'Could not save settings.');
      }
    } catch (e) {
      await showErrorAlert('Network Error', 'Network error while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block mb-1">
          Store Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
          Brand & Store Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1">
          Customize your company name, logo image, tagline, contact details, and accent theme. Changes update across the storefront, navbar, invoices, and layaway contracts in real-time.
        </p>
      </div>

      {/* Live Brand Preview Card */}
      <div className="rounded-2xl bg-white border border-gold-500/30 p-6 shadow-sm space-y-4">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
          Live Storefront Brand Preview:
        </span>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FCFCF9] border border-gold-500/20">
          {formData.logoUrl ? (
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold-500/40 bg-white flex items-center justify-center shadow-xs">
              <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="font-serif font-black text-gold-600 text-base">
                  {formData.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'DG'}
                </span>
              </div>
            </div>
          )}
          <div>
            <h2 className="text-lg font-black font-serif text-neutral-900 uppercase tracking-wider">
              {formData.companyName || 'DANICA GOLD'}
            </h2>
            <p className="text-xs text-gold-600 font-bold uppercase tracking-widest">
              {formData.tagline || 'Haute Joaillerie & Fine Gold'}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">{formData.address}</p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="rounded-2xl bg-white border border-gold-500/30 p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 pb-3 border-b border-neutral-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gold-600" />
          Company & Logo Customization
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Company / Brand Name"
            placeholder="e.g. DANICA GOLD PHILIPPINES"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />

          <Input
            label="Brand Tagline / Subtitle"
            placeholder="e.g. Haute Joaillerie & Fine Gold"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            required
          />
        </div>

        {/* LOGO UPLOAD COMPONENT */}
        <div className="space-y-3 p-4 rounded-2xl bg-[#FCFCF9] border border-gold-500/20">
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Brand Logo (Upload File or Enter URL)
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Logo Preview Avatar */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-gold-500/30 bg-white flex items-center justify-center flex-shrink-0 shadow-xs group">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Custom Brand Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-serif font-black text-xl">
                  {formData.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'DG'}
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  {isUploading ? 'Uploading Logo...' : 'Upload Logo from Computer'}
                </Button>

                {formData.logoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Reset to Default Monogram
                  </Button>
                )}
              </div>

              <p className="text-[11px] text-neutral-500">
                Supported formats: PNG, JPG, WebP, SVG. Recommended size: 512x512 square logo.
              </p>
            </div>
          </div>

          {/* Optional Direct URL Input */}
          <div className="pt-2 border-t border-neutral-200">
            <Input
              label="Or Paste Logo Image URL directly:"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl || ''}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            />
          </div>
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 pt-4 pb-3 border-b border-neutral-100 flex items-center gap-2">
          <Phone className="w-4 h-4 text-gold-600" />
          Contact & Legal Headquarters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer Support Hotline"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="Official Support Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>

        <Input
          label="Vault & Flagship Boutique Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          leftIcon={<MapPin className="w-4 h-4" />}
        />

        {/* SHOPPING CART & ORDER LIMITATION SETTINGS */}
        <div className="space-y-4 pt-4 border-t border-neutral-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gold-600" />
              Shopping Cart & Order Item Limitations
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Configure maximum quantity limits to protect high-value solid gold inventory and prevent bulk hoarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl bg-[#FCFCF9] border border-gold-500/20">
            {/* Limit 1: Max Quantity Per Item */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  Max Quantity Per Single Item
                </label>
                <span className="font-mono text-xs font-bold text-gold-700 bg-gold-500/15 px-2 py-0.5 rounded-md">
                  {formData.maxCartQuantityPerItem || 50} pcs
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData({ ...formData, maxCartQuantityPerItem: preset })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                      formData.maxCartQuantityPerItem === preset
                        ? 'bg-gold-500 text-white border-gold-500 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-gold-500'
                    }`}
                  >
                    {preset} pcs
                  </button>
                ))}
              </div>

              <Input
                label="Or Custom Limit Per Item (pcs):"
                type="number"
                min="1"
                max="500"
                value={formData.maxCartQuantityPerItem || 50}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxCartQuantityPerItem: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-neutral-500 leading-snug">
                Maximum units of a specific ring, chain, or bracelet that one customer can add.
              </p>
            </div>

            {/* Limit 2: Max Total Cart Quantity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  Max Total Items in Shopping Bag
                </label>
                <span className="font-mono text-xs font-bold text-gold-700 bg-gold-500/15 px-2 py-0.5 rounded-md">
                  {formData.maxCartTotalItems || 100} pcs
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {[25, 50, 100, 200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData({ ...formData, maxCartTotalItems: preset })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                      formData.maxCartTotalItems === preset
                        ? 'bg-gold-500 text-white border-gold-500 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-gold-500'
                    }`}
                  >
                    {preset} pcs
                  </button>
                ))}
              </div>

              <Input
                label="Or Custom Total Cart Cap (pcs):"
                type="number"
                min="1"
                max="1000"
                value={formData.maxCartTotalItems || 100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxCartTotalItems: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-neutral-500 leading-snug">
                Overall maximum piece count permitted across all items combined in a single checkout.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            className="text-xs font-bold uppercase tracking-wider"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Branding & Theme Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
