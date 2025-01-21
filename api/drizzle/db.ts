import { env } from "../env";
import * as schema from "./schema";

//import { drizzle } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(env.DATABASE_URI, {
  schema,
  logger: env.NODE_ENV === "development",
});
