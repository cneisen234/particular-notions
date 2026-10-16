// Moves the store's photos from the site's folder (public/) to UploadThing, the
// one UploadThing every Kindling app shares, and points the database at them.
// Re-runnable: only photos still at a local path ("/...") are uploaded.
//
//   npx tsx --conditions=react-server --env-file=.env.local scripts/upload-photos.ts

import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq, like } from "drizzle-orm";
import { UTApi, UTFile } from "uploadthing/server";
import { db } from "@/lib/db";
import { galleryPhotos, products } from "@/lib/db/schema";

const api = new UTApi();

async function upload(localPath: string): Promise<string> {
  const file = path.join(process.cwd(), "public", localPath);
  const name = path.basename(localPath);
  const [res] = await api.uploadFiles([new UTFile([await readFile(file)], name, { type: "image/webp" })]);
  if (res.error || !res.data) throw new Error(`Couldn't upload ${name}: ${res.error?.message ?? "no response"}`);
  return res.data.ufsUrl;
}

async function main() {
  let done = 0;
  for (const p of await db.select({ id: products.id, imageUrl: products.imageUrl }).from(products).where(like(products.imageUrl, "/%"))) {
    await db.update(products).set({ imageUrl: await upload(p.imageUrl!), updatedAt: new Date() }).where(eq(products.id, p.id));
    done++;
  }
  for (const g of await db.select({ id: galleryPhotos.id, imageUrl: galleryPhotos.imageUrl }).from(galleryPhotos).where(like(galleryPhotos.imageUrl, "/%"))) {
    await db.update(galleryPhotos).set({ imageUrl: await upload(g.imageUrl), updatedAt: new Date() }).where(eq(galleryPhotos.id, g.id));
    done++;
  }
  console.log(`✓ ${done} photo${done === 1 ? "" : "s"} uploaded and saved.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
