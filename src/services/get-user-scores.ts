import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "../drizzle/db";
import { leaderboardTable, usersTable } from "../drizzle/schema";
import { AllowedChatSearchKey, AllowedChatTimeKey } from "../types";
import { getTimeFilter } from "../util/get-time-filter";

export async function getUserScores({
  chatId,
  searchKey,
  userId,
  timeKey,
}: {
  chatId: string;
  searchKey: AllowedChatSearchKey;
  userId: string;
  timeKey: AllowedChatTimeKey;
}) {
  let conditions = [
    searchKey === "group" ? eq(leaderboardTable.chatId, chatId) : undefined,
    getTimeFilter(timeKey),
  ].filter(Boolean);

  const [{ totalLeaderboards }] = await db
    .select({ totalLeaderboards: count(leaderboardTable.userId) })
    .from(leaderboardTable)
    .where(and(...conditions));

  if (totalLeaderboards === 0) return null;

  const leaderboardData = db
    .select({
      count: count(leaderboardTable.userId),
      userId: leaderboardTable.userId,
      totalScore:
        sql<number>`cast(sum(${leaderboardTable.score}) as integer)`.as(
          "totalScore",
        ),
      rank: sql<number>`cast(RANK() OVER (ORDER BY sum(${leaderboardTable.score}) DESC) as integer)`.as(
        "rank",
      ),
    })
    .from(leaderboardTable)
    .where(and(...conditions))
    .groupBy(leaderboardTable.userId)
    .as("leaderboards");

  return db
    .select({
      userId: usersTable.telegramUserId,
      name: usersTable.name,
      username: usersTable.username,
      totalScore: leaderboardData.totalScore,
      rank: leaderboardData.rank,
    })
    .from(leaderboardData)
    .where(and(eq(usersTable.telegramUserId, userId)))
    .groupBy(
      usersTable.telegramUserId,
      usersTable.name,
      usersTable.username,
      leaderboardData.rank,
      leaderboardData.totalScore,
    )
    .innerJoin(usersTable, eq(usersTable.id, leaderboardData.userId))
    .orderBy(desc(sql`sum(${leaderboardData.totalScore})`))
    .limit(20);
}
