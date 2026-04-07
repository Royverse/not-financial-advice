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
    "Autonomous AI-powered stock analysis platform. Real-time market scanning, Gemini AI analysis, social sentiment tracking, and conviction scoring — institutional-grade vibes only.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
