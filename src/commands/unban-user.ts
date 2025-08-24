import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";

import { env } from "../config/env";
import { db } from "../drizzle/db";
import { bannedUsersTable, usersTable } from "../drizzle/schema";

const composer = new Composer();
const deleteKeyboard = new InlineKeyboard().text("🗑 Delete", "delete");

// --- /ungban command ---
composer.command("ungban", async (ctx) => {
  if (!ctx.from) return;

  // Only allow admin users
  if (!env.ADMIN_USERS.includes(ctx.from.id)) return;

  // Extract argument (ID or @username)
  const args = ctx.message?.text?.split(" ").slice(1).join(" ");
  if (!args) return ctx.reply("⚠️ Provide a user ID or username.");

  const isUsername = args.startsWith("@");

  // Fetch user from database
  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isUsername
        ? eq(usersTable.username, args.substring(1))
        : eq(usersTable.telegramUserId, Number(args)),
    );

  if (!user) return ctx.reply("❌ Can't find that user in database.");

  // Remove from banned users table
  await db.delete(bannedUsersTable).where(eq(bannedUsersTable.userId, user.id));

  // Reply with confirmation
  return ctx.reply(
    `✅ Successfully unbanned ${user.name}`,
    { reply_markup: deleteKeyboard }
  );
});

// ✅ Correct export
export const unbanCommand = composer;