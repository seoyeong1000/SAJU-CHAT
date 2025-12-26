import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/cookie-consent";
import GoogleAnalytics from "@/components/analytics/google-analytics";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { KakaoProvider } from "@/components/providers/kakao-provider";
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
  title: {
    default: "사주로 - 정통 명리학 사주 분석",
    template: "%s | 사주로",
  },
  description:
    "적천수, 궁통보감 등 고전 명리 원전을 바탕으로 한 정확한 사주 분석. 만세력, 격국/용신, 대운, 신살 분석까지 한 번에.",
  keywords: [
    "사주",
    "만세력",
    "사주분석",
    "운세",
    "명리학",
    "사주풀이",
    "사주상담",
  ],
  authors: [{ name: "사주로" }],
  creator: "사주로",
  metadataBase: new URL("https://sajuro.co.kr"),
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "사주로 - 정통 명리학 사주 분석",
    description:
      "적천수, 궁통보감 등 고전 명리 원전을 바탕으로 한 정확한 사주 분석",
    type: "website",
    url: "https://sajuro.co.kr",
    siteName: "사주로",
    locale: "ko_KR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "사주로 - 정통 명리학 사주 분석",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "사주로 - 정통 명리학 사주 분석",
    description:
      "적천수, 궁통보감 등 고전 명리 원전을 바탕으로 한 정확한 사주 분석",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification":
        process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <GoogleAnalytics />
          <SyncUserProvider>
            <KakaoProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <CookieConsent />
            </KakaoProvider>
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
