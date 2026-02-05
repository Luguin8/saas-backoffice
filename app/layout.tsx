import type { Metadata } from "next";
import { Geist, Geist_Mono, Revalia } from "next/font/google"; // Importamos Revalia
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configuración de la fuente de marca
const revalia = Revalia({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-revalia", // Variable CSS
});

export const metadata: Metadata = {
  title: "Cajix | Tu Pyme bajo control",
  description: "Sistema de gestión financiera inteligente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        // Inyectamos las variables de fuente aquí
        className={`${geistSans.variable} ${geistMono.variable} ${revalia.variable} antialiased bg-slate-50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}