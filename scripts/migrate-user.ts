import { leaderboardTable, usersTable } from "../api/drizzle/schema";
import { db } from "../api/drizzle/db";
import { sql } from "drizzle-orm";

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

const filteredUniqueUsers = uniqueUsers.reduce((acc, entry) => {
  const existingUser = acc.find(
    (user) => user.telegramUserId === entry.telegramUserId
  );

  if (existingUser) {
    existingUser.name = entry.name;
    existingUser.username = entry.username;
  } else {
    acc.push({
      name: entry.name,
      username: entry.username,
      telegramUserId: entry.telegramUserId,
    });
  }

  return acc;
}, [] as typeof uniqueUsers);

// Insert all users
await db.insert(usersTable).values(filteredUniqueUsers).onConflictDoNothing();

await db
  .update(leaderboardTable)
  .set({
    tempUserId: sql`(SELECT id FROM ${usersTable} WHERE telegram_user_id = ${leaderboardTable.userId})`,
  })
  .where(sql`${leaderboardTable.userId} IS NOT NULL`);

process.exit();
