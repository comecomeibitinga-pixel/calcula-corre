import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/header";
import BottomNav from "@/components/bottom-nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CalculaCorre - O Controle do Motoboy",
  description: "Gerencie seus ganhos de entregas, gastos com combustível e alertas de troca de óleo de forma rápida e prática.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CalculaCorre",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} font-sans dark`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-slate-950 min-h-screen flex justify-center text-slate-100">
        <div className="w-full max-w-md bg-background min-h-screen flex flex-col shadow-2xl relative border-x border-border pb-20">
          <Header />
          <main className="flex-1 p-4 overflow-y-auto">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
