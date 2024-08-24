import { env } from "../env";
import * as schema from "./schema";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(env.DATABASE_URI);

export const db = drizzle(sql, {
  schema,
  logger: env.NODE_ENV === "development",
});
