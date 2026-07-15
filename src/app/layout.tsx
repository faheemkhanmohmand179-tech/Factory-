import type { Metadata, Viewport } from "next";
import { Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

// Noto Naskh Arabic - fast, legible, ideal for UI body text
const naskh = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Noto Nastaliq Urdu - decorative, only for headings (heavier to load)
const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false, // don't block initial load
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "المکہ فیکٹری - ماربل پروسیسنگ",
  description: "المکہ فیکٹری - ماربل کٹنگ، انوینٹری اور عملہ مینجمنٹ سسٹم",
  keywords: ["المکہ فیکٹری", "marble", "marble factory", "Urdu", "RTL"],
  authors: [{ name: "زیادہ خان اور امتیاز خان" }],
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ur" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Set theme color before paint to avoid flash of wrong background.
            next-themes will inject the `class="dark"` on <html> itself; this
            inline script is a fallback that runs synchronously to apply the
            stored theme class ASAP. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('almakkah-theme')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${naskh.variable} ${nastaliq.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-naskh), sans-serif" }}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  );
}
