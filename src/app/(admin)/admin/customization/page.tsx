'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Type,
  Table as TableIcon,
  LayoutTemplate,
  Sparkles,
  Save,
  RotateCcw,
  Download,
  Upload,
  Check,
  Eye,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  Lock,
  Sliders,
  Trash2,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import {
  ThemeConfig,
  THEME_PRESETS,
  AVAILABLE_HEADING_FONTS,
  AVAILABLE_BODY_FONTS,
  DEFAULT_THEME,
} from '@/lib/theme';
import { showSuccessAlert, showErrorAlert, showToast, showConfirmDialog } from '@/lib/swal';
import { FadeInUp } from '@/components/animations/Motion';

export default function AdminCustomizationPage() {
  const { theme, updateTheme, setFullTheme, applyPreset, saveTheme, resetTheme, isSaving } = useTheme();
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'buttons' | 'tables' | 'typography' | 'surfaces'>('presets');
  const [previewTab, setPreviewTab] = useState<'table' | 'cards' | 'typography' | 'buttons'>('table');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper color input component with guaranteed contrast in all themes
  const ColorControl = ({
    label,
    value,
    onChange,
    description,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    description?: string;
  }) => {
    return (
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3"
        style={{
          backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
          borderColor: 'var(--theme-border-card, #E8DFCA)',
        }}
      >
        <div>
          <label
            className="text-xs font-bold block"
            style={{ color: 'var(--theme-text-primary, #171717)' }}
          >
            {label}
          </label>
          {description && (
            <p
              className="text-[11px] mt-0.5"
              style={{ color: 'var(--theme-text-muted, #787878)' }}
            >
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-24 px-2.5 py-1 text-xs font-mono font-bold rounded-lg uppercase focus:outline-none border shadow-2xs"
            style={{
              backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
              color: 'var(--theme-text-primary, #171717)',
              borderColor: 'var(--theme-border-card, #E8DFCA)',
            }}
          />
          <div
            className="relative w-8 h-8 rounded-lg overflow-hidden border shadow-xs cursor-pointer flex-shrink-0"
            style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}
          >
            <input
              type="color"
              value={value.startsWith('#') ? value.slice(0, 7) : '#D4AF37'}
              onChange={(e) => onChange(e.target.value)}
              className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    const result = await saveTheme();
    if (result.success) {
      await showSuccessAlert(
        'Customization Applied!',
        'Your custom colors, table styles, and typography have been saved and applied across the entire system.'
      );
    } else {
      await showErrorAlert('Save Failed', result.error || 'Failed to save theme settings.');
    }
  };

  const handleReset = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Reset All Customizations?',
      text: 'This will revert all system colors, typography, tables, and card styles back to the factory Danica Royal Gold theme.',
      confirmButtonText: 'Yes, Reset Theme',
      isDanger: true,
    });
    if (confirmed) {
      await resetTheme();
      showToast('Theme restored to factory defaults.', 'info');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(theme, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `danica-gold-theme-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Theme exported as JSON file.', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && typeof imported === 'object') {
          setFullTheme({ ...DEFAULT_THEME, ...imported });
          showToast('Theme imported! Click Save to apply permanently.', 'success');
        }
      } catch (err) {
        showErrorAlert('Invalid File', 'The uploaded file is not a valid theme JSON configuration.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Actions */}
      <FadeInUp>
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--theme-border-card, rgba(212,175,55,0.2))' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="p-1 rounded-md"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  color: 'var(--theme-primary, #D4AF37)',
                }}
              >
                <Palette className="w-4 h-4" />
              </span>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--theme-primary, #D4AF37)' }}
              >
                System Appearance Engine
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-black font-serif"
              style={{ color: 'var(--theme-text-primary, #171717)' }}
            >
              Customization Studio
            </h1>
            <p
              className="text-xs sm:text-sm mt-1 max-w-2xl"
              style={{ color: 'var(--theme-text-secondary, #4A4A4A)' }}
            >
              Personalize colors for titles, body text, backgrounds, cards, sidebar, and data table headers & rows. Choose luxury fonts, font sizes, heading weights, and letter-spacing with real-time live preview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              style={{
                backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                borderColor: 'var(--theme-border-card, #CBD5E1)',
                color: 'var(--theme-text-primary, #171717)',
              }}
              title="Import JSON Theme"
            >
              <Upload className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
              <span>Import</span>
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              style={{
                backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                borderColor: 'var(--theme-border-card, #CBD5E1)',
                color: 'var(--theme-text-primary, #171717)',
              }}
              title="Export JSON Theme"
            >
              <Download className="w-3.5 h-3.5" style={{ color: 'var(--theme-text-muted)' }} />
              <span>Export</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 shadow-xs cursor-pointer transition-all bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
              title="Reset to default theme"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--theme-primary, #D4AF37)',
                color: 'var(--theme-primary-text, #FFFFFF)',
              }}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Apply Globally'}</span>
            </motion.button>
          </div>
        </div>
      </FadeInUp>

      {/* Main Studio Grid (Controls on Left, Live Canvas on Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customizer Controls (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Navigation Category Tabs */}
          <div
            className="flex items-center gap-1.5 p-1.5 border rounded-2xl overflow-x-auto shadow-xs"
            style={{
              backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
              borderColor: 'var(--theme-border-card, #E8DFCA)',
            }}
          >
            {[
              { id: 'presets', label: 'Luxury Presets', icon: Sparkles },
              { id: 'colors', label: 'Colors & Backgrounds', icon: Palette },
              { id: 'buttons', label: 'Buttons & Controls', icon: Sliders },
              { id: 'tables', label: 'Data Tables', icon: TableIcon },
              { id: 'typography', label: 'Typography & Fonts', icon: Type },
              { id: 'surfaces', label: 'Cards & Elevation', icon: LayoutTemplate },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
                  style={{
                    backgroundColor: isActive ? 'var(--theme-primary, #D4AF37)' : 'transparent',
                    color: isActive
                      ? 'var(--theme-primary-text, #FFFFFF)'
                      : 'var(--theme-text-secondary, #4A4A4A)',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-4"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-sm font-bold font-serif"
                    style={{ color: 'var(--theme-text-primary, #171717)' }}
                  >
                    Curated Luxury Theme Presets
                  </h3>
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--theme-text-muted, #787878)' }}
                  >
                    1-Click Instant Application
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected =
                      theme.bgMain === preset.theme.bgMain &&
                      theme.primary === preset.theme.primary &&
                      theme.fontHeading === preset.theme.fontHeading;

                    return (
                      <motion.div
                        key={preset.id}
                        whileHover={{ y: -2 }}
                        onClick={() => {
                          applyPreset(preset.id);
                          showToast(`Applied preset: ${preset.name}`, 'info');
                        }}
                        className="p-4 rounded-xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden"
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--theme-bg-card, #FFFFFF)'
                            : 'var(--theme-bg-main, #FCFCF9)',
                          borderColor: isSelected
                            ? 'var(--theme-primary, #D4AF37)'
                            : 'var(--theme-border-card, #E8DFCA)',
                        }}
                      >
                        {isSelected && (
                          <div
                            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs"
                            style={{
                              backgroundColor: 'var(--theme-primary, #D4AF37)',
                              color: 'var(--theme-primary-text, #FFFFFF)',
                            }}
                          >
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        )}

                        <div>
                          <span
                            className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: 'rgba(212, 175, 55, 0.15)',
                              color: 'var(--theme-primary, #D4AF37)',
                            }}
                          >
                            {preset.badge}
                          </span>
                          <h4
                            className="text-sm font-black mt-1.5 font-serif"
                            style={{ color: 'var(--theme-text-primary, #171717)' }}
                          >
                            {preset.name}
                          </h4>
                          <p
                            className="text-[11px] line-clamp-2 mt-0.5"
                            style={{ color: 'var(--theme-text-muted, #787878)' }}
                          >
                            {preset.description}
                          </p>
                        </div>

                        {/* Swatch Previews */}
                        <div
                          className="flex items-center gap-1.5 pt-2 border-t"
                          style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}
                        >
                          {preset.previewColors.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-5 h-5 rounded-full border border-neutral-300 shadow-2xs"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                          <span
                            className="text-[10px] font-mono ml-auto"
                            style={{ color: 'var(--theme-text-muted, #787878)' }}
                          >
                            {preset.theme.fontHeading}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: COLORS & BACKGROUNDS */}
          {activeTab === 'colors' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Backgrounds & Canvas */}
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-3"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <h3
                  className="text-sm font-bold font-serif mb-2"
                  style={{ color: 'var(--theme-text-primary, #171717)' }}
                >
                  1. Page, Sidebar & Header Backgrounds
                </h3>
                <div className="space-y-2.5">
                  <ColorControl
                    label="Page Background"
                    description="Main background behind all pages and app canvas"
                    value={theme.bgMain}
                    onChange={(bgMain) => updateTheme({ bgMain })}
                  />
                  <ColorControl
                    label="Sidebar Background"
                    description="Admin sidebar navigation panel background"
                    value={theme.sidebarBg}
                    onChange={(sidebarBg) => updateTheme({ sidebarBg })}
                  />
                  <ColorControl
                    label="Sidebar Text Color"
                    description="Sidebar links, labels, and text color"
                    value={theme.sidebarText}
                    onChange={(sidebarText) => updateTheme({ sidebarText })}
                  />
                  <ColorControl
                    label="Header / Topbar Background"
                    description="Mobile top bar and sticky header"
                    value={theme.topbarBg}
                    onChange={(topbarBg) => updateTheme({ topbarBg })}
                  />
                </div>
              </div>

              {/* Typography Colors */}
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-3"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <h3
                  className="text-sm font-bold font-serif mb-2"
                  style={{ color: 'var(--theme-text-primary, #171717)' }}
                >
                  2. Text & Typography Colors
                </h3>
                <div className="space-y-2.5">
                  <ColorControl
                    label="Primary Title & Headings"
                    description="H1, H2, H3, card titles, and bold headers"
                    value={theme.textPrimary}
                    onChange={(textPrimary) => updateTheme({ textPrimary })}
                  />
                  <ColorControl
                    label="Body Text Color"
                    description="Standard paragraphs, table content, and descriptions"
                    value={theme.textSecondary}
                    onChange={(textSecondary) => updateTheme({ textSecondary })}
                  />
                  <ColorControl
                    label="Muted / Metadata Text"
                    description="Subtitles, dates, helper texts, and captions"
                    value={theme.textMuted}
                    onChange={(textMuted) => updateTheme({ textMuted })}
                  />
                </div>
              </div>

              {/* Brand & Accent Colors */}
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-3"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <h3
                  className="text-sm font-bold font-serif mb-2"
                  style={{ color: 'var(--theme-text-primary, #171717)' }}
                >
                  3. Brand Accent & Highlights
                </h3>
                <div className="space-y-2.5">
                  <ColorControl
                    label="Primary Brand / Gold Accent"
                    description="Main gold color for badges, icons, and highlights"
                    value={theme.primary}
                    onChange={(primary) => updateTheme({ primary })}
                  />
                  <ColorControl
                    label="Secondary Accent"
                    description="Secondary highlight badges and borders"
                    value={theme.accent}
                    onChange={(accent) => updateTheme({ accent })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: BUTTONS & CONTROLS */}
          {activeTab === 'buttons' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 1. Primary Buttons */}
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-3"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <div>
                  <h3
                    className="text-sm font-bold font-serif"
                    style={{ color: 'var(--theme-text-primary, #171717)' }}
                  >
                    1. Primary Action Buttons
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--theme-text-muted, #787878)' }}
                  >
                    Main call-to-action buttons (Save, Add New Product, Create Plan).
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <ColorControl
                    label="Primary Button Background"
                    description="Main background fill for primary gold buttons"
                    value={theme.btnPrimaryBg || theme.primary || '#D4AF37'}
                    onChange={(btnPrimaryBg) => updateTheme({ btnPrimaryBg })}
                  />
                  <ColorControl
                    label="Primary Button Text Color"
                    description="Text and icon color inside primary buttons"
                    value={theme.btnPrimaryText || theme.primaryText || '#FFFFFF'}
                    onChange={(btnPrimaryText) => updateTheme({ btnPrimaryText })}
                  />
                  <ColorControl
                    label="Primary Button Hover Background"
                    description="Background color when hovering over primary buttons"
                    value={theme.btnPrimaryHover || theme.primaryHover || '#C59B27'}
                    onChange={(btnPrimaryHover) => updateTheme({ btnPrimaryHover })}
                  />
                </div>
              </div>

              {/* 2. Secondary & Outline Buttons */}
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-3"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <div>
                  <h3
                    className="text-sm font-bold font-serif"
                    style={{ color: 'var(--theme-text-primary, #171717)' }}
                  >
                    2. Secondary & Outline Buttons
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--theme-text-muted, #787878)' }}
                  >
                    Secondary actions (Cancel, Refresh, Filters, Import/Export).
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <ColorControl
                    label="Secondary Button Background"
                    description="Background fill for secondary buttons"
                    value={theme.btnSecondaryBg || '#FFFFFF'}
                    onChange={(btnSecondaryBg) => updateTheme({ btnSecondaryBg })}
                  />
                  <ColorControl
                    label="Secondary Button Text Color"
                    description="Text color inside secondary buttons"
                    value={theme.btnSecondaryText || theme.textPrimary || '#171717'}
                    onChange={(btnSecondaryText) => updateTheme({ btnSecondaryText })}
                  />
                  <ColorControl
                    label="Secondary Button Border Color"
                    description="Outline border color for secondary buttons"
                    value={theme.btnSecondaryBorder || theme.borderCard || '#E8DFCA'}
                    onChange={(btnSecondaryBorder) => updateTheme({ btnSecondaryBorder })}
                  />
                </div>
              </div>

              {/* 3. Danger Buttons & Corner Radius */}
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-4"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <div>
                  <h3
                    className="text-sm font-bold font-serif"
                    style={{ color: 'var(--theme-text-primary, #171717)' }}
                  >
                    3. Danger Actions & Button Shape
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--theme-text-muted, #787878)' }}
                  >
                    Destructive actions (Delete) and global button corner curvature.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <ColorControl
                    label="Danger / Delete Button Background"
                    description="Background fill for delete and destructive action buttons"
                    value={theme.btnDangerBg || '#DC2626'}
                    onChange={(btnDangerBg) => updateTheme({ btnDangerBg })}
                  />

                  <div
                    className="pt-3 border-t"
                    style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}
                  >
                    <label
                      className="block text-xs font-bold uppercase mb-1.5"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Button Corner Curvature / Radius
                    </label>
                    <select
                      value={theme.btnRadius || '12px'}
                      onChange={(e) => updateTheme({ btnRadius: e.target.value as any })}
                      className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                      style={{
                        backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                        borderColor: 'var(--theme-border-card, #E8DFCA)',
                        color: 'var(--theme-text-primary, #171717)',
                      }}
                    >
                      <option value="6px">6px - Sharp / Crisp</option>
                      <option value="8px">8px - Modern Rounded</option>
                      <option value="12px">12px - Standard Luxury (Default)</option>
                      <option value="16px">16px - Smooth Rounded</option>
                      <option value="9999px">9999px - Full Pill Shape</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: DATA TABLES */}
          {activeTab === 'tables' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-3"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <div>
                  <h3
                    className="text-sm font-bold font-serif"
                    style={{ color: 'var(--theme-text-primary, #171717)' }}
                  >
                    Data Table Headers & Rows
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--theme-text-muted, #787878)' }}
                  >
                    Customize the styling for ledgers, product lists, receipts, and order tables.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <ColorControl
                    label="Table Header Background (thead)"
                    description="Header row background color"
                    value={theme.tableHeaderBg}
                    onChange={(tableHeaderBg) => updateTheme({ tableHeaderBg })}
                  />
                  <ColorControl
                    label="Table Header Text (th)"
                    description="Column title and header font color"
                    value={theme.tableHeaderText}
                    onChange={(tableHeaderText) => updateTheme({ tableHeaderText })}
                  />
                  <ColorControl
                    label="Table Row Background (tr)"
                    description="Standard row background"
                    value={theme.tableRowBg}
                    onChange={(tableRowBg) => updateTheme({ tableRowBg })}
                  />
                  <ColorControl
                    label="Alternating Row Background (zebra)"
                    description="Even/odd alternating row striping"
                    value={theme.tableRowAlt}
                    onChange={(tableRowAlt) => updateTheme({ tableRowAlt })}
                  />
                  <ColorControl
                    label="Row Hover Background"
                    description="Highlight color when cursor hovers on a table row"
                    value={theme.tableRowHover}
                    onChange={(tableRowHover) => updateTheme({ tableRowHover })}
                  />
                  <ColorControl
                    label="Table Border / Divider"
                    description="Borders separating columns and rows"
                    value={theme.tableBorder}
                    onChange={(tableBorder) => updateTheme({ tableBorder })}
                  />
                  <ColorControl
                    label="Table Cell Text Color (td)"
                    description="Default text color inside table data cells"
                    value={theme.tableText}
                    onChange={(tableText) => updateTheme({ tableText })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: TYPOGRAPHY & FONTS */}
          {activeTab === 'typography' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Font Families */}
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-4"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <h3
                  className="text-sm font-bold font-serif"
                  style={{ color: 'var(--theme-text-primary, #171717)' }}
                >
                  1. Font Families (Google Fonts)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1.5"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Heading Font Style
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AVAILABLE_HEADING_FONTS.map((font) => {
                        const isSelected = theme.fontHeading === font.name;
                        return (
                          <button
                            key={font.name}
                            type="button"
                            onClick={() => updateTheme({ fontHeading: font.name })}
                            className="p-3 rounded-xl border text-left transition-all cursor-pointer"
                            style={{
                              backgroundColor: isSelected
                                ? 'var(--theme-bg-main, #FCFCF9)'
                                : 'var(--theme-bg-card, #FFFFFF)',
                              borderColor: isSelected
                                ? 'var(--theme-primary, #D4AF37)'
                                : 'var(--theme-border-card, #E8DFCA)',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="text-sm font-bold"
                                style={{
                                  fontFamily: font.family,
                                  color: 'var(--theme-text-primary, #171717)',
                                }}
                              >
                                {font.name}
                              </span>
                              {isSelected && (
                                <Check
                                  className="w-4 h-4"
                                  style={{ color: 'var(--theme-primary, #D4AF37)' }}
                                />
                              )}
                            </div>
                            <span
                              className="text-[10px] block mt-0.5 font-sans"
                              style={{ color: 'var(--theme-text-muted, #787878)' }}
                            >
                              {font.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className="pt-3 border-t"
                    style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}
                  >
                    <label
                      className="block text-xs font-bold uppercase mb-1.5"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Body & Interface Font Family
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AVAILABLE_BODY_FONTS.map((font) => {
                        const isSelected = theme.fontBody === font.name;
                        return (
                          <button
                            key={font.name}
                            type="button"
                            onClick={() => updateTheme({ fontBody: font.name })}
                            className="p-2.5 rounded-xl border text-center transition-all cursor-pointer"
                            style={{
                              backgroundColor: isSelected
                                ? 'var(--theme-bg-main, #FCFCF9)'
                                : 'var(--theme-bg-card, #FFFFFF)',
                              borderColor: isSelected
                                ? 'var(--theme-primary, #D4AF37)'
                                : 'var(--theme-border-card, #E8DFCA)',
                              color: 'var(--theme-text-primary, #171717)',
                              fontWeight: isSelected ? 'bold' : 'normal',
                            }}
                          >
                            <span className="text-xs block" style={{ fontFamily: font.family }}>
                              {font.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Scales & Sizing */}
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-4"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <h3
                  className="text-sm font-bold font-serif"
                  style={{ color: 'var(--theme-text-primary, #171717)' }}
                >
                  2. Font Sizing & Typography Scales
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Base Body Font Size
                    </label>
                    <select
                      value={theme.fontSizeBase}
                      onChange={(e) => updateTheme({ fontSizeBase: e.target.value as any })}
                      className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                      style={{
                        backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                        borderColor: 'var(--theme-border-card, #E8DFCA)',
                        color: 'var(--theme-text-primary, #171717)',
                      }}
                    >
                      <option value="13px">13px - Compact</option>
                      <option value="14px">14px - Standard</option>
                      <option value="15px">15px - Comfortable</option>
                      <option value="16px">16px - Large</option>
                      <option value="17px">17px - Extra Large</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Heading Scale
                    </label>
                    <select
                      value={theme.fontSizeH1Scale}
                      onChange={(e) => updateTheme({ fontSizeH1Scale: e.target.value as any })}
                      className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                      style={{
                        backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                        borderColor: 'var(--theme-border-card, #E8DFCA)',
                        color: 'var(--theme-text-primary, #171717)',
                      }}
                    >
                      <option value="0.85">0.85x - Subtle / Sleek</option>
                      <option value="1.0">1.0x - Standard</option>
                      <option value="1.15">1.15x - Prominent</option>
                      <option value="1.3">1.3x - Grand / Dramatic</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Table Cell Font Size
                    </label>
                    <select
                      value={theme.fontSizeTable}
                      onChange={(e) => updateTheme({ fontSizeTable: e.target.value as any })}
                      className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                      style={{
                        backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                        borderColor: 'var(--theme-border-card, #E8DFCA)',
                        color: 'var(--theme-text-primary, #171717)',
                      }}
                    >
                      <option value="11px">11px - Micro / Compact</option>
                      <option value="12px">12px - Standard</option>
                      <option value="13px">13px - Medium</option>
                      <option value="14px">14px - Large</option>
                    </select>
                  </div>
                </div>

                <div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t"
                  style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}
                >
                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Heading Font Weight
                    </label>
                    <select
                      value={theme.headingWeight}
                      onChange={(e) => updateTheme({ headingWeight: e.target.value as any })}
                      className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                      style={{
                        backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                        borderColor: 'var(--theme-border-card, #E8DFCA)',
                        color: 'var(--theme-text-primary, #171717)',
                      }}
                    >
                      <option value="400">400 - Regular</option>
                      <option value="500">500 - Medium</option>
                      <option value="600">600 - Semi-Bold</option>
                      <option value="700">700 - Bold</option>
                      <option value="800">800 - Extra Bold</option>
                      <option value="900">900 - Black / Heavy</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Heading Letter Spacing
                    </label>
                    <select
                      value={theme.headingLetterSpacing}
                      onChange={(e) => updateTheme({ headingLetterSpacing: e.target.value as any })}
                      className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                      style={{
                        backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                        borderColor: 'var(--theme-border-card, #E8DFCA)',
                        color: 'var(--theme-text-primary, #171717)',
                      }}
                    >
                      <option value="-0.02em">-0.02em - Tight Modern</option>
                      <option value="0">0.00em - Normal</option>
                      <option value="0.03em">+0.03em - Subtle</option>
                      <option value="0.06em">+0.06em - Wide Luxury</option>
                      <option value="0.12em">+0.12em - Haute Spaced</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold uppercase mb-1"
                      style={{ color: 'var(--theme-text-primary, #171717)' }}
                    >
                      Heading Text Transform
                    </label>
                    <select
                      value={theme.headingTransform}
                      onChange={(e) => updateTheme({ headingTransform: e.target.value as any })}
                      className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                      style={{
                        backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                        borderColor: 'var(--theme-border-card, #E8DFCA)',
                        color: 'var(--theme-text-primary, #171717)',
                      }}
                    >
                      <option value="none">As Typed (Standard)</option>
                      <option value="uppercase">UPPERCASE (ALL CAPS)</option>
                      <option value="capitalize">Capitalize Each Word</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: SURFACES & CARDS */}
          {activeTab === 'surfaces' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div
                className="p-5 rounded-2xl border shadow-xs space-y-4"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                <h3
                  className="text-sm font-bold font-serif"
                  style={{ color: 'var(--theme-text-primary, #171717)' }}
                >
                  Cards, Panels & Elevation
                </h3>

                <div className="space-y-3">
                  <ColorControl
                    label="Card Surface Background"
                    description="Background for dashboard widgets, modal panels, and content cards"
                    value={theme.bgCard}
                    onChange={(bgCard) => updateTheme({ bgCard })}
                  />

                  <ColorControl
                    label="Card Border Color"
                    description="Subtle outline border around cards"
                    value={theme.borderCard}
                    onChange={(borderCard) => updateTheme({ borderCard })}
                  />

                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t"
                    style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}
                  >
                    <div>
                      <label
                        className="block text-xs font-bold uppercase mb-1"
                        style={{ color: 'var(--theme-text-primary, #171717)' }}
                      >
                        Card Corner Radius
                      </label>
                      <select
                        value={theme.cardRadius}
                        onChange={(e) => updateTheme({ cardRadius: e.target.value as any })}
                        className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                        style={{
                          backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                          borderColor: 'var(--theme-border-card, #E8DFCA)',
                          color: 'var(--theme-text-primary, #171717)',
                        }}
                      >
                        <option value="8px">8px - Subtle / Crisp</option>
                        <option value="12px">12px - Medium Standard</option>
                        <option value="16px">16px - Soft Modern (Default)</option>
                        <option value="20px">20px - Rounded Elegant</option>
                        <option value="24px">24px - Ultra Smooth Pill</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-xs font-bold uppercase mb-1"
                        style={{ color: 'var(--theme-text-primary, #171717)' }}
                      >
                        Card Shadow & Glow Depth
                      </label>
                      <select
                        value={theme.cardShadow}
                        onChange={(e) => updateTheme({ cardShadow: e.target.value as any })}
                        className="w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer shadow-2xs"
                        style={{
                          backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                          borderColor: 'var(--theme-border-card, #E8DFCA)',
                          color: 'var(--theme-text-primary, #171717)',
                        }}
                      >
                        <option value="none">Flat / No Shadow</option>
                        <option value="soft">Soft Ambient (Default)</option>
                        <option value="crisp">Crisp & Modern</option>
                        <option value="gold">Warm Gold Glow</option>
                        <option value="deep">Deep Atmospheric</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Pinned Interactive Live Preview Canvas (5 Cols) */}
        <div className="xl:col-span-5 sticky top-6 space-y-4">
          <div
            className="rounded-2xl border shadow-md p-5 space-y-4"
            style={{
              backgroundColor: 'var(--theme-bg-card, #FFFFFF)',
              borderColor: 'var(--theme-border-card, #E8DFCA)',
            }}
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--theme-border-card, #E8DFCA)' }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3
                  className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 font-mono"
                  style={{ color: 'var(--theme-text-primary, #171717)' }}
                >
                  <Eye className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary, #D4AF37)' }} />
                  Live System Preview
                </h3>
              </div>

              {/* Preview Selector Tabs */}
              <div
                className="flex items-center gap-1 p-1 rounded-lg border"
                style={{
                  backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                  borderColor: 'var(--theme-border-card, #E8DFCA)',
                }}
              >
                {[
                  { id: 'table', label: 'Table' },
                  { id: 'cards', label: 'Cards' },
                  { id: 'typography', label: 'Type' },
                  { id: 'buttons', label: 'UI' },
                ].map((pTab) => (
                  <button
                    key={pTab.id}
                    onClick={() => setPreviewTab(pTab.id as any)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer"
                    style={{
                      backgroundColor:
                        previewTab === pTab.id ? 'var(--theme-primary, #D4AF37)' : 'transparent',
                      color:
                        previewTab === pTab.id
                          ? 'var(--theme-primary-text, #FFFFFF)'
                          : 'var(--theme-text-secondary, #4A4A4A)',
                    }}
                  >
                    {pTab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE PREVIEW CANVAS AREA */}
            <div
              className="p-4 rounded-xl border transition-all overflow-hidden"
              style={{
                backgroundColor: theme.bgMain,
                borderColor: theme.borderCard,
                fontFamily: theme.fontBody,
              }}
            >
              {/* TAB PREVIEW: DATA TABLE */}
              {previewTab === 'table' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className="text-sm font-bold"
                        style={{
                          color: theme.textPrimary,
                          fontFamily: theme.fontHeading,
                          fontWeight: Number(theme.headingWeight) || 700,
                          letterSpacing: theme.headingLetterSpacing,
                          textTransform: theme.headingTransform,
                        }}
                      >
                        Jewelry Catalog Ledger
                      </h4>
                      <p className="text-[11px]" style={{ color: theme.textMuted }}>
                        Sample data table reflecting your active palette
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                      style={{
                        backgroundColor: `${theme.primary}20`,
                        color: theme.primary,
                        border: `1px solid ${theme.primary}40`,
                      }}
                    >
                      3 Items
                    </span>
                  </div>

                  <div
                    className="rounded-xl overflow-hidden border shadow-xs"
                    style={{ borderColor: theme.tableBorder }}
                  >
                    <table
                      className="w-full text-left border-collapse"
                      style={{ fontSize: theme.fontSizeTable }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor: theme.tableHeaderBg,
                            color: theme.tableHeaderText,
                            borderBottom: `1px solid ${theme.tableBorder}`,
                          }}
                        >
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[10px]">
                            Item
                          </th>
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[10px] text-center">
                            Karat
                          </th>
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[10px] text-right">
                            Price
                          </th>
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[10px] text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            name: '24K Imperial Dragon Bar',
                            karat: '24K',
                            weight: '50.0g',
                            price: '₱242,500',
                            status: 'In Vault',
                          },
                          {
                            name: '18K Diamond Solitaire Ring',
                            karat: '18K',
                            weight: '4.8g',
                            price: '₱68,500',
                            status: 'Reserved',
                          },
                          {
                            name: '22K Manila Rope Chain',
                            karat: '22K',
                            weight: '18.5g',
                            price: '₱94,200',
                            status: 'In Vault',
                          },
                        ].map((row, idx) => {
                          const isAlt = idx % 2 === 1;
                          return (
                            <tr
                              key={idx}
                              className="transition-colors"
                              style={{
                                backgroundColor: isAlt ? theme.tableRowAlt : theme.tableRowBg,
                                color: theme.tableText,
                                borderBottom:
                                  idx < 2 ? `1px solid ${theme.tableBorder}` : 'none',
                              }}
                            >
                              <td className="p-2.5">
                                <span className="font-bold block line-clamp-1">{row.name}</span>
                                <span className="text-[10px] opacity-70">{row.weight}</span>
                              </td>
                              <td
                                className="p-2.5 text-center font-mono font-bold"
                                style={{ color: theme.primary }}
                              >
                                {row.karat}
                              </td>
                              <td className="p-2.5 text-right font-mono font-black">
                                {row.price}
                              </td>
                              <td className="p-2.5 text-center">
                                <span
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                                  style={{
                                    backgroundColor: `${theme.primary}15`,
                                    color: theme.primary,
                                  }}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB PREVIEW: CARDS & WIDGETS */}
              {previewTab === 'cards' && (
                <div className="space-y-3">
                  <div
                    className="p-4 transition-all"
                    style={{
                      backgroundColor: theme.bgCard,
                      borderColor: theme.borderCard,
                      borderWidth: '1px',
                      borderRadius: theme.cardRadius,
                      boxShadow:
                        theme.cardShadow === 'gold'
                          ? `0 8px 25px -4px ${theme.primary}30`
                          : '0 4px 15px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: theme.textMuted }}>
                        Monthly Gold Volume
                      </span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${theme.primary}20`,
                          color: theme.primary,
                        }}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div
                      className="text-2xl font-black mt-2"
                      style={{
                        color: theme.textPrimary,
                        fontFamily: theme.fontHeading,
                      }}
                    >
                      ₱1,420,500.00
                    </div>
                    <div
                      className="flex items-center gap-1.5 mt-2 text-xs"
                      style={{ color: theme.textSecondary }}
                    >
                      <span className="text-emerald-600 font-bold font-mono">+18.4%</span> vs last month
                    </div>
                  </div>

                  <div
                    className="p-3.5 transition-all flex items-center justify-between"
                    style={{
                      backgroundColor: theme.bgCard,
                      borderColor: theme.borderCard,
                      borderWidth: '1px',
                      borderRadius: theme.cardRadius,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                      >
                        DG
                      </div>
                      <div>
                        <div
                          className="text-xs font-bold"
                          style={{ color: theme.textPrimary }}
                        >
                          Certified Vault Storage
                        </div>
                        <div className="text-[11px]" style={{ color: theme.textMuted }}>
                          100% Insured Bullion
                        </div>
                      </div>
                    </div>
                    <ShieldCheck className="w-4 h-4" style={{ color: theme.primary }} />
                  </div>
                </div>
              )}

              {/* TAB PREVIEW: TYPOGRAPHY HIERARCHY */}
              {previewTab === 'typography' && (
                <div className="space-y-3">
                  <div>
                    <h1
                      className="text-xl font-black leading-tight"
                      style={{
                        color: theme.textPrimary,
                        fontFamily: theme.fontHeading,
                        fontWeight: Number(theme.headingWeight) || 700,
                        letterSpacing: theme.headingLetterSpacing,
                        textTransform: theme.headingTransform,
                      }}
                    >
                      Heading 1 (Hero Title)
                    </h1>
                    <h2
                      className="text-base font-bold mt-1"
                      style={{
                        color: theme.textPrimary,
                        fontFamily: theme.fontHeading,
                        letterSpacing: theme.headingLetterSpacing,
                      }}
                    >
                      Heading 2 (Section Subtitle)
                    </h2>
                  </div>

                  <p
                    className="leading-relaxed"
                    style={{
                      color: theme.textSecondary,
                      fontSize: theme.fontSizeBase,
                    }}
                  >
                    Danica Gold Haute Joaillerie presents certified hallmarked fine jewelry, Swiss bullion, and price-locked flexible layaway plans.
                  </p>

                  <div
                    className="flex items-center gap-2 pt-2 border-t"
                    style={{ borderColor: theme.borderCard }}
                  >
                    <span
                      className="text-[10px] uppercase font-mono font-bold"
                      style={{ color: theme.textMuted }}
                    >
                      Metadata Caption:
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: theme.primary }}>
                      DG-AU-CERT-2026
                    </span>
                  </div>
                </div>
              )}

              {/* TAB PREVIEW: BUTTONS & UI CONTROLS */}
              {previewTab === 'buttons' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      style={{
                        backgroundColor: theme.btnPrimaryBg || theme.primary || '#D4AF37',
                        color: theme.btnPrimaryText || theme.primaryText || '#FFFFFF',
                        borderRadius: theme.btnRadius || '12px',
                      }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Primary Action Button</span>
                    </button>

                    <button
                      type="button"
                      className="w-full py-2.5 px-4 text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: theme.btnSecondaryBg || '#FFFFFF',
                        color: theme.btnSecondaryText || theme.textPrimary || '#171717',
                        borderColor: theme.btnSecondaryBorder || theme.borderCard || '#E8DFCA',
                        borderRadius: theme.btnRadius || '12px',
                      }}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Secondary Action Button</span>
                    </button>

                    <button
                      type="button"
                      className="w-full py-2 px-4 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      style={{
                        backgroundColor: theme.btnDangerBg || '#DC2626',
                        color: '#FFFFFF',
                        borderRadius: theme.btnRadius || '12px',
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Danger / Delete Button</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: theme.borderCard }}>
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
                    >
                      Active Pill
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
                    >
                      Accent Pill
                    </span>
                    <span
                      className="text-[10px] font-mono ml-auto"
                      style={{ color: theme.textMuted }}
                    >
                      Radius: {theme.btnRadius || '12px'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Banner */}
            <div
              className="p-3 rounded-xl border text-center"
              style={{
                backgroundColor: 'var(--theme-bg-main, #FCFCF9)',
                borderColor: 'var(--theme-border-card, #E8DFCA)',
              }}
            >
              <span
                className="text-[11px] block"
                style={{ color: 'var(--theme-text-secondary, #4A4A4A)' }}
              >
                All changes reflect live in real time. Click <b>Save & Apply Globally</b> to commit to the database.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
