import type { Metadata } from "next";
import { CartProvider } from "@/components/order/CartProvider";
import Storefront from "@/components/order/Storefront";
import { getShop } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Order Online — Particular Notions",
  description:
    "Order fresh sourdough and baked goods from Particular Notions for pickup or local delivery.",
};

// Products, prices and what's left today come from the database on every visit.
export const dynamic = "force-dynamic";

export default async function OrderPage() {
  return (
    <CartProvider shop={await getShop()}>
      <Storefront />
    </CartProvider>
  );
}
