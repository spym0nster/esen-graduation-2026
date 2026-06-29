"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
  { name: "Programme", href: "#programme" },
  { name: "Students", href: "#majors" },
  { name: "Seating", href: "#seating" },
  { name: "Gallery", href: "#gallery" },
  { name: "RSVP", href: "#rsvp" },
];

  // Observe sections to highlight active nav link
  useEffect(() => {
    const sectionIds = ['programme', 'majors', 'seating', 'gallery', 'rsvp'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const LangToggle = () => (
    <div className="flex gap-4 font-sans text-xs tracking-[0.15em] font-medium">
      <button 
        onClick={() => switchLocale('en')}
        className={`transition-colors hover:text-[var(--color-gold-primary)] ${locale === 'en' ? 'text-[var(--color-gold-primary)] border-b border-[var(--color-gold-primary)]' : 'text-[#8A6A1A]'}`}
      >
        EN
      </button>
      <button 
        onClick={() => switchLocale('fr')}
        className={`transition-colors hover:text-[var(--color-gold-primary)] ${locale === 'fr' ? 'text-[var(--color-gold-primary)] border-b border-[var(--color-gold-primary)]' : 'text-[#8A6A1A]'}`}
      >
        FR
      </button>
    </div>
  );

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
            scrolled 
              ? "bg-[rgba(15,28,72,0.82)] backdrop-blur-[20px] saturate-[160%] border-b border-[rgba(var(--color-gold-primary-rgb),0.20)] py-4"
              : "bg-transparent py-6"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay: 2 }} // wait for intro
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="font-display text-2xl text-white tracking-wide cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ESEN
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex gap-8 mr-4">
                {navLinks.map((link) => {
                  const isActive = activeSection === link.href.slice(1);
                  return (
                                        <a
                      key={link.name}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(link.href.slice(1));
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="font-sans text-sm tracking-[0.1em] uppercase text-[var(--foreground)] hover:text-[var(--color-gold-primary)] transition-colors relative"
                    >
                      {link.name}
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[var(--color-blue-primary)] to-[var(--color-gold-primary)]"
                        initial={{ width: 0 }}
                        animate={{ width: isActive ? '100%' : '0%' }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </a>
                  );
                })}
            </div>
            <div className="h-4 w-[1px] bg-[rgba(64,102,180,0.3)]" />
            <LangToggle />
          </nav>

          <button 
            className="md:hidden text-[#F5ECD7] hover:text-[#F0B429] transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgba(10,20,60,0.96)] backdrop-blur-[24px] flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-16">
              <div className="font-display text-2xl text-white">ESEN</div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#F5ECD7] hover:text-[#F0B429] transition-colors p-2"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <nav className="flex flex-col gap-8 flex-1 justify-center px-4">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                  className="font-display text-4xl text-[#F5ECD7] hover:text-[#F0B429] transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
            </nav>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.6 }}
              className="mt-auto mb-10 pl-4 flex items-center gap-6"
            >
              <div className="flex items-center gap-4">
                <span className="font-sans uppercase tracking-[0.15em] text-[12px] text-[var(--color-gold-primary)] mt-2">ESEN</span>
                <LangToggle />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
