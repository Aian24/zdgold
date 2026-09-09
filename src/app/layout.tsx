import type { Metadata, Viewport } from 'next';
import './globals.css';

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
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FCFCF9] text-[#1A1A1A] antialiased selection:bg-gold-500 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
