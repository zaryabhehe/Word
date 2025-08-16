import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";

const bot = new Bot(process.env.BOT_TOKEN);

// Start command
bot.command("start", async (ctx) => {
  // Animation sequence
  const tempMsg = await ctx.reply("⚡"); // send initial temp message

  await new Promise((res) => setTimeout(res, 500));
  await ctx.api.editMessageText(ctx.chat.id, tempMsg.message_id, "🌟 Hello! I am WordSeek 🧸");

  await new Promise((res) => setTimeout(res, 500));
  await ctx.api.editMessageText(
    ctx.chat.id,
    tempMsg.message_id,
    "🌟 Hello! I am WordSeek 🧸\nYour fun Wordle-style game bot!"
  );

  // Send start keyboard
  const startKeyboard = new InlineKeyboard()
    .text("➕ Add Me to Group").url("https://t.me/YourBotUsername?startgroup=true")
    .row()
    .text("Support").url("https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .text("👑 Owner").url("https://t.me/YourUsername");

  await ctx.api.editMessageText(
    ctx.chat.id,
    tempMsg.message_id,
    "🌟 Hello! I am WordSeek 🧸\n\n✨ What I Can Do:\n • Fun word games\n • Track scores & leaderboard\n • Play solo or with friends\n\n📚 Need Help? Click a button below.",
    { reply_markup: startKeyboard }
  );
});

// Help callback
bot.callbackQuery("help", async (ctx) => {
  const helpText = "📘 **Help Menu**\n\n/start - Show start menu\n/play - Start a game\n/score - Check your score";

  const helpKeyboard = new InlineKeyboard()
    .text("⬅ Back").callback("back")
    .text("❌ Delete").callback("delete");

  await ctx.api.editMessageText(ctx.chat.id, ctx.callbackQuery.message!.message_id, helpText, {
    reply_markup: helpKeyboard,
    parse_mode: "Markdown"
  });
  await ctx.answerCallbackQuery();
});

// Back callback
bot.callbackQuery("back", async (ctx) => {
  const startKeyboard = new InlineKeyboard()
    .text("➕ Add Me to Group").url("https://t.me/YourBotUsername?startgroup=true")
    .row()
    .text("Support").url("https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .text("👑 Owner").url("https://t.me/YourUsername");

  await ctx.api.editMessageText(
    ctx.chat.id,
    ctx.callbackQuery.message!.message_id,
    "🌟 Hello! I am WordSeek 🧸\n\n✨ What I Can Do:\n • Fun word games\n • Track scores & leaderboard\n • Play solo or with friends\n\n📚 Need Help? Click a button below.",
    { reply_markup: startKeyboard }
  );
  await ctx.answerCallbackQuery();
});

// Delete callback
bot.callbackQuery("delete", async (ctx) => {
  await ctx.api.deleteMessage(ctx.chat.id, ctx.callbackQuery.message!.message_id);
  await ctx.answerCallbackQuery();
});

console.log("Bot is running...");
bot.start();