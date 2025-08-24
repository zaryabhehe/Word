import { Composer } from "grammy";
import { eq } from "drizzle-orm";

import { env } from "../config/env";
import { db } from "../drizzle/db";
import { bannedUsersTable, usersTable } from "../drizzle/schema";

const composer = new Composer();

// /ungban command (works in groups + PMs)
composer.command("ungban", async (ctx) => {
  if (!ctx.from) return;

  if (!env.ADMIN_USERS.includes(ctx.from.id)) {
    return ctx.reply("🚫 You are not authorized to use this command.");
  }

  const target = ctx.match?.trim();
  if (!target) return ctx.reply("Usage: /ungban <user_id | @username>");

  const isUsername = target.startsWith("@");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isUsername
        ? eq(usersTable.username, target.substring(1))
        : eq(usersTable.telegramUserId, target),
    );

  if (!user) return ctx.reply("❌ Can't find that user in database.");

  await db.delete(bannedUsersTable).where(eq(bannedUsersTable.userId, user.id));

  ctx.reply(`✅ Removed global ban for ${user.name} (${user.telegramUserId})`);
});

export const ungbanCommand = composer;