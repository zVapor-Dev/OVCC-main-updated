import type { Metadata, Viewport } from "next";
import Navigation from "@/components/navigation";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const title = `${SITE_NAME} — Precision in Every Convoy`;
const description = `${SITE_NAME} — Professional, organized, and safe convoy control services for TruckersMP events. Traffic management, route control, and event support.`;
const image = "https://i.vgy.me/HSWFsQ.png";
export const metadata: Metadata = {
  title,
  description,
  icons: { icon: "/Logo.png", apple: "/Logo.png" },
  openGraph: { type: "website", siteName: SITE_NAME, title, description, images: [image] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};
export const viewport: Viewport = { themeColor: "#FFBE00" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Montserrat:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body className="bg-black text-white selection:bg-yellow-400 selection:text-black">
        <Navigation />
        {children}
        <footer className="relative z-20 border-t border-white/10 bg-black px-6 py-12 text-xs text-white/40">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <img src="/Logo.png" alt="" className="h-6 w-auto" />
            <span className="font-medium text-white">{SITE_NAME}</span>
            <span>© 2026. All rights reserved.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
