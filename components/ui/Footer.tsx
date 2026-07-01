"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { GoldDivider } from "./GoldDivider";

export function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <footer className="w-full bg-[var(--color-bg-primary)] relative overflow-hidden">
      <GoldDivider className="absolute top-0 !max-w-full opacity-30" />
      
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <h2 className="font-display text-[clamp(40px,5vw,60px)] text-[var(--foreground)] mb-2">ESEN</h2>
        <div className="font-serif text-[var(--color-gold-primary)] text-xl italic tracking-wider mb-8">
          {t("subtitle")}
        </div>

        <p className="font-sans text-[var(--color-off-white)] mb-12 max-w-md">
          {t("tagline")}
        </p>
        
        {/* ESEN Ambassadors logo */}
        <a
          href="https://www.instagram.com/esen.ambassadors/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 inline-block bg-white rounded-2xl p-3 shadow-[0_0_30px_rgba(27,58,140,0.25)] transition-transform duration-300 hover:scale-105"
          aria-label="ESEN Ambassadors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logos/ambassadors.png"
            alt="ESEN Ambassadors"
            width={96}
            height={96}
            className="block h-24 w-24 object-contain"
            onError={(e) => { const a = e.currentTarget.closest("a"); if (a) a.style.display = "none"; }}
          />
        </a>

        <div className="flex gap-8 mb-20">
          <a href="https://www.instagram.com/esen.ambassadors/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold-muted)] hover:text-[var(--color-gold-primary)] transition-colors hover:scale-110 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            <span className="sr-only">Instagram</span>
          </a>
          <a href="https://www.facebook.com/esenien" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold-muted)] hover:text-[var(--color-gold-primary)] transition-colors hover:scale-110 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            <span className="sr-only">Facebook</span>
          </a>
          <a href="https://www.linkedin.com/school/esenien/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold-muted)] hover:text-[var(--color-gold-primary)] transition-colors hover:scale-110 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            <span className="sr-only">LinkedIn</span>
          </a>
        </div>
        
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-[rgba(201,150,12,0.1)]">
          <div className="font-sans text-xs tracking-widest text-[var(--color-gold-muted)]">
            {t("rights")}
          </div>
          
          <div className="flex gap-4 font-sans text-xs tracking-[0.15em] font-medium">
            <button 
              onClick={() => switchLocale('en')}
              className={`transition-colors hover:text-[var(--color-gold-primary)] ${locale === 'en' ? 'text-[var(--color-gold-primary)] border-b border-[var(--color-gold-primary)]' : 'text-[var(--color-gold-muted)]'}`}
            >
              EN
            </button>
            <button 
              onClick={() => switchLocale('fr')}
              className={`transition-colors hover:text-[var(--color-gold-primary)] ${locale === 'fr' ? 'text-[var(--color-gold-primary)] border-b border-[var(--color-gold-primary)]' : 'text-[var(--color-gold-muted)]'}`}
            >
              FR
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
