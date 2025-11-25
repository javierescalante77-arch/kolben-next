import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sfpro = localFont({
  src: [
    {
      path: "./fonts/sfpro-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/sfpro-bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-base",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kolben",
  description: "Panel Kolben",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${sfpro.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
