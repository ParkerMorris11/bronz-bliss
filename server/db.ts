/**
 * db.ts — dual-mode database connection
 *
 * LOCAL (no DATABASE_URL):  SQLite via better-sqlite3
 * PRODUCTION (DATABASE_URL): PostgreSQL via pg
 *
 * Drizzle's query API is identical across both drivers,
 * so the rest of the codebase stays unchanged.
 */

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import Database from "better-sqlite3";
import pg from "pg";

function createDb() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    // ── Production: PostgreSQL ─────────────────────────────────────────────
    const pool = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    return { db: drizzlePg(pool), isPostgres: true, pool };
  }

  // ── Local: SQLite ──────────────────────────────────────────────────────
  const sqlite = new Database("bronzbliss.db");
  return { db: drizzleSqlite(sqlite), isPostgres: false, sqlite };
}

export const { db, isPostgres, pool, sqlite } = createDb() as any;
