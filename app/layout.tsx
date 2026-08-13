import type { Metadata } from "next";
import { Cormorant_Garamond, Quicksand, Nunito_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Particular Notions — Handmade Charms & Keychains by Megan",
  description:
    "Particular Notions is a collection of handmade beaded charms, keychains, and little treasures — each one made by hand by Megan. Uniquely creative, individually expressive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${quicksand.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
