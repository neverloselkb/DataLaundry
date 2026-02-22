import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/dashboard/Header";
import { Footer } from "@/components/dashboard/Footer";

export const metadata: Metadata = {
  title: "데이터세탁소 (Data Laundry) - 스마트 데이터 정제 솔루션",
  description: "지저분한 데이터를 새것처럼 뽀송뽀송하게, 1인 개발자의 데이터 세탁소",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard — 깔끔한 한글 본문 폰트 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <meta name="google-adsense-account" content="ca-pub-6113754179867162" />
      </head>
      <body className="antialiased bg-[var(--laundry-bg)] text-[var(--laundry-text)]">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6113754179867162"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
