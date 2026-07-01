import './globals.css';
import { Playfair_Display, Cormorant_Garamond, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'], style: ['normal','italic'], variable: '--font-playfair' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300','400','500','600'], style: ['normal','italic'], variable: '--font-cormorant' });
const inter = Inter({ subsets: ['latin'], weight: ['400','500'], variable: '--font-inter' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://esen-graduation-2026.vercel.app';
const SHARE_DESCRIPTION = 'Celebrating the Class of 2026 — 9 July 2026 at UTICA, Tunis.';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'ESEN Graduation Ceremony 2026',
  description: SHARE_DESCRIPTION,
  openGraph: {
    title: 'ESEN Graduation Ceremony 2026',
    description: SHARE_DESCRIPTION,
    url: BASE_URL,
    siteName: 'ESEN Graduation Ceremony 2026',
    type: 'website',
    images: [{ url: '/background.webp', alt: 'ESEN Graduation Ceremony 2026' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ESEN Graduation Ceremony 2026',
    description: SHARE_DESCRIPTION,
    images: ['/background.webp'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${playfair.variable} ${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased selection:bg-[#C9960C] selection:text-[#0D0B0E]">
        {children}
      </body>
    </html>
  );
}
