import type { Metadata } from "next";
import { CartProvider } from "@/components/order/CartProvider";
import CheckoutForm from "@/components/order/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout — Particular Notions",
};

export default function CheckoutPage() {
  // Square Application ID + Location ID are public identifiers used by the
  // browser Web Payments SDK; the server reads them here and passes them down.
  // The access token stays server-only (used at charge time in Step 5).
  return (
    <CartProvider>
      <CheckoutForm
        appId={process.env.SQUARE_APPLICATION_ID ?? ""}
        locationId={process.env.SQUARE_LOCATION_ID ?? ""}
        squareEnv={process.env.SQUARE_ENV ?? "sandbox"}
      />
    </CartProvider>
  );
}
