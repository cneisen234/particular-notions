// Drizzle database client (server-only), as on Kindling's other sites: Neon's
// serverless Pool so transactions work. DATABASE_URL is the store's database
// (the pooled connection string).

import "server-only";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";

if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set: add the store database's pooled connection string to .env.local.");
}

const pool = new Pool({ connectionString });

/** The shared Drizzle client. */
export const db = drizzle(pool, { schema });
