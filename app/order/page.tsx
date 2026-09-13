import type { Metadata } from "next";
import { CartProvider } from "@/components/order/CartProvider";
import Storefront from "@/components/order/Storefront";

export const metadata: Metadata = {
  title: "Order Online — Particular Notions",
  description:
    "Order fresh sourdough and baked goods from Particular Notions for next-day pickup or local delivery in Fairview and Mio.",
};

export default function OrderPage() {
  return (
    <CartProvider>
      <Storefront />
    </CartProvider>
  );
}
