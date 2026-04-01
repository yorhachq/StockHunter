import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { appConfig } from "@/config/app-config";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${appConfig.appName} | 交易记录与复盘系统`,
  description: "记录基金与股票交易、计算持仓成本、推演买卖区间，并沉淀复盘笔记。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
