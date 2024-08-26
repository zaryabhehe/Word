import { migrate } from "drizzle-orm/neon-http/migrator";

import { db } from "./db";

await migrate(db, { migrationsFolder: "./api/drizzle/migrations" });
process.exit(0);
