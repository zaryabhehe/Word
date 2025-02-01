import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../drizzle/db";
import { leaderboardTable, usersTable } from "../drizzle/schema";
import { AllowedChatSearchKey, AllowedChatTimeKey } from "../types";
import { getTimeFilter } from "../util/get-time-filter";

export async function getLeaderboardScores({
  chatId,
  searchKey,
  timeKey,
}: {
  chatId: string;
  searchKey: AllowedChatSearchKey;
  timeKey: AllowedChatTimeKey;
}) {
  const conditions = [
    searchKey === "group" ? eq(leaderboardTable.chatId, chatId) : undefined,
    getTimeFilter(timeKey),
  ].filter(Boolean);

  return db
    .select({
      userId: usersTable.telegramUserId,
      name: usersTable.name,
      username: usersTable.username,
      totalScore: sql<number>`cast(sum(${leaderboardTable.score}) as integer)`,
    })
    .from(leaderboardTable)
    .where(and(...conditions))
    .groupBy(usersTable.telegramUserId, usersTable.name, usersTable.username)
    .innerJoin(usersTable, eq(usersTable.id, leaderboardTable.userId))
    .orderBy(desc(sql`sum(${leaderboardTable.score})`))
    .limit(20)
    .execute();
}
