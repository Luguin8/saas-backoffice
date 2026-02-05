import type { Metadata } from "next";
import { Geist, Geist_Mono, Revalia } from "next/font/google"; // 1. Importar Revalia
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Configurar Revalia
const revalia = Revalia({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-revalia", // Variable CSS para usarla
});

// 3. Metadata Actualizada (Título de pestaña)
export const metadata: Metadata = {
  title: "Cajix | Tu Pyme bajo control",
  description: "Sistema de gestión financiera inteligente.",
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        // 4. Agregar la variable al body
        className={`${geistSans.variable} ${geistMono.variable} ${revalia.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}