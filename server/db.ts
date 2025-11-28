import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Format: mysql://user:password@host/database",
  );
}

// Parse DATABASE_URL for MySQL connection
const url = new URL(
  process.env.DATABASE_URL || "mysql://root@localhost/quick_app",
);
const pool = createPool({
  host: url.hostname || "localhost",
  user: url.username || "root",
  password: url.password || "",
  database: url.pathname?.slice(1) || "quick_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle({ client: pool, schema, mode: "default" });
