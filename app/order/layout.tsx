import type { ReactNode } from "react";

// Wraps the online-ordering pages (/order and /order/checkout) in the bakery
// background, overriding the default site background for this section.
export default function OrderLayout({ children }: { children: ReactNode }) {
  return <div className="bakery-bg">{children}</div>;
}
