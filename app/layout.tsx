import type { Metadata } from "next";
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
  title: "Rocket League HUD",
  description: "Application desktop de HUD temps réel pour Rocket League, connectée directement aux données du jeu via la Stats API officielle. Le projet utilise Next.js, React, TypeScript et WebSockets pour récupérer l’état des matchs, suivre les joueurs et afficher leurs statistiques en temps réel dans une interface destinée à évoluer vers un overlay en jeu.",
  authors: [{ name: "Jesstixk" }, { name: "Alibaba" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
