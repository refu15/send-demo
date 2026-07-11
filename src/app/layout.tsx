import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "送迎レーン デモ",
  description: "Excel送迎表から送迎計画、進捗、実績を見える化するデモ",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
