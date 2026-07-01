import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import "../globals.css";

// Fonts (and their CSS variables) are loaded once on <html> in the root app/layout.tsx.

export const metadata: Metadata = {
  title: "ESEN Graduation Ceremony 2026",
  description: "The official digital experience for the ESEN Graduation Ceremony 2026. Celebrating the Class of 2026 at UTICA on 9 July 2026.",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
  <Navbar />
  {children}
  <Footer />
</NextIntlClientProvider>
  );
}
