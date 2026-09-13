// Shop-wide configuration for the Particular Notions online store.
//
// There is NO database and NO admin portal. This file (plus lib/inventory.ts) is
// the single source of truth for how the store behaves. To change something,
// edit the values here and redeploy.

export type DeliveryArea = {
  /** Two-letter state code deliveries are limited to. */
  state: string;
  /** Towns eligible for delivery (matched case-insensitively at checkout). */
  cities: string[];
  /** ZIP codes eligible for delivery. */
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
  /** Master on/off switch for online ordering. Set false to pause the store. */
  acceptingOrders: boolean;
  /** Shown to customers when acceptingOrders is false. */
  pausedMessage: string;

  /** Flat delivery fee (integer cents). Delivery only — pickup is free. */
  deliveryFeeCents: number;
  /**
   * Subtotal (integer cents) at/above which the delivery fee is waived. Set to a
   * very large number to effectively disable free delivery.
   */
  freeDeliveryThresholdCents: number;
  /**
   * Card surcharge in basis points (300 = 3%). Applied to (subtotal + delivery
   * fee) for card orders; waived entirely for cash.
   */
  cardSurchargeBps: number;

  /**
   * Same-day order cutoff hour (0-23, local time). Orders placed BEFORE this
   * hour are fulfilled next day; orders at/after it roll to the day after next.
   */
  orderCutoffHour: number;
  /** IANA timezone the cutoff and "next day" are computed in. */
  timeZone: string;

  /** Where pickup orders are collected. Shown at checkout for pickup orders. */
  pickup: PickupLocation;

  /** Geographic limits for delivery orders (validated at checkout). */
  delivery: DeliveryArea;

  /** Which payment methods customers may choose. */
  payments: {
    card: boolean;
    cash: boolean;
  };
};

export const shopConfig: ShopConfig = {
  acceptingOrders: true,
  pausedMessage:
    "Online ordering is paused right now — check back soon, or email us to ask about an order.",

  deliveryFeeCents: 300, // $3.00 flat, delivery only
  freeDeliveryThresholdCents: 5000, // free delivery on subtotals >= $50
  cardSurchargeBps: 300, // 3% card surcharge, waived for cash

  orderCutoffHour: 18, // 6:00 PM — later orders roll to the day after next
  timeZone: "America/Detroit", // Michigan (Eastern)

  pickup: {
    label: "Pickup at our house",
    addressLine: "3101 E Miller Rd",
    city: "Fairview",
    state: "MI",
    zip: "48621",
  },

  delivery: {
    state: "MI",
    cities: ["Fairview", "Mio"],
    zips: ["48621", "48647"],
  },

  payments: {
    card: true,
    cash: true,
  },
};
