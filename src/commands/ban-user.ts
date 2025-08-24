import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";

import { env } from "../config/env";
import { db } from "../drizzle/db";
import { bannedUsersTable, usersTable } from "../drizzle/schema";

const composer = new Composer();
const deleteKeyboard = new InlineKeyboard().text("🗑 Delete", "delete");

// Helper: check admin
function isAdmin(userId: number) {
  return env.ADMIN_USERS.includes(userId);
}

// --- /gban ---
composer.command("gban", async (ctx) => {
  if (!ctx.from) return;
  if (!isAdmin(ctx.from.id)) return ctx.reply("🚫 You are not authorized.");

  const args = ctx.message?.text?.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("⚠️ Usage: /gban <user_id | @username>");

  const isUsername = args.startsWith("@");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isUsername
        ? eq(usersTable.username, args.substring(1))
        : eq(usersTable.telegramUserId, Number(args)),
    );

  if (!user) return ctx.reply("❌ Can't find that user in database.");

  const [already] = await db
    .select()
    .from(bannedUsersTable)
    .where(eq(bannedUsersTable.userId, user.id));

  if (already) return ctx.reply(`⚠️ ${user.name} is already globally banned.`);

  await db.insert(bannedUsersTable).values({ userId: user.id });

  ctx.reply(
    `✅ Globally banned ${user.name} (${user.telegramUserId})`,
    { reply_markup: deleteKeyboard }
  );
});

// --- /ungban ---
composer.command("ungban", async (ctx) => {
  if (!ctx.from) return;
  if (!isAdmin(ctx.from.id)) return ctx.reply("🚫 You are not authorized.");

  const args = ctx.message?.text?.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("⚠️ Usage: /ungban <user_id | @username>");

  const isUsername = args.startsWith("@");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isUsername
        ? eq(usersTable.username, args.substring(1))
        : eq(usersTable.telegramUserId, Number(args)),
    );

  if (!user) return ctx.reply("❌ Can't find that user in database.");

  await db.delete(bannedUsersTable).where(eq(bannedUsersTable.userId, user.id));

  ctx.reply(
    `✅ Removed global ban for ${user.name} (${user.telegramUserId})`,
    { reply_markup: deleteKeyboard }
  );
});

// --- Middleware: block banned users anywhere ---
composer.use(async (ctx, next) => {
  if (!ctx.from) return;

  const [banned] = await db
    .select()
    .from(bannedUsersTable)
    .where(eq(bannedUsersTable.userId, ctx.from.id));

  if (banned) return ctx.reply("🚫 You are globally banned from using this bot.");

  return next();
});

// --- Delete callback ---
composer.callbackQuery("delete", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.answerCallbackQuery();
});

export const gbanCommand = composer;