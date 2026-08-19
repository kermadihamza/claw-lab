import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const zoika = localFont({
  src: "../fonts/Zoika.ttf",
  variable: "--font-zoika",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: "Claw lab — Arlon",
  description:
    "Claw lab, nail art à Arlon (Blancaa Institut). Vernis semi-permanent, gainage, gel X. Réservation en ligne.",
  icons: {
    icon: "/logo_clawlab.png",
  },
  openGraph: {
    images: ["/logo_clawlab.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${display.variable} ${body.variable} ${zoika.variable} font-body antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
