import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";
import { performance } from "perf_hooks";

import { env } from "../config/env";
import { db } from "../drizzle/db";
import { bannedUsersTable, usersTable } from "../drizzle/schema";

const composer = new Composer();

// Utility: Check admin
function isAdmin(ctx: any) {
  return ctx.from && env.ADMIN_USERS.includes(ctx.from.id);
}

// Utility: Format user
function formatUser(user: any) {
  return `👤 Name: ${user.name}\n🆔 ID: <code>${user.telegramUserId}</code>\n🔗 Username: ${
    user.username ? "@" + user.username : "No Username"
  }`;
}

// Utility: Current time
function nowUTC() {
  return new Date().toISOString().replace("T", " ").split(".")[0] + " UTC";
}

// Delete button
const deleteKeyboard = new InlineKeyboard().text("🗑 Delete", "delete");

// --- /gban ---
composer.command("gban", async (ctx) => {
  if (!ctx.from || ctx.chat.type !== "private") return;
  if (!isAdmin(ctx)) return;

  if (!ctx.match) return ctx.reply("⚠️ Provide a user ID or username.");

  const t0 = performance.now();

  const isUsername = ctx.match.startsWith("@");
  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isUsername
        ? eq(usersTable.username, ctx.match.substring(1))
        : eq(usersTable.telegramUserId, ctx.match),
    );

  if (!user) return ctx.reply("❌ Can't find that user in database.");

  await db.insert(bannedUsersTable).values({ userId: user.id }).onConflictDoNothing();

  const t1 = performance.now();
  const execTime = ((t1 - t0) / 1000).toFixed(2);

  return ctx.reply(
    `📡 Applying Global Ban to all chats...\n💾 Saving ban records...\n✅ Global Ban Successful\n\n${formatUser(
      user,
    )}\n⚡ Action: <b>Global Ban</b>\n👑 By: <b>${ctx.from.first_name}</b>\n⏱ Time Taken: ${execTime}s\n📅 Time: ${nowUTC()}`,
    { parse_mode: "HTML", reply_markup: deleteKeyboard },
  );
});

// --- /ungban ---
composer.command("ungban", async (ctx) => {
  if (!ctx.from || ctx.chat.type !== "private") return;
  if (!isAdmin(ctx)) return;

  if (!ctx.match) return ctx.reply("⚠️ Provide a user ID or username.");

  const t0 = performance.now();

  const isUsername = ctx.match.startsWith("@");
  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isUsername
        ? eq(usersTable.username, ctx.match.substring(1))
        : eq(usersTable.telegramUserId, ctx.match),
    );

  if (!user) return ctx.reply("❌ Can't find that user in database.");

  await db.delete(bannedUsersTable).where(eq(bannedUsersTable.userId, user.id));

  const t1 = performance.now();
  const execTime = ((t1 - t0) / 1000).toFixed(2);

  return ctx.reply(
    `📡 Removing Global Ban from system...\n💾 Updating records...\n✅ Unban Successful\n\n${formatUser(
      user,
    )}\n⚡ Action: <b>Unban</b>\n👑 By: <b>${ctx.from.first_name}</b>\n⏱ Time Taken: ${execTime}s\n📅 Time: ${nowUTC()}`,
    { parse_mode: "HTML", reply_markup: deleteKeyboard },
  );
});

// --- /gbanned list ---
composer.command("gbanned", async (ctx) => {
  if (!ctx.from || ctx.chat.type !== "private") return;
  if (!isAdmin(ctx)) return;

  const banned = await db
    .select()
    .from(bannedUsersTable)
    .innerJoin(usersTable, eq(bannedUsersTable.userId, usersTable.id));

  if (banned.length === 0) {
    return ctx.reply("🟢 No globally banned users.", {
      reply_markup: deleteKeyboard,
    });
  }

  let list = "🔰 <b>Globally Banned Users</b>\n═══════════════════════\n";
  banned.forEach((entry, i) => {
    const u = entry.users;
    list += `➤ ${i + 1}. ${u.name} ${u.username ? "@" + u.username : "No Username"}\n   🆔 <code>${u.telegramUserId}</code>\n───────────────────────\n`;
  });
  list += "⚠️ Use with caution! Global actions affect all groups where the bot is present.";

  return ctx.reply(list, { parse_mode: "HTML", reply_markup: deleteKeyboard });
});

// --- Delete handler ---
composer.callbackQuery("delete", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.answerCallbackQuery();
});

export const gbanCommand = composer;