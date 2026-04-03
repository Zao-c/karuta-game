import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "二次元歌牌 2.0 | Anime Karuta Vibe Edition",
  description: "听声辨角 - 二次元角色歌牌游戏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
