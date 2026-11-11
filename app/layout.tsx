import type { Metadata, Viewport } from "next";
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
  title: "JoBot — İş Arama & Kariyer Asistanı",
  description: "Kurulum gerektirmeyen web tabanlı kariyer asistanı. Profilinize göre ilanları tarar, konum ve çalışma izni uygunluğunu denetler, ilana özel CV maddeleri, ön yazı ve LinkedIn mesajı hazırlar. Verileriniz tarayıcınızda kalır.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JoBot"
  }
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
