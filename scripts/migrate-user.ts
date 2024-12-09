import { desc, sql } from "drizzle-orm";
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

await db.insert(usersTable).values(filteredUniqueUsers).onConflictDoNothing();
process.exit();
