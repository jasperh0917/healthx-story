import type { Metadata } from "next";
import "./globals.css";
import Toolbar from "@/components/Toolbar";
import Jas from "@/components/Jas";

export const metadata: Metadata = {
  title: "Healthx Story — Portfolio Performance, Insights & Outlook",
  description:
    "How our insurance portfolio performed — insights & outlook. A cinematic data story built on live policy data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.add("light")}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-ink text-slate-200 font-body antialiased">
        {children}
        <Toolbar />
        <Jas />
      </body>
    </html>
  );
}
