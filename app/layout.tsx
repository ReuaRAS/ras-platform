import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "منصة قطاعات محافظة الرس — أكاديمية الرس الذكية",
    template: "%s | منصة قطاعات محافظة الرس",
  },
  description:
    "منصة متكاملة لقطاعات محافظة الرس: القوانين، التوظيف، الدورات، المكافآت، الاختبارات والشهادات المعتمدة.",
  applicationName: "منصة قطاعات محافظة الرس",
  authors: [{ name: "NJM" }],
  keywords: ["الرس", "قطاعات", "الهلال الأحمر", "أمن العام", "الميكانيك", "شهادات", "FiveM"],
  openGraph: {
    title: "منصة قطاعات محافظة الرس",
    description: "قوانين، توظيف، دورات، مكافآت وشهادات معتمدة لكل قطاع في محافظة الرس.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
