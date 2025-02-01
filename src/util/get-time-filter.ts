import { sql } from "drizzle-orm";

import { leaderboardTable } from "../drizzle/schema";
import { AllowedChatTimeKey } from "../types";

export function getTimeFilter(timeKey: AllowedChatTimeKey) {
  switch (timeKey) {
    case "today":
      return sql`date_trunc('day', ${leaderboardTable.createdAt}) = date_trunc('day', now())`;
    case "week":
      return sql`date_trunc('week', ${leaderboardTable.createdAt}) = date_trunc('week', now())`;
    case "month":
      return sql`date_trunc('month', ${leaderboardTable.createdAt}) = date_trunc('month', now())`;
    case "year":
      return sql`date_trunc('year', ${leaderboardTable.createdAt}) = date_trunc('year', now())`;
    case "all":
      return undefined;
  }
}
