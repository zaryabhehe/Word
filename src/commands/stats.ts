import { Composer } from "grammy";

import { count, countDistinct } from "drizzle-orm";

import { env } from "../config/env";
import { db } from "../drizzle/db";
import { leaderboardTable, usersTable } from "../drizzle/schema";

const composer = new Composer();

composer.command("stats", async (ctx) => {
  if (!ctx.from) return;

  if (!env.ADMIN_USERS.includes(ctx.from.id)) return;

  const [{ usersCount }] = await db
    .select({ usersCount: count(usersTable.id) })
    .from(usersTable);
  const [{ groupsCount }] = await db
    .select({ groupsCount: countDistinct(leaderboardTable.chatId) })
    .from(leaderboardTable);

  return ctx.reply(`Total Users: ${usersCount}\nTotal Groups: ${groupsCount}`);
});

export const statsCommand = composer;
