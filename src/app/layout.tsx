import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Danica Gold | Haute Joaillerie, 24K Bullion & Layaway Contracts',
  description:
    'Premier luxury retail gold jewelry and fine bullion house. Shop certified hallmarked gold with live spot rates, cash checkout, or price-locked flexible layaway installment plans.',
  keywords: [
    'Danica Gold',
    'Gold jewelry',
    '24K Gold Bullion',
    'Gold Layaway',
    'Price-Lock Gold',
    'Gold Installment Plan',
    '18K Cuban Chain',
    'Live Gold Spot Rate',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#080A0F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Inter:wght@300;400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,400&family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--theme-bg-main,#FCFCF9)] text-[var(--theme-text-primary,#1A1A1A)] antialiased selection:bg-[var(--theme-primary,#D4AF37)] selection:text-white font-[var(--theme-font-body,sans-serif)] text-[var(--theme-font-size-base,14px)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
