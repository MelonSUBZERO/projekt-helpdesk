import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppHeader } from "@/components/app-header";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helpdesk szkolny",
  description: "Aplikacja do zgłaszania usterek w szkole",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            <AppHeader />
            <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
