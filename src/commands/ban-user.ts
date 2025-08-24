import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";
import { performance } from "perf_hooks";

import { env } from "../config/env";
import { db } from "../drizzle/db";
import { bannedUsersTable, usersTable } from "../drizzle/schema";

const composer = new Composer();

// --- Utils ---
function isAdmin(ctx: any) {
  return ctx.from && env.ADMIN_USERS.includes(ctx.from.id);
}

function formatUser(user: any) {
  return `👤 Name: ${user.name}
🆔 ID: <code>${user.telegramUserId}</code>
🔗 Username: ${user.username ? "@" + user.username : "No Username"}`;
}

function nowUTC() {
  return new Date().toISOString().replace("T", " ").split(".")[0] + " UTC";
}

const deleteKeyboard = new InlineKeyboard().text("🗑 Delete", "delete");

// --- /gban ---
composer.command("gban", async (ctx) => {
  if (!ctx.from || ctx.chat.type !== "private") return;
  if (!isAdmin(ctx)) return;

  const args = ctx.message?.text?.split(" ").slice(1).join(" ");
  if (!args) return ctx.reply("⚠️ Provide a user ID or username.");

  const t0 = performance.now();

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

  await db
    .insert(bannedUsersTable)
    .values({ userId: user.id })
    .onConflictDoNothing();

  const t1 = performance.now();
  const execTime = ((t1 - t0) / 1000).toFixed(2);

  return ctx.reply(
    `📡 Applying Global Ban to all chats...
💾 Saving ban records...
✅ Global Ban Successful

${formatUser(user)}
⚡ Action: <b>Global Ban</b>
👑 By: <b>${ctx.from.first_name}</b>
⏱ Time Taken: ${execTime}s
📅 Time: ${nowUTC()}`,
    { parse_mode: "HTML", reply_markup: deleteKeyboard },
  );
});

// --- /ungban ---
composer.command("ungban", async (ctx) => {
  if (!ctx.from || ctx.chat.type !== "private") return;
  if (!isAdmin(ctx)) return;

  const args = ctx.message?.text?.split(" ").slice(1).join(" ");
  if (!args) return ctx.reply("⚠️ Provide a user ID or username.");

  const t0 = performance.now();

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

  const t1 = performance.now();
  const execTime = ((t1 - t0) / 1000).toFixed(2);

  return ctx.reply(
    `📡 Removing Global Ban from system...
💾 Updating records...
✅ Unban Successful

${formatUser(user)}
⚡ Action: <b>Unban</b>
👑 By: <b>${ctx.from.first_name}</b>
⏱ Time Taken: ${execTime}s
📅 Time: ${nowUTC()}`,
    { parse_mode: "HTML", reply_markup: deleteKeyboard },
  );
});

// --- /gbanned ---
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
    list += `➤ ${i + 1}. ${u.name} ${
      u.username ? "@" + u.username : "No Username"
    }\n   🆔 <code>${u.telegramUserId}</code>\n───────────────────────\n`;
  });
  list +=
    "⚠️ Use with caution! Global actions affect all groups where the bot is present.";

  return ctx.reply(list, { parse_mode: "HTML", reply_markup: deleteKeyboard });
});

// --- Delete handler ---
composer.callbackQuery("delete", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.answerCallbackQuery();
});

export const gbanCommand = composer;