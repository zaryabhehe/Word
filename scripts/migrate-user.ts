import { sql } from "drizzle-orm";
import { leaderboardTable, usersTable } from "../api/drizzle/schema";
import { db } from "../api/drizzle/db";

const uniqueUsers = await db
  .selectDistinct({
    name: leaderboardTable.name,
    username: leaderboardTable.username,
    telegramUserId: leaderboardTable.userId,
  })
  .from(leaderboardTable)
  .groupBy(
    leaderboardTable.userId,
    leaderboardTable.name,
    leaderboardTable.username
  );

console.log(uniqueUsers);
await db.insert(usersTable).values(uniqueUsers);
