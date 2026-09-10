'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeConfig, DEFAULT_THEME, THEME_PRESETS, generateCssVariables } from '@/lib/theme';

interface ThemeContextType {
  theme: ThemeConfig;
  isLoaded: boolean;
  isSaving: boolean;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  setFullTheme: (newTheme: ThemeConfig) => void;
  applyPreset: (presetId: string) => void;
  saveTheme: (customTheme?: ThemeConfig) => Promise<{ success: boolean; error?: string }>;
  resetTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'danica_theme_config_v2';
const THEME_SYNC_EVENT = 'danica_theme_changed';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(DEFAULT_THEME);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Apply CSS variables to document
  const applyCssToDom = useCallback((themeToApply: ThemeConfig) => {
    if (typeof document === 'undefined') return;

    let styleEl = document.getElementById('danica-dynamic-theme-vars') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'danica-dynamic-theme-vars';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = generateCssVariables(themeToApply);
  }, []);

  // Apply dynamic browser tab title & favicon
  const applyBrandToDom = useCallback((brand: { companyName?: string; tagline?: string; logoUrl?: string }) => {
    if (typeof document === 'undefined') return;

    if (brand.companyName) {
      const titleText = brand.tagline ? `${brand.companyName} | ${brand.tagline}` : brand.companyName;
      document.title = titleText;
    }

    if (brand.logoUrl) {
      const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (iconLinks.length > 0) {
        iconLinks.forEach((link) => {
          link.href = brand.logoUrl!;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = brand.logoUrl;
        document.head.appendChild(link);
      }
    }
  }, []);

  // Update state, storage, and DOM
  const setFullTheme = useCallback(
    (newTheme: ThemeConfig) => {
      setThemeState(newTheme);
      applyCssToDom(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newTheme));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(THEME_SYNC_EVENT, { detail: newTheme }));
        }
      } catch (e) {
        console.error('Failed to save theme to localStorage', e);
      }
    },
    [applyCssToDom]
  );

  const updateTheme = useCallback(
    (updates: Partial<ThemeConfig>) => {
      setThemeState((prev) => {
        const next = { ...prev, ...updates };
        applyCssToDom(next);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(THEME_SYNC_EVENT, { detail: next }));
          }
        } catch (e) {}
        return next;
      });
    },
    [applyCssToDom]
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = THEME_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setFullTheme(preset.theme);
      }
    },
    [setFullTheme]
  );

  // Fetch saved theme from server
  const fetchServerTheme = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/theme');
      const data = await res.json();
      if (data.success && data.theme) {
        const merged = { ...DEFAULT_THEME, ...data.theme };
        setThemeState(merged);
        applyCssToDom(merged);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error fetching theme from API', e);
    } finally {
      setIsLoaded(true);
    }
  }, [applyCssToDom]);

  // Persist theme to database
  const saveTheme = async (customTheme?: ThemeConfig) => {
    const targetTheme = customTheme || theme;
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: targetTheme }),
      });
      const data = await res.json();
      if (data.success) {
        setFullTheme(targetTheme);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to persist theme' };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error saving theme' };
    } finally {
      setIsSaving(false);
    }
  };

  const resetTheme = async () => {
    await saveTheme(DEFAULT_THEME);
  };

  // Initial load
  useEffect(() => {
    try {
      const cached = localStorage.getItem(THEME_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const merged = { ...DEFAULT_THEME, ...parsed };
        setThemeState(merged);
        applyCssToDom(merged);
      } else {
        applyCssToDom(DEFAULT_THEME);
      }
    } catch (e) {}

    // Load initial brand settings
    try {
      const storedSettings = localStorage.getItem('danica_gold_settings_v2');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        applyBrandToDom(parsed);
      }
    } catch (e) {}

    fetchServerTheme();

    // Fetch site branding settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          applyBrandToDom(data.settings);
          try {
            localStorage.setItem('danica_gold_settings_v2', JSON.stringify(data.settings));
          } catch (e) {}
        }
      })
      .catch(() => {});

    const handleSync = (e: any) => {
      if (e.detail) {
        setThemeState(e.detail);
        applyCssToDom(e.detail);
      }
    };

    const handleBrandSync = (e: any) => {
      if (e.detail) {
        applyBrandToDom(e.detail);
      }
    };

    window.addEventListener(THEME_SYNC_EVENT, handleSync);
    window.addEventListener('danica_settings_changed', handleBrandSync);
    return () => {
      window.removeEventListener(THEME_SYNC_EVENT, handleSync);
      window.removeEventListener('danica_settings_changed', handleBrandSync);
    };
  }, [applyCssToDom, applyBrandToDom, fetchServerTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLoaded,
        isSaving,
        updateTheme,
        setFullTheme,
        applyPreset,
        saveTheme,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
