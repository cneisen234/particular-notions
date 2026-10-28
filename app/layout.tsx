import type { Metadata } from "next";
import { Cormorant_Garamond, Quicksand, Nunito_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { connection } from "next/server";
import { LenaForCustomers, getSiteNav } from "@/lib/pilot-light";

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
  title: "Megan’s Sourdough — Fresh Sourdough, Baked to Order",
  description:
    "Megan’s Sourdough bakes naturally leavened loaves, scones, and cookies by hand in small batches — made fresh to order for pickup or local delivery.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Every page renders on request, so the menu follows the add-ons the moment
  // they're switched in Pilot Light (a page built at deploy would keep its menu).
  await connection();
  // Each page with the Pilot Light add-on behind it: the site module leaves out
  // the ones that are off (docs/site-conventions.md §4, in Pilot Light).
  const nav = await getSiteNav([
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/order", label: "Order", addon: "ecommerce" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ]);

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${quicksand.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navigation links={nav.links} />
        {children}
        <Footer columns={nav.footer} />
        {/* The chat with the shop (Pilot Light's Lena for customers, with Lena's answers off: messages wait for Megan). */}
        <LenaForCustomers />
      </body>
    </html>
  );
}
