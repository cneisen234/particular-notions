// drizzle-kit configuration, used by the `db:*` scripts to generate and apply
// migrations from lib/db/schema.ts.
//
// The CLI runs outside Next.js, so it doesn't load .env.local by itself; it's
// loaded here. Migrations use the direct (non-pooled) connection when there is
// one: schema changes run as a single session.

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const migrationUrl = process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error("Set POSTGRES_URL_NON_POOLING (preferred) or DATABASE_URL in .env.local before running drizzle-kit.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: migrationUrl },
  strict: true,
  verbose: true,
});
