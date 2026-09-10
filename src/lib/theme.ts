// Theme specification and dynamic styling engine for Danica Gold / ZD Gold

export interface ThemeConfig {
  // Page & Backgrounds
  bgMain: string;
  bgCard: string;
  borderCard: string;
  cardRadius: '8px' | '12px' | '16px' | '20px' | '24px';
  cardShadow: 'none' | 'soft' | 'crisp' | 'gold' | 'deep';

  // Navigation & Shell
  sidebarBg: string;
  sidebarText: string;
  topbarBg: string;

  // Typography Colors
  textPrimary: string;    // Titles, H1-H4, emphasized text
  textSecondary: string;  // Body text, standard descriptions
  textMuted: string;      // Metadata, hints, subtle labels

  // Brand Accents & Interactive Buttons
  primary: string;        // Main luxury/gold accent
  primaryHover: string;   // Hover state for buttons/pills
  primaryText: string;    // Text on primary buttons
  accent: string;         // Secondary highlight color

  // Button Color Studio
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnPrimaryHover: string;
  btnSecondaryBg: string;
  btnSecondaryText: string;
  btnSecondaryBorder: string;
  btnDangerBg: string;
  btnRadius: '6px' | '8px' | '12px' | '16px' | '9999px';

  // Data Table & Ledgers
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowBg: string;
  tableRowAlt: string;
  tableRowHover: string;
  tableBorder: string;
  tableText: string;

  // Typography Styles & Families
  fontHeading: string;    // Heading family
  fontBody: string;       // Body family
  fontSizeBase: '13px' | '14px' | '15px' | '16px' | '17px';
  fontSizeH1Scale: '0.85' | '1.0' | '1.15' | '1.3';
  fontSizeTable: '11px' | '12px' | '13px' | '14px';
  headingWeight: '400' | '500' | '600' | '700' | '800' | '900';
  headingLetterSpacing: '-0.02em' | '0' | '0.03em' | '0.06em' | '0.12em';
  headingTransform: 'none' | 'uppercase' | 'capitalize';
}

