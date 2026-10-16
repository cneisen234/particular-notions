// How the store behaves: the shop settings, read from the database (lib/shop.ts)
// and managed in Pilot Light. Plain types only, so both the storefront (browser)
// and the checkout (server) can use them.

export type DeliveryArea = {
  /** Two-letter state code deliveries are limited to. */
  state: string;
  /** Towns eligible for delivery (matched case-insensitively at checkout). */
  cities: string[];
  /** ZIP codes eligible for delivery, in the same order as `cities`. */
  zips: string[];
};

export type PickupLocation = {
  /** Short label shown at checkout, e.g. "Pickup at our house". */
  label: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
};

export type ShopConfig = {
  /** Master on/off switch for online ordering. */
  acceptingOrders: boolean;
  /** Shown to customers when acceptingOrders is false. */
  pausedMessage: string;
  /** Flat delivery fee (integer cents). Delivery only — pickup is free. */
  deliveryFeeCents: number;
  /** Subtotal (integer cents) at/above which the delivery fee is waived. */
  freeDeliveryThresholdCents: number;
  /** Card surcharge in basis points (300 = 3%) of subtotal + delivery fee; none for cash. */
  cardSurchargeBps: number;
  /** Orders at/after this hour (0-23, local) roll to the day after next. */
  orderCutoffHour: number;
  /** IANA timezone the cutoff and "next day" are computed in. */
  timeZone: string;
  /** Advance notice (hours) an order needs, unless a product needs more. */
  defaultLeadTimeHours: number;
  /** Where pickup orders are collected. */
  pickup: PickupLocation;
  /** Geographic limits for delivery orders (validated at checkout). */
  delivery: DeliveryArea;
  /** Which payment methods customers may choose. */
  payments: { card: boolean; cash: boolean };
};
