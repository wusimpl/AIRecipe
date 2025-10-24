import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { QueryClientWrapper } from "@/providers/query-client-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AI菜谱 | AIRecipe",
  description: "输入菜名，开启你的厨神之路。食材，步骤，技巧，一张图搞定",
  keywords: ["AI菜谱", "智能菜谱", "菜谱生成", "烹饪指南", "食谱", "AI烹饪", "美食", "做菜教程"],
  authors: [{ name: "AIRecipe" }],
  creator: "AIRecipe",
  publisher: "AIRecipe",

  // Open Graph (用于微信、QQ、Facebook 等)
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://wusimpl.fun",
    siteName: "AI菜谱",
    title: "AI菜谱 | 万物皆可烹饪",
    description: "输入菜名，开启你的厨神之路。食材，步骤，技巧，一张图搞定",
    images: [
      {
        url: "https://wusimpl.fun/chef.png", // 使用完整绝对 URL
        width: 516,
        height: 387,
        alt: "AI菜谱 - 智能烹饪指南生成器",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "AI菜谱 | 万物皆可烹饪",
    description: "输入菜名，开启你的厨神之路。食材，步骤，技巧，一张图搞定",
    images: ["https://wusimpl.fun/chef.png"], // 使用完整绝对 URL
    creator: "@AIRecipe",
  },

  // 网站图标
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

// 移动端视口配置
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white`}
      >
        <QueryClientWrapper>
          <div className="flex-1">{children}</div>
        </QueryClientWrapper>
        <footer className="w-full py-8 px-4 flex justify-end">
          <a
            href="https://github.com/wusimpl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
          >
            made by @wusimpl with ❤️
          </a>
        </footer>
      </body>
    </html>
  );
}
