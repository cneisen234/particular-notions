import type { Metadata } from "next";
import { CartProvider } from "@/components/order/CartProvider";
import CheckoutForm from "@/components/order/CheckoutForm";
import { getShop } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Checkout — Megan’s Sourdough",
};

// The shop's settings and what's left today come from the database on every visit.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Square Application ID + Location ID are public identifiers used by the
  // browser Web Payments SDK; the server reads them here and passes them down.
  // The access token stays server-only (used at charge time).
  return (
    <CartProvider shop={await getShop()}>
      <CheckoutForm
        appId={process.env.SQUARE_APPLICATION_ID ?? ""}
        locationId={process.env.SQUARE_LOCATION_ID ?? ""}
        squareEnv={process.env.SQUARE_ENV ?? "sandbox"}
      />
    </CartProvider>
  );
}
