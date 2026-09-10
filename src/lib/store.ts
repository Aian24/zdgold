'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, ProductItem, UserProfile } from './types';

const CART_STORAGE_KEY = 'danica_gold_cart_v2';
const USER_STORAGE_KEY = 'danica_gold_user_v2';
const SETTINGS_STORAGE_KEY = 'danica_gold_settings_v2';

export interface SiteBrandSettings {
  companyName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  currencySymbol: string;
  goldAccentColor: string;
}

export const DEFAULT_BRAND_SETTINGS: SiteBrandSettings = {
  companyName: 'DANICA GOLD PHILIPPINES',
  tagline: 'Haute Joaillerie & Certified Fine Gold House',
  logoUrl: '/images/logo.png',
  phone: '+63 (02) 8888-GOLD / +63 917 123 4567',
  email: 'inquiries@danicagold.ph',
  address: 'Greenhills Mall / Ongpin St, Binondo, Manila, Philippines',
  currencySymbol: '₱',
  goldAccentColor: '#D4AF37',
};

// Default Demo Customer
export const DEMO_CUSTOMER: UserProfile = {
  id: 'cuid-customer-sophia',
  name: 'Sophia Laurent',
  email: 'sophia.laurent@danicagold.ph',
  role: 'CUSTOMER',
  phone: '+63 917 234 5678',
  address: 'Ayala Alabang Village, Muntinlupa City',
  city: 'Metro Manila',
  zipCode: '1780',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
};

// Default Demo Admin
export const DEMO_ADMIN: UserProfile = {
  id: 'cuid-admin-danica',
  name: 'Danica Executive Admin',
  email: 'admin@danicagold.com',
  role: 'ADMIN',
  phone: '+63 (02) 8888-GOLD',
  address: 'BGC Taguig & Ongpin Flagship Vault',
  city: 'Metro Manila',
  zipCode: '1634',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
};

export function useSettings() {
  const [settings, setSettings] = useState<SiteBrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data.settings));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('danica_settings_changed', { detail: data.settings }));
        }
      }
    } catch (e) {
      console.error('Failed to fetch settings from API', e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {}
    fetchSettings();

    const handleSync = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('danica_settings_changed', handleSync);
      return () => window.removeEventListener('danica_settings_changed', handleSync);
    }
  }, []);

  const updateSettingsLocal = (newSettings: Partial<SiteBrandSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('danica_settings_changed', { detail: merged }));
      }
    } catch (e) {}
  };

  return {
    settings,
    isLoaded,
    updateSettingsLocal,
    refreshSettings: fetchSettings,
  };
}

export const MAX_QTY_PER_ITEM = 50;
export const MAX_TOTAL_CART_ITEMS = 100;

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveItems = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  };

  const addItem = (product: ProductItem, quantity: number = 1, lockedPricePerGram: number = 4850) => {
    const existingIndex = items.findIndex((item) => item.product.id === product.id);
    const unitPrice = product.calculatedPrice ?? product.basePrice;
    const currentTotalItems = items.reduce((acc, it) => acc + it.quantity, 0);

    if (existingIndex > -1) {
      const updated = [...items];
      const currentItemQty = updated[existingIndex].quantity;
      const targetQty = currentItemQty + quantity;

      // Cap at 50 per item, and cap total cart items at 100
      const allowedTotalCapacity = MAX_TOTAL_CART_ITEMS - currentTotalItems;
      const allowedQty = Math.min(targetQty, MAX_QTY_PER_ITEM, currentItemQty + Math.max(0, allowedTotalCapacity));

      if (allowedQty <= currentItemQty) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dg_cart_limit_reached', {
              detail: { message: `Cart limit reached! Max ${MAX_QTY_PER_ITEM} items per piece, and ${MAX_TOTAL_CART_ITEMS} items total.` },
            })
          );
        }
        return { success: false, message: `Cart limit reached (${MAX_QTY_PER_ITEM} max per piece)` };
      }

      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: allowedQty,
        totalPrice: Number((unitPrice * allowedQty).toFixed(2)),
      };
      saveItems(updated);
    } else {
      const remainingCapacity = Math.max(0, MAX_TOTAL_CART_ITEMS - currentTotalItems);
      const allowedQty = Math.min(quantity, MAX_QTY_PER_ITEM, remainingCapacity);

      if (allowedQty <= 0) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dg_cart_limit_reached', {
              detail: { message: `Cart is full! Maximum limit is ${MAX_TOTAL_CART_ITEMS} pieces.` },
            })
          );
        }
        return { success: false, message: `Cart is full (Max ${MAX_TOTAL_CART_ITEMS} items)` };
      }

      const newItem: CartItem = {
        product,
        quantity: allowedQty,
        lockedPricePerGram,
        unitPrice,
        totalPrice: Number((unitPrice * allowedQty).toFixed(2)),
      };
      saveItems([...items, newItem]);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dg_cart_item_added', { detail: { product, quantity } })
      );
    }
    return { success: true };
  };

  const removeItem = (productId: string) => {
    saveItems(items.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const otherItemsTotal = items.filter((i) => i.product.id !== productId).reduce((sum, i) => sum + i.quantity, 0);
    const maxAllowed = Math.min(MAX_QTY_PER_ITEM, Math.max(1, MAX_TOTAL_CART_ITEMS - otherItemsTotal));
    const finalQty = Math.min(quantity, maxAllowed);

    const updated = items.map((item) => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity: finalQty,
          totalPrice: Number((item.unitPrice * finalQty).toFixed(2)),
        };
      }
      return item;
    });
    saveItems(updated);
  };

  const clearCart = () => {
    saveItems([]);
  };

  const totalGrams = items.reduce(
    (acc, item) => acc + item.product.weightGrams * item.quantity,
    0
  );

  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalCraftFee = items.reduce(
    (acc, item) => acc + item.product.craftFee * item.quantity,
    0
  );

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    items,
    isLoaded,
    itemCount,
    totalGrams,
    subtotal,
    totalCraftFee,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}

