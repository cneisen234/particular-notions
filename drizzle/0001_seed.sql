-- The store's data as it was in lib/shop-config.ts, lib/inventory.ts and the Gallery page, so nothing changes for customers.
INSERT INTO "settings" ("id","accepting_orders","paused_message","delivery_fee_cents","free_delivery_threshold_cents","card_surcharge_bps","order_cutoff_hour","time_zone","default_lead_time_hours","pickup_label","pickup_address_line","pickup_city","pickup_state","pickup_zip","delivery_state","card_payments","cash_payments") VALUES (1,true,'Online ordering is paused right now — check back soon, or email us to ask about an order.',300,3000,300,18,'America/Detroit',24,'Pickup at our house','3101 E Miller Rd','Fairview','MI','48621','MI',true,true) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "delivery_towns" ("city","zip","sort_order") VALUES ('Comins','48619',0) ON CONFLICT ("city","zip") DO NOTHING;
--> statement-breakpoint
INSERT INTO "delivery_towns" ("city","zip","sort_order") VALUES ('Fairview','48621',1) ON CONFLICT ("city","zip") DO NOTHING;
--> statement-breakpoint
INSERT INTO "delivery_towns" ("city","zip","sort_order") VALUES ('Luzerne','48636',2) ON CONFLICT ("city","zip") DO NOTHING;
--> statement-breakpoint
INSERT INTO "delivery_towns" ("city","zip","sort_order") VALUES ('Mio','48647',3) ON CONFLICT ("city","zip") DO NOTHING;
--> statement-breakpoint
INSERT INTO "categories" ("id","name","description","sort_order") VALUES ('sourdough-bread','Sourdough Bread','Naturally leavened and baked fresh to order.',0) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "categories" ("id","name","description","sort_order") VALUES ('scones','Scones','Tender, buttery scones.',1) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "categories" ("id","name","description","sort_order") VALUES ('cookies','Cookies','Small-batch cookies, baked fresh to order.',2) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "categories" ("id","name","description","sort_order") VALUES ('quick-breads','Quick Breads','Moist mini loaves, baked fresh to order.',3) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('sourdough-sandwich-bread','sourdough-bread','Sourdough Sandwich Bread','A soft-crumb sandwich loaf with a gentle sourdough tang — perfect for toast and sandwiches.',1000,4,true,48,'/store/sourdoughbread.webp',0) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('jalapeno-cheddar-sourdough-sandwich-bread','sourdough-bread','Jalapeño Cheddar Sourdough Sandwich Bread','A soft-crumb sourdough loaf with sharp cheddar and a kick of jalapeño.',1200,4,true,48,'/store/Jalapeno-cheddar.webp',1) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('garden-herb-sourdough-sandwich-bread','sourdough-bread','Italian Herb Sourdough Sandwich Bread','A soft-crumb sourdough loaf baked with a blend of Italian herbs.',1200,4,true,48,'/store/Italian-herb.webp',2) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('blueberry-sourdough-scone','scones','Blueberry Sourdough Scone','Buttery sourdough scone studded with juicy blueberries.',400,24,true,NULL,NULL,3) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('chocolate-chip-sourdough-scone','scones','Chocolate Chip Sourdough Scone','Buttery sourdough scone loaded with melty chocolate chips.',400,24,true,NULL,'/store/ChocolateChipScone.webp',4) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('plain-sourdough-scone','scones','Plain Sourdough Scone','A classic buttery sourdough scone — simple and tender.',300,24,true,NULL,NULL,5) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('lemon-sourdough-scone','scones','Lemon Scone','Bright, zesty lemon folded into a tender scone.',400,24,true,NULL,'/store/lemon-scone.webp',6) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('cinnamon-raisin-sourdough-scone','scones','Cinnamon Raisin Sourdough Scone','Warm cinnamon and plump raisins in a buttery sourdough scone.',400,24,true,NULL,'/store/cinn-rais-scone.webp',7) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('chocolate-chip-sourdough-cookies','cookies','Chocolate Chip Sourdough Cookies (2-Pack)','Two chewy sourdough cookies packed with chocolate chips.',200,24,true,NULL,'/store/ChocolateChipCookies.webp',8) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('sugar-sourdough-cookies','cookies','Sugar Sourdough Cookies (2-Pack)','Two soft, sweet sourdough sugar cookies.',200,24,true,NULL,'/store/sugar-cookie.webp',9) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('salted-caramel-sourdough-cookies','cookies','Salted Caramel Sourdough Cookies (2-Pack)','Two chewy sourdough cookies with gooey salted caramel.',200,24,true,NULL,'/store/caramel-sugar.webp',10) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('meringue-cookies','cookies','Meringue Cookies (6-Pack)','Six light, airy meringue cookies that melt in your mouth.',200,4,true,NULL,NULL,11) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('banana-bread-plain','quick-breads','Banana Bread Mini Loaf — Plain','A moist, tender mini loaf of classic banana bread.',400,4,true,NULL,NULL,12) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('banana-bread-apple','quick-breads','Banana Bread Mini Loaf — Apple','Moist banana bread mini loaf folded with sweet apple.',500,4,true,NULL,NULL,13) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('banana-bread-chocolate-chip','quick-breads','Banana Bread Mini Loaf — Chocolate Chip','Moist banana bread mini loaf loaded with chocolate chips.',500,4,true,NULL,NULL,14) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('zucchini-bread-plain','quick-breads','Zucchini Bread Mini Loaf — Plain','A moist, lightly spiced mini loaf of classic zucchini bread.',400,2,true,NULL,NULL,15) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "products" ("id","category_id","name","description","price_cents","daily_limit","available","lead_time_hours","image_url","sort_order") VALUES ('zucchini-bread-chocolate-chip','quick-breads','Zucchini Bread Mini Loaf — Chocolate Chip','Moist zucchini bread mini loaf with chocolate chips.',500,2,true,NULL,NULL,16) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/display-stand.webp','A stand of handmade charm clips on kraft cards',0);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/word-charms.webp','Word charms spelling LOVE, JOY, PEACE, HOPE and PRAY',1);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-agate.webp','Frosted agate bead charm with a gold leaf',2);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-tassel-blue.webp','Sky-blue tassel charm with a pearl drop',3);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/display-tree.webp','A gold display tree hung with beaded charms',4);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-disc.webp','Charm of stacked slate discs with red accents',5);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-jade.webp','Mint glass jade charm',6);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/word-charms-wall.webp','A wall display of word charms',7);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-yellow.webp','Pearl with yellow accent beads',8);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-wood.webp','Peach wood bead charm with knotted cord',9);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-floral.webp','Frosted floral bead charm with a pink tassel',10);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-white-green.webp','White swirl bead charm with a green tassel',11);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-tassel-pink.webp','Rose tassel charm with a gilded bead',12);
--> statement-breakpoint
INSERT INTO "gallery_photos" ("image_url","alt_text","sort_order") VALUES ('/charm-fish.webp','Playful little fish-in-a-bag charm',13);