export const DEFAULT_THEME: ThemeConfig = {
  bgMain: '#FCFCF9',
  bgCard: '#FFFFFF',
  borderCard: '#E8DFCA',
  cardRadius: '16px',
  cardShadow: 'soft',

  sidebarBg: '#FFFFFF',
  sidebarText: '#1A1A1A',
  topbarBg: '#FFFFFF',

  textPrimary: '#171717',
  textSecondary: '#4A4A4A',
  textMuted: '#787878',

  primary: '#D4AF37',
  primaryHover: '#C59B27',
  primaryText: '#FFFFFF',
  accent: '#B8860B',

  btnPrimaryBg: '#D4AF37',
  btnPrimaryText: '#FFFFFF',
  btnPrimaryHover: '#C59B27',
  btnSecondaryBg: '#FFFFFF',
  btnSecondaryText: '#171717',
  btnSecondaryBorder: '#E8DFCA',
  btnDangerBg: '#DC2626',
  btnRadius: '12px',

  tableHeaderBg: '#FAF8F2',
  tableHeaderText: '#785E1E',
  tableRowBg: '#FFFFFF',
  tableRowAlt: '#FCFBF8',
  tableRowHover: '#F7F3E8',
  tableBorder: '#EFE7D5',
  tableText: '#1F1F1F',

  fontHeading: 'Playfair Display',
  fontBody: 'Outfit',
  fontSizeBase: '14px',
  fontSizeH1Scale: '1.0',
  fontSizeTable: '12px',
  headingWeight: '800',
  headingLetterSpacing: '0.03em',
  headingTransform: 'none',
};

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  previewColors: string[];
  theme: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'royal-gold',
    name: 'ZD Royal Gold',
    description: 'Signature warm ivory, 24K radiant gold accents, and haute couture serif headings.',
    badge: 'Signature Default',
    previewColors: ['#FCFCF9', '#D4AF37', '#171717', '#FAF8F2'],
    theme: {
      ...DEFAULT_THEME,
    },
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian & Gold',
    description: 'Ultra-luxurious deep obsidian noir with glowing warm amber 24K gold accents.',
    badge: 'Dark Luxury',
    previewColors: ['#0A0D14', '#F59E0B', '#F9FAFB', '#151B26'],
    theme: {
      bgMain: '#0A0D14',
      bgCard: '#151B26',
      borderCard: '#273142',
      cardRadius: '16px',
      cardShadow: 'gold',

      sidebarBg: '#0F131C',
      sidebarText: '#F3F4F6',
      topbarBg: '#0F131C',

      textPrimary: '#FFFFFF',
      textSecondary: '#D1D5DB',
      textMuted: '#9CA3AF',

      primary: '#F59E0B',
      primaryHover: '#D97706',
      primaryText: '#000000',
      accent: '#FBBF24',

      btnPrimaryBg: '#F59E0B',
      btnPrimaryText: '#000000',
      btnPrimaryHover: '#D97706',
      btnSecondaryBg: '#151B26',
      btnSecondaryText: '#FFFFFF',
      btnSecondaryBorder: '#273142',
      btnDangerBg: '#EF4444',
      btnRadius: '12px',

      tableHeaderBg: '#1C2433',
      tableHeaderText: '#FBBF24',
      tableRowBg: '#151B26',
      tableRowAlt: '#121721',
      tableRowHover: '#232D3F',
      tableBorder: '#2A364A',
      tableText: '#E5E7EB',

      fontHeading: 'Cinzel',
      fontBody: 'Plus Jakarta Sans',
      fontSizeBase: '14px',
      fontSizeH1Scale: '1.0',
      fontSizeTable: '12px',
      headingWeight: '800',
      headingLetterSpacing: '0.06em',
      headingTransform: 'uppercase',
    },
  },
  {
    id: 'emerald-sovereign',
    name: 'Emerald Sovereign & Champagne',
    description: 'Imperial royal deep emerald green, champagne gold accents, and aristocratic styling.',
    badge: 'Imperial Elegance',
    previewColors: ['#F3F7F4', '#064E3B', '#D97706', '#FFFFFF'],
    theme: {
      bgMain: '#F3F7F4',
      bgCard: '#FFFFFF',
      borderCard: '#CBE0D4',
      cardRadius: '16px',
      cardShadow: 'soft',

      sidebarBg: '#FFFFFF',
      sidebarText: '#064E3B',
      topbarBg: '#FFFFFF',

      textPrimary: '#064E3B',
      textSecondary: '#2D3748',
      textMuted: '#6B7280',

      primary: '#059669',
      primaryHover: '#047857',
      primaryText: '#FFFFFF',
      accent: '#D97706',

      btnPrimaryBg: '#059669',
      btnPrimaryText: '#FFFFFF',
      btnPrimaryHover: '#047857',
      btnSecondaryBg: '#FFFFFF',
      btnSecondaryText: '#064E3B',
      btnSecondaryBorder: '#CBE0D4',
      btnDangerBg: '#DC2626',
      btnRadius: '16px',

      tableHeaderBg: '#E6F0EA',
      tableHeaderText: '#064E3B',
      tableRowBg: '#FFFFFF',
      tableRowAlt: '#F7FAF8',
      tableRowHover: '#EBF4EF',
      tableBorder: '#D1E3DA',
      tableText: '#1A2E22',

      fontHeading: 'Cormorant Garamond',
      fontBody: 'Outfit',
      fontSizeBase: '15px',
      fontSizeH1Scale: '1.15',
      fontSizeTable: '13px',
      headingWeight: '700',
      headingLetterSpacing: '0.03em',
      headingTransform: 'none',
    },
  },
  {
    id: 'sapphire-platinum',
    name: 'Sapphire & Platinum Elite',
    description: 'Crisp ice platinum, royal navy sapphire accents, and high-precision modern typography.',
    badge: 'Modern Precision',
    previewColors: ['#F0F4F8', '#2563EB', '#0F172A', '#FFFFFF'],
    theme: {
      bgMain: '#F0F4F8',
      bgCard: '#FFFFFF',
      borderCard: '#CBD5E1',
      cardRadius: '12px',
      cardShadow: 'crisp',

      sidebarBg: '#FFFFFF',
      sidebarText: '#0F172A',
      topbarBg: '#FFFFFF',

      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#64748B',

      primary: '#2563EB',
      primaryHover: '#1D4ED8',
      primaryText: '#FFFFFF',
      accent: '#3B82F6',

      btnPrimaryBg: '#2563EB',
      btnPrimaryText: '#FFFFFF',
      btnPrimaryHover: '#1D4ED8',
      btnSecondaryBg: '#FFFFFF',
      btnSecondaryText: '#0F172A',
      btnSecondaryBorder: '#CBD5E1',
      btnDangerBg: '#E11D48',
      btnRadius: '12px',

      tableHeaderBg: '#E2E8F0',
      tableHeaderText: '#1E293B',
      tableRowBg: '#FFFFFF',
      tableRowAlt: '#F8FAFC',
      tableRowHover: '#EDF2F7',
      tableBorder: '#CBD5E1',
      tableText: '#1E293B',

      fontHeading: 'Montserrat',
      fontBody: 'Inter',
      fontSizeBase: '14px',
      fontSizeH1Scale: '1.0',
      fontSizeTable: '12px',
      headingWeight: '800',
      headingLetterSpacing: '-0.02em',
      headingTransform: 'none',
    },
  },
  {
    id: 'rose-gold-pearl',
    name: 'Rose Gold & Silk Pearl',
    description: 'Delicate warm blush pearl, rose gold jewel tones, and romantic editorial elegance.',
    badge: 'Romantic Haute',
    previewColors: ['#FAF5F5', '#E11D48', '#881337', '#FFFFFF'],
    theme: {
      bgMain: '#FAF5F5',
      bgCard: '#FFFFFF',
      borderCard: '#F3D5DB',
      cardRadius: '20px',
      cardShadow: 'soft',

      sidebarBg: '#FFFFFF',
      sidebarText: '#881337',
      topbarBg: '#FFFFFF',

      textPrimary: '#881337',
      textSecondary: '#4C1D24',
      textMuted: '#9F7179',

      primary: '#E11D48',
      primaryHover: '#BE123C',
      primaryText: '#FFFFFF',
      accent: '#F43F5E',

      btnPrimaryBg: '#E11D48',
      btnPrimaryText: '#FFFFFF',
      btnPrimaryHover: '#BE123C',
      btnSecondaryBg: '#FFFFFF',
      btnSecondaryText: '#881337',
      btnSecondaryBorder: '#F3D5DB',
      btnDangerBg: '#991B1B',
      btnRadius: '16px',

      tableHeaderBg: '#FCE7EB',
      tableHeaderText: '#9F1239',
      tableRowBg: '#FFFFFF',
      tableRowAlt: '#FDF2F4',
      tableRowHover: '#FAE0E6',
      tableBorder: '#F5CCD5',
      tableText: '#4C0519',

      fontHeading: 'Playfair Display',
      fontBody: 'Poppins',
      fontSizeBase: '14px',
      fontSizeH1Scale: '1.0',
      fontSizeTable: '12px',
      headingWeight: '700',
      headingLetterSpacing: '0.03em',
      headingTransform: 'none',
    },
  },
  {
    id: 'minimal-slate',
    name: 'Modern Minimalist Slate',
    description: 'Ultra-clean slate dark mode with high-contrast electric gold indicators.',
    badge: 'Pro Minimal',
    previewColors: ['#0F172A', '#EAB308', '#F8FAFC', '#1E293B'],
    theme: {
      bgMain: '#0F172A',
      bgCard: '#1E293B',
      borderCard: '#334155',
      cardRadius: '12px',
      cardShadow: 'crisp',

      sidebarBg: '#0F172A',
      sidebarText: '#F8FAFC',
      topbarBg: '#0F172A',

      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',

      primary: '#EAB308',
      primaryHover: '#CA8A04',
      primaryText: '#0F172A',
      accent: '#FACC15',

      btnPrimaryBg: '#EAB308',
      btnPrimaryText: '#0F172A',
      btnPrimaryHover: '#CA8A04',
      btnSecondaryBg: '#1E293B',
      btnSecondaryText: '#F8FAFC',
      btnSecondaryBorder: '#334155',
      btnDangerBg: '#EF4444',
      btnRadius: '8px',

      tableHeaderBg: '#334155',
      tableHeaderText: '#FACC15',
      tableRowBg: '#1E293B',
      tableRowAlt: '#182234',
      tableRowHover: '#2C3A50',
      tableBorder: '#374761',
      tableText: '#F1F5F9',

      fontHeading: 'Inter',
      fontBody: 'Inter',
      fontSizeBase: '14px',
      fontSizeH1Scale: '0.85',
      fontSizeTable: '12px',
      headingWeight: '800',
      headingLetterSpacing: '-0.02em',
      headingTransform: 'none',
    },
  },
];

