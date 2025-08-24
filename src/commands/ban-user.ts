import { Composer } from "grammy";
import { eq } from "drizzle-orm";

import { env } from "../config/env";
import { db } from "../drizzle/db";
import { bannedUsersTable, usersTable } from "../drizzle/schema";

const composer = new Composer();

// Helper: check admin
function isAdmin(userId: number) {
  return env.ADMIN_USERS.includes(userId);
}

// /gban command
composer.command("gban", async (ctx) => {
  if (!ctx.from) return;

  if (!isAdmin(ctx.from.id)) {
    return ctx.reply("🚫 You are not authorized to use this command.");
  }

  const target = ctx.match?.trim();
  if (!target) return ctx.reply("Usage: /gban <user_id | @username>");

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

  // Check if already banned
  const [already] = await db
    .select()
    .from(bannedUsersTable)
    .where(eq(bannedUsersTable.userId, user.id));

  if (already) return ctx.reply(`⚠️ ${user.name} is already globally banned.`);

  await db.insert(bannedUsersTable).values({ userId: user.id });

  ctx.reply(`✅ Globally banned ${user.name} (${user.telegramUserId})`);
});

// /ungban command
composer.command("ungban", async (ctx) => {
  if (!ctx.from) return;

  if (!isAdmin(ctx.from.id)) {
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

  await db
    .delete(bannedUsersTable)
    .where(eq(bannedUsersTable.userId, user.id));

  ctx.reply(`✅ Removed global ban for ${user.name} (${user.telegramUserId})`);
});

// Middleware: block banned users everywhere
composer.use(async (ctx, next) => {
  if (!ctx.from) return;

  const [banned] = await db
    .select()
    .from(bannedUsersTable)
    .where(eq(bannedUsersTable.userId, ctx.from.id));

  if (banned) {
    return ctx.reply("🚫 You are globally banned from using this bot.");
  }

  return next();
});

export const gbanCommand = composer;