import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "nfa. — not financial advice",
  description:
    "Autonomous AI-powered stock analysis platform. Real-time market scanning, Gemini AI analysis, social sentiment tracking, and conviction scoring.",
  keywords: [
    "stock analysis",
    "AI trading",
    "market scanner",
    "sentiment analysis",
    "Gemini AI",
    "not financial advice",
  ],
  authors: [{ name: "nfa." }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "nfa. — not financial advice",
    description:
      "Autonomous AI stock analysis. Market scanning, sentiment tracking, and conviction scoring.",
    type: "website",
    siteName: "nfa.",
  },
  twitter: {
    card: "summary",
    title: "nfa. — not financial advice",
    description:
      "Autonomous AI stock analysis. Market scanning, sentiment tracking, and conviction scoring.",
  },
};

import FallingLeaves from "@/components/ui/FallingLeaves";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#fdf6e3" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FallingLeaves />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