export const AVAILABLE_HEADING_FONTS = [
  { name: 'Playfair Display', family: "'Playfair Display', Georgia, serif", category: 'Serif Classic' },
  { name: 'Cinzel', family: "'Cinzel', Georgia, serif", category: 'Imperial Royal' },
  { name: 'Cormorant Garamond', family: "'Cormorant Garamond', Garamond, serif", category: 'Haute Couture' },
  { name: 'Outfit', family: "'Outfit', sans-serif", category: 'Modern Geometric' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'Bold Clean' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", category: 'Contemporary Tech' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'Modern Rounded' },
  { name: 'Inter', family: "'Inter', sans-serif", category: 'Swiss Minimal' },
  { name: 'Merriweather', family: "'Merriweather', Georgia, serif", category: 'Editorial Serif' },
];

export const AVAILABLE_BODY_FONTS = [
  { name: 'Outfit', family: "'Outfit', sans-serif" },
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Poppins', family: "'Poppins', sans-serif" },
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'System Sans', family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
];

export function generateCssVariables(theme: ThemeConfig): string {
  const shadowMap = {
    none: 'none',
    soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
    crisp: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    gold: `0 10px 30px -5px ${theme.primary}25, 0 0 15px ${theme.primary}18`,
    deep: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  };

  const selectedHeadingFont = AVAILABLE_HEADING_FONTS.find(f => f.name === theme.fontHeading)?.family || `'${theme.fontHeading}', serif`;
  const selectedBodyFont = AVAILABLE_BODY_FONTS.find(f => f.name === theme.fontBody)?.family || `'${theme.fontBody}', sans-serif`;

  const btnPrimaryBg = theme.btnPrimaryBg || theme.primary || '#D4AF37';
  const btnPrimaryText = theme.btnPrimaryText || theme.primaryText || '#FFFFFF';
  const btnPrimaryHover = theme.btnPrimaryHover || theme.primaryHover || '#C59B27';
  const btnSecondaryBg = theme.btnSecondaryBg || '#FFFFFF';
  const btnSecondaryText = theme.btnSecondaryText || theme.textPrimary || '#171717';
  const btnSecondaryBorder = theme.btnSecondaryBorder || theme.borderCard || '#E8DFCA';
  const btnDangerBg = theme.btnDangerBg || '#DC2626';
  const btnRadius = theme.btnRadius || '12px';

  return `
    :root {
      --theme-bg-main: ${theme.bgMain};
      --theme-bg-card: ${theme.bgCard};
      --theme-border-card: ${theme.borderCard};
      --theme-card-radius: ${theme.cardRadius};
      --theme-card-shadow: ${shadowMap[theme.cardShadow] || shadowMap.soft};

      --theme-sidebar-bg: ${theme.sidebarBg};
      --theme-sidebar-text: ${theme.sidebarText};
      --theme-topbar-bg: ${theme.topbarBg};

      --theme-text-primary: ${theme.textPrimary};
      --theme-text-secondary: ${theme.textSecondary};
      --theme-text-muted: ${theme.textMuted};

      --theme-primary: ${theme.primary};
      --theme-primary-hover: ${theme.primaryHover};
      --theme-primary-text: ${theme.primaryText};
      --theme-accent: ${theme.accent};

      --theme-btn-primary-bg: ${btnPrimaryBg};
      --theme-btn-primary-text: ${btnPrimaryText};
      --theme-btn-primary-hover: ${btnPrimaryHover};
      --theme-btn-secondary-bg: ${btnSecondaryBg};
      --theme-btn-secondary-text: ${btnSecondaryText};
      --theme-btn-secondary-border: ${btnSecondaryBorder};
      --theme-btn-danger-bg: ${btnDangerBg};
      --theme-btn-danger-text: #FFFFFF;
      --theme-btn-radius: ${btnRadius};

      --theme-table-header-bg: ${theme.tableHeaderBg};
      --theme-table-header-text: ${theme.tableHeaderText};
      --theme-table-row-bg: ${theme.tableRowBg};
      --theme-table-row-alt: ${theme.tableRowAlt};
      --theme-table-row-hover: ${theme.tableRowHover};
      --theme-table-border: ${theme.tableBorder};
      --theme-table-text: ${theme.tableText};

      --theme-font-heading: ${selectedHeadingFont};
      --theme-font-body: ${selectedBodyFont};
      --theme-font-size-base: ${theme.fontSizeBase};
      --theme-font-size-h1-scale: ${theme.fontSizeH1Scale};
      --theme-font-size-table: ${theme.fontSizeTable};
      --theme-heading-weight: ${theme.headingWeight};
      --theme-heading-spacing: ${theme.headingLetterSpacing};
      --theme-heading-transform: ${theme.headingTransform};
    }
  `;
}
