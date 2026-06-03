import type { Metadata } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Script from "next/script"; // ← MUST HAVE THIS IMPORT

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "O-Lang — The Governed AI Orchestration Language",
  description:
    "O-Lang is the open protocol for governed AI workflows. Write once, enforce everywhere — resolver allowlists, verified intent, cryptographic audit trails.",
  keywords: ["AI governance", "LLM orchestration", "AI safety", "O-Lang", "governed AI"],
  openGraph: {
    title: "O-Lang — Governed AI Orchestration",
    description: "AI that can't lie, leak, or go rogue. The open protocol for governed AI workflows.",
    url: "https://o-lang.dev",
    siteName: "O-Lang",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "O-Lang — Governed AI Orchestration",
    description: "AI that can't lie, leak, or go rogue.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        
        {/* ✅ GOOGLE ANALYTICS --— CLEAN ID, NO TRAILING SPACES */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-X0FRK316RG"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X0FRK316RG');
          `}
        </Script>
      </body>
    </html>
  );
}