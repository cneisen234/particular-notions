-- Bread can also be ordered as a 2-pack ($18 plain, $21 Jalapeño Cheddar and Italian Herb) and scones as a 4-pack ($11 plain, $14 the rest). Only cookies keep 6- and 12-packs.
ALTER TABLE "products" ADD COLUMN "two_pack_price_cents" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "four_pack_price_cents" integer;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_two_pack_price_nonnegative" CHECK ("products"."two_pack_price_cents" is null or "products"."two_pack_price_cents" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_four_pack_price_nonnegative" CHECK ("products"."four_pack_price_cents" is null or "products"."four_pack_price_cents" >= 0);--> statement-breakpoint
UPDATE "products" SET "two_pack_price_cents" = CASE WHEN "id" = 'sourdough-sandwich-bread' THEN 1800 ELSE 2100 END WHERE "category_id" = 'sourdough-bread';--> statement-breakpoint
UPDATE "products" SET "four_pack_price_cents" = CASE WHEN "id" = 'plain-sourdough-scone' THEN 1100 ELSE 1400 END WHERE "category_id" = 'scones';--> statement-breakpoint
UPDATE "products" SET "six_pack_price_cents" = NULL, "twelve_pack_price_cents" = NULL WHERE "category_id" <> 'cookies';