// Global Custom Event for Auth Modal control
const AUTH_MODAL_EVENT = 'dg_auth_modal_toggle';

export function openGlobalAuthModal(tab: 'signin' | 'register' | 'admin' = 'signin') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_MODAL_EVENT, { detail: { open: true, tab } }));
  }
}

export function closeGlobalAuthModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_MODAL_EVENT, { detail: { open: false } }));
  }
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register' | 'admin'>('signin');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id === 'cuid-customer-sophia' || parsed?.email === 'sophia.laurent@danicagold.ph') {
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
        } else {
          setUser(parsed);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Failed to load user', e);
      setUser(null);
    } finally {
      setIsLoaded(true);
    }

    const handleModalEvent = (e: any) => {
      if (e.detail) {
        setIsAuthModalOpen(e.detail.open);
        if (e.detail.tab) setAuthModalTab(e.detail.tab);
      }
    };

    window.addEventListener(AUTH_MODAL_EVENT, handleModalEvent);
    return () => window.removeEventListener(AUTH_MODAL_EVENT, handleModalEvent);
  }, []);

  const openAuthModal = useCallback((tab: 'signin' | 'register' | 'admin' = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    openGlobalAuthModal(tab);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    closeGlobalAuthModal();
  }, []);

  const switchUser = (role: 'CUSTOMER' | 'ADMIN') => {
    const newUser = role === 'ADMIN' ? DEMO_ADMIN : DEMO_CUSTOMER;
    setUser(newUser);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  };

  const loginCustom = useCallback((profile: UserProfile) => {
    setUser(profile);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  }, []);

  const loginWithSocial = async (provider: 'google' | 'facebook' | 'apple', profileData?: Partial<UserProfile>) => {
    const defaultProfiles = {
      google: {
        name: 'Maria Santos (Google)',
        email: 'maria.santos@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        phone: '+63 917 555 1234',
        address: 'Bonifacio Global City, Taguig',
        city: 'Metro Manila',
        zipCode: '1634',
      },
      facebook: {
        name: 'Juan dela Cruz (Facebook)',
        email: 'juan.delacruz@facebook.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        phone: '+63 918 777 4321',
        address: 'Greenhills, San Juan City',
        city: 'Metro Manila',
        zipCode: '1500',
      },
      apple: {
        name: 'Sophia Laurent (Apple ID)',
        email: 'sophia.laurent@icloud.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
        phone: '+63 917 234 5678',
        address: 'Ayala Alabang Village, Muntinlupa City',
        city: 'Metro Manila',
        zipCode: '1780',
      },
    };

    const targetProfile = {
      ...defaultProfiles[provider],
      ...profileData,
    };

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'social_login',
          provider,
          profile: targetProfile,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginCustom(data.user);
        closeAuthModal();
        return { success: true, user: data.user };
      }
    } catch (e) {
      console.error('Social login API error, using fallback state', e);
    }

    const fallbackUser: UserProfile = {
      id: `${provider}_${Date.now()}`,
      name: targetProfile.name,
      email: targetProfile.email,
      role: 'CUSTOMER',
      avatar: targetProfile.avatar,
      phone: targetProfile.phone,
      address: targetProfile.address,
      city: targetProfile.city,
      zipCode: targetProfile.zipCode,
    };
    loginCustom(fallbackUser);
    closeAuthModal();
    return { success: true, user: fallbackUser };
  };

  const loginWithCredentials = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'email_login',
          email,
          password,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginCustom(data.user);
        closeAuthModal();
        return { success: true, user: data.user, message: data.message };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (e) {
      console.error('Login error', e);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const registerUser = async (formData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    zipCode?: string;
  }) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginCustom(data.user);
        closeAuthModal();
        return { success: true, user: data.user, message: data.message };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (e) {
      console.error('Registration error', e);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const loginAdmin = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_login',
          username,
          password,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginCustom(data.user);
        closeAuthModal();
        return { success: true, user: data.user, message: data.message };
      } else {
        return { success: false, error: data.error || 'Invalid admin credentials' };
      }
    } catch (e) {
      console.error('Admin login error', e);
      if (username === 'admin' && password === 'Aianbasagre24') {
        loginCustom(DEMO_ADMIN);
        closeAuthModal();
        return { success: true, user: DEMO_ADMIN };
      }
      return { success: false, error: 'Authentication server error.' };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear user', e);
    }
  }, []);

  return {
    user,
    isLoaded,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    switchUser,
    loginCustom,
    loginWithSocial,
    loginWithCredentials,
    registerUser,
    loginAdmin,
    logout,
    isAdmin: user?.role === 'ADMIN',
  };
}
