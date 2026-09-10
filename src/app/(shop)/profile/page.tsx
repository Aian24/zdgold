'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Building,
  Hash,
  Save,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shield,
  Check,
  Lock,
  FileText,
  Gem,
  ArrowRight,
} from 'lucide-react';
import { useAuth, useSettings } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const PRESET_AVATARS = [
  { label: 'Executive Gold', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
  { label: 'Classic Gent', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
  { label: 'Luxury Pearl', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
  { label: 'Modern Minimal', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400' },
];

export default function ProfileSettingsPage() {
  const { user, openAuthModal, loginCustom } = useAuth();
  const { settings } = useSettings();

  const [profName, setProfName] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profAddress, setProfAddress] = useState('');
  const [profCity, setProfCity] = useState('Metro Manila');
  const [profZipCode, setProfZipCode] = useState('');
  const [profAvatar, setProfAvatar] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfName(user.name || '');
      setProfEmail(user.email || '');
      setProfPhone(user.phone || '');
      setProfAddress(user.address || '');
      setProfCity(user.city || 'Metro Manila');
      setProfZipCode(user.zipCode || '');
      setProfAvatar(user.avatar || '');
    }
  }, [user]);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setProfAvatar(data.url);
        setProfileSuccessMsg('Photo uploaded! Click "Save Profile Changes" to save.');
      } else {
        setProfileErrorMsg(data.error || 'Failed to upload photo.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setProfileErrorMsg('Network error while uploading image.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName) {
      setProfileErrorMsg('Full legal name is required.');
      return;
    }

    setIsSavingProfile(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          email: profEmail || user?.email,
          name: profName,
          phone: profPhone,
          address: profAddress,
          city: profCity,
          zipCode: profZipCode,
          avatar: profAvatar,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        loginCustom(data.user);
        setProfileSuccessMsg('Profile and delivery details successfully updated!');
      } else {
        setProfileErrorMsg(data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      console.error('Save profile error:', err);
      setProfileErrorMsg('Network error occurred while saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 bg-[#FCFCF9]">
        <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-700 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-neutral-900">
            Sign In to Manage Profile
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Access your profile photo, delivery addresses, and verified contact settings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => openAuthModal('signin')}
            className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider"
          >
            Sign In to Your Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 bg-[#FCFCF9] text-[#1A1A1A]">
      {/* Customer Header Banner */}
      <div className="rounded-3xl bg-white border border-gold-500/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 text-center md:text-left">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border border-gold-500/40 shadow-xs flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/40 flex items-center justify-center text-gold-700 flex-shrink-0 shadow-xs font-serif font-black text-xl">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h1 className="text-xl sm:text-2xl font-black font-serif text-neutral-900">
                {user.name}
              </h1>
              <Badge variant="gold" size="sm">
                {user.role === 'ADMIN' ? 'EXECUTIVE ADMIN' : 'VERIFIED CLIENT'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {user.email} • {user.phone || 'No phone set'} • {user.city || 'Metro Manila'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link href="/layaways">
            <Button variant="secondary" size="sm" leftIcon={<Lock className="w-3.5 h-3.5" />} className="text-xs font-bold">
              Active Layaways
            </Button>
          </Link>

          <Link href="/orders">
            <Button variant="secondary" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />} className="text-xs font-bold">
              Order History
            </Button>
          </Link>

          <Link href="/catalog">
            <Button variant="gold-outline" size="sm" leftIcon={<Gem className="w-3.5 h-3.5" />} className="text-xs font-bold">
              Gold Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Page Title & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-serif text-neutral-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-gold-600" />
            Profile & Account Settings
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your personal profile, display photo, and insured delivery destinations.
          </p>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in duration-200">
        {/* Status Alerts */}
        {profileSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span className="font-bold">{profileSuccessMsg}</span>
          </div>
        )}

        {profileErrorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span className="font-medium">{profileErrorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Account Tier */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-gold-500/30 p-6 space-y-5 shadow-sm text-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 text-left">
                Profile Picture
              </h3>

              {/* Avatar Preview */}
              <div className="relative inline-block mx-auto">
                {profAvatar ? (
                  <img
                    src={profAvatar}
                    alt="Avatar Preview"
                    className="w-28 h-28 rounded-full object-cover border-2 border-gold-500/50 shadow-md mx-auto"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gold-500/15 border-2 border-gold-500/50 flex items-center justify-center text-gold-700 font-serif font-black text-3xl mx-auto shadow-md">
                    {profName.charAt(0) || 'C'}
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-1 right-1 p-2.5 rounded-full bg-gold-500 hover:bg-gold-600 text-white shadow-md transition-all cursor-pointer hover:scale-105"
                  title="Upload New Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploadingAvatar}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="w-full text-xs font-bold"
                >
                  Upload from Device
                </Button>

                <Input
                  label="Or Custom Image URL"
                  placeholder="https://.../photo.jpg"
                  value={profAvatar}
                  onChange={(e) => setProfAvatar(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Preset Avatars */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 text-left">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Luxury Avatar Presets
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setProfAvatar(preset.url)}
                      className={`p-1 rounded-xl border transition-all cursor-pointer ${
                        profAvatar === preset.url
                          ? 'border-gold-500 ring-2 ring-gold-400 bg-gold-50/50'
                          : 'border-neutral-200 hover:border-gold-400'
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-10 h-10 rounded-lg object-cover mx-auto"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="rounded-3xl bg-white border border-gold-500/30 p-6 space-y-3 shadow-sm text-xs">
              <div className="flex items-center gap-2 text-gold-700 font-bold uppercase tracking-wider text-[11px]">
                <Shield className="w-4 h-4 text-gold-600" />
                <span>Security & Verification</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF8F2] border border-gold-500/20 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Access Role:</span>
                  <span className="font-bold text-neutral-900">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Account Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active & Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Personal Info & Shipping Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <div className="rounded-3xl bg-white border border-gold-500/30 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <UserIcon className="w-5 h-5 text-gold-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Legal Name *"
                  placeholder="e.g. Juan dela Cruz"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4 text-neutral-400" />}
                  required
                />

                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
                  required
                />
              </div>

              <Input
                label="Contact Phone Number (+63)"
                placeholder="+63 917 123 4567"
                value={profPhone}
                onChange={(e) => setProfPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-neutral-400" />}
              />
            </div>

            {/* Delivery & Shipping Address */}
            <div className="rounded-3xl bg-white border border-gold-500/30 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <MapPin className="w-5 h-5 text-gold-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Vault & Delivery Address
                </h3>
              </div>

              <p className="text-xs text-neutral-500">
                This address will be automatically used for insured delivery upon completion of your layaway contracts and jewelry orders.
              </p>

              <Input
                label="Street Address / Building / Unit"
                placeholder="e.g. Unit 24B, Grand Hyatt Residences, 8th Avenue"
                value={profAddress}
                onChange={(e) => setProfAddress(e.target.value)}
                leftIcon={<Building className="w-4 h-4 text-neutral-400" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="City / Municipality"
                  placeholder="e.g. Taguig City / Makati"
                  value={profCity}
                  onChange={(e) => setProfCity(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4 text-neutral-400" />}
                />

                <Input
                  label="Postal / ZIP Code"
                  placeholder="e.g. 1634"
                  value={profZipCode}
                  onChange={(e) => setProfZipCode(e.target.value)}
                  leftIcon={<Hash className="w-4 h-4 text-neutral-400" />}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSavingProfile}
                leftIcon={<Save className="w-4 h-4" />}
                className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider px-8"
              >
                Save Profile Changes
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
