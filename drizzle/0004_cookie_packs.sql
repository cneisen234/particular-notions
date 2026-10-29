-- Cookies can also be ordered as a 6-pack ($8) or a 12-pack ($15). Their regular pack size comes from the "(2-Pack)" in each name.
ALTER TABLE "order_items" ADD COLUMN "pack_size" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "daily_limit_used" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "pack_size" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "six_pack_price_cents" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "twelve_pack_price_cents" integer;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_pack_size_positive" CHECK ("products"."pack_size" is null or "products"."pack_size" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_six_pack_price_nonnegative" CHECK ("products"."six_pack_price_cents" is null or "products"."six_pack_price_cents" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_twelve_pack_price_nonnegative" CHECK ("products"."twelve_pack_price_cents" is null or "products"."twelve_pack_price_cents" >= 0);--> statement-breakpoint
UPDATE "products" SET "pack_size" = substring("name" from '\((\d+)-Pack\)')::int, "six_pack_price_cents" = 800, "twelve_pack_price_cents" = 1500 WHERE "category_id" = 'cookies';
