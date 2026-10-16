// The store's database (Drizzle). Built from what lib/shop-config.ts and
// lib/inventory.ts used to hold as code, plus the orders the site now saves.
// Pilot Light manages these tables for the owner; the site reads them.

import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", ["new", "preparing", "ready", "out_for_delivery", "completed", "cancelled", "refunded"]);
export const fulfillmentMethod = pgEnum("fulfillment_method", ["pickup", "delivery"]);
export const paymentMethod = pgEnum("payment_method", ["card", "cash"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);

// ---- Catalog ----

export const categories = pgTable("categories", {
  // A slug for the original categories (e.g. "sourdough-bread"); new ones made in Pilot Light get a random id.
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    // A slug for the original products (e.g. "classic-sourdough"); new ones made in Pilot Light get a random id.
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceCents: integer("price_cents").notNull(),
    // How many can be ordered for each pickup/delivery day; saved orders count it
    // down for their day (sold out at 0).
    dailyLimit: integer("daily_limit").notNull().default(0),
    // Off regardless of the daily limit (e.g. a temporary pause).
    available: boolean("available").notNull().default(true),
    // Advance notice in hours; null uses the shop's default.
    leadTimeHours: integer("lead_time_hours"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    check("products_price_nonnegative", sql`${t.priceCents} >= 0`),
    check("products_daily_limit_nonnegative", sql`${t.dailyLimit} >= 0`),
  ],
);

// ---- Shop settings (one row) ----

export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    acceptingOrders: boolean("accepting_orders").notNull().default(true),
    pausedMessage: text("paused_message").notNull().default(""),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    // Subtotal at or above which delivery is free.
    freeDeliveryThresholdCents: integer("free_delivery_threshold_cents").notNull().default(0),
    // Card fee in basis points (300 = 3%) of subtotal + delivery; none for cash.
    cardSurchargeBps: integer("card_surcharge_bps").notNull().default(0),
    // Orders at or after this hour (0-23, local) roll an extra day.
    orderCutoffHour: integer("order_cutoff_hour").notNull().default(18),
    timeZone: text("time_zone").notNull().default("America/Detroit"),
    defaultLeadTimeHours: integer("default_lead_time_hours").notNull().default(24),
    pickupLabel: text("pickup_label").notNull().default(""),
    pickupAddressLine: text("pickup_address_line").notNull().default(""),
    pickupCity: text("pickup_city").notNull().default(""),
    pickupState: text("pickup_state").notNull().default(""),
    pickupZip: text("pickup_zip").notNull().default(""),
    // Deliveries stay in this state, to the towns in delivery_towns.
    deliveryState: text("delivery_state").notNull().default(""),
    cardPayments: boolean("card_payments").notNull().default(true),
    cashPayments: boolean("cash_payments").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("settings_singleton", sql`${t.id} = 1`),
    check("settings_cutoff_hour", sql`${t.orderCutoffHour} between 0 and 23`),
  ],
);

export const deliveryTowns = pgTable(
  "delivery_towns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    city: text("city").notNull(),
    zip: text("zip").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("delivery_towns_city_zip_key").on(t.city, t.zip)],
);

// ---- Orders ----

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shortId: text("short_id").notNull(), // 8-character number shown to the customer and the shop
    status: orderStatus("status").notNull().default("new"),
    method: fulfillmentMethod("method").notNull(),
    // The day it's picked up or delivered (the shop's time zone).
    fulfillmentDate: date("fulfillment_date").notNull(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone"),
    note: text("note"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    cardSurchargeCents: integer("card_surcharge_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_short_id_key").on(t.shortId),
    index("orders_status_idx").on(t.status),
    index("orders_fulfillment_date_idx").on(t.fulfillmentDate),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // The live product (nulled if it's later deleted); name and price are kept as sold.
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    qty: integer("qty").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethod("method").notNull(),
    // Card: Square's payment. Cash: none; it's completed when the shop marks it paid.
    squarePaymentId: text("square_payment_id"),
    status: paymentStatus("status").notNull().default("pending"),
    amountCents: integer("amount_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payments_square_id_key").on(t.squarePaymentId), index("payments_order_idx").on(t.orderId)],
);

// ---- Gallery ----

export const galleryPhotos = pgTable("gallery_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  // Read aloud by screen readers; describes the photo.
  altText: text("alt_text").notNull().default(""),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
