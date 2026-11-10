import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { themeBootstrap } from "../lib/portal-theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FITA Regolamento",
  appleWebApp: { capable: true, title: "FITA Regolamento" },
  icons: { apple: [{ url: "/app-icon/180", sizes: "180x180", type: "image/png" }] },
  description: "Portale del regolamento e dei materiali per gli arbitri FITA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{ variables: {
          colorBackground: "var(--portal-card)",
          colorForeground: "var(--foreground)",
          colorInput: "var(--portal-input)",
          colorInputForeground: "var(--foreground)",
          colorMutedForeground: "var(--portal-muted)",
          colorBorder: "var(--portal-border)",
        } }}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
