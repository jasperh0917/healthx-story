// Jasper — live read-connection to the WellX "Policy Database" (Supabase Postgres).
// ---------------------------------------------------------------------------
// This is the runtime "live link" the Jasper renewal screens read through. It
// reuses the SAME connection the data-refresh generator uses (SUPABASE_DB_URL),
// so we are not standing up a second data connection — just reading the one that
// already exists, on demand instead of at build time.
//
// SERVER-SIDE ONLY. Never import this into a client component — the connection
// string is a secret and must never reach the browser.

import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error(
      "SUPABASE_DB_URL is not set. Add it to .env.local — copy it from " +
        "Supabase → Project Settings → Database → Connection string (URI) — " +
        "then restart `npm run dev`.",
    );
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

/** Run a read query against the Policy Database and return the rows. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}
