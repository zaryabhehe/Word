import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";

import { env } from "../config/env";
import { db } from "../drizzle/db";
import { bannedUsersTable, usersTable } from "../drizzle/schema";

const composer = new Composer();
const deleteKeyboard = new InlineKeyboard().text("🗑 Delete", "delete");

// --- /ungban ---
composer.command("ungban", async (ctx) => {
  if (!ctx.from) return;
  if (!env.ADMIN_USERS.includes(ctx.from.id)) return;

  const args = ctx.message?.text?.split(" ").slice(1).join(" ");
  if (!args) return ctx.reply("⚠️ Provide a user ID or username.");

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

  return ctx.reply(
    `✅ Successfully unbanned ${user.name}`,
    { reply_markup: deleteKeyboard }
  );
});

// ✅ Export correctly
export const ungbanCommand = composer;