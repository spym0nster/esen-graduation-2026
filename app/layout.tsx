import './globals.css';
import { Playfair_Display, Cormorant_Garamond, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'], style: ['normal','italic'], variable: '--font-playfair' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300','400','500','600'], style: ['normal','italic'], variable: '--font-cormorant' });
const inter = Inter({ subsets: ['latin'], weight: ['400','500'], variable: '--font-inter' });

export const metadata = {
  title: 'ESEN Graduation Ceremony',
  description: 'Official invitation for the 2026 ceremony',
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
