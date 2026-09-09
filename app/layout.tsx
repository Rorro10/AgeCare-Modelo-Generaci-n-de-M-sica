import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Director Musical — AgeCare",
  description:
    "Módulo de generación de música por gestos para AgeCare (proyecto GPI UTEM 2026-II).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
