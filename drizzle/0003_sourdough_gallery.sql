-- The shop is all sourdough now: the charm photos seeded in 0001_seed.sql leave the Gallery (matched by their alt text, since their image URLs changed when they moved to UploadThing), and the bake photos from the store take their place.
DELETE FROM "gallery_photos" WHERE "alt_text" IN (
  'A stand of handmade charm clips on kraft cards',
  'Word charms spelling LOVE, JOY, PEACE, HOPE and PRAY',
  'Frosted agate bead charm with a gold leaf',
  'Sky-blue tassel charm with a pearl drop',
  'A gold display tree hung with beaded charms',
  'Charm of stacked slate discs with red accents',
  'Mint glass jade charm',
  'A wall display of word charms',
  'Pearl with yellow accent beads',
  'Peach wood bead charm with knotted cord',
  'Frosted floral bead charm with a pink tassel',
  'White swirl bead charm with a green tassel',
  'Rose tassel charm with a gilded bead',
  'Playful little fish-in-a-bag charm'
);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/sourdoughbread.webp','A sliced sourdough sandwich loaf beside a bagged loaf',0);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/Jalapeno-cheddar.webp','Sliced jalapeño cheddar sourdough with fresh jalapeños and shredded cheddar',1);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/Italian-herb.webp','Sliced Italian herb sourdough with sprigs of herbs',2);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/ChocolateChipScone.webp','Chocolate chip sourdough scone with scattered chocolate chips',3);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/cinn-rais-scone.webp','Cinnamon raisin sourdough scone with cinnamon sticks and raisins',4);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/lemon-scone.webp','Lemon scone with lemon slices and zest',5);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/ChocolateChipCookies.webp','Chocolate chip sourdough cookies with scattered chocolate chips',6);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/sugar-cookie.webp','Sugar sourdough cookies beside a sprinkle of sugar',7);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/store/caramel-sugar.webp','Salted caramel sourdough cookies with caramel chips and sea salt',8);
