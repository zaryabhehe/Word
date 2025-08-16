import "dotenv/config";
import { InlineKeyboard } from "grammy";
import { bot } from "../config/bot";

// Utility sleep function
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Start command
bot.command("start", async (ctx) => {
  // Animation effect
  const tempMsg = await ctx.reply("⚡");
  await sleep(300);
  await ctx.api.editMessageText(ctx.chat!.id, tempMsg.message_id, "⚡⚡");
  await sleep(300);
  await ctx.api.editMessageText(ctx.chat!.id, tempMsg.message_id, "⚡⚡⚡");
  await sleep(300);

  // Start message
  const startText = `ʜᴇʟʟᴏ 𝐒ᴏᴘʜɪᴀ 🧸
I am WordSeek, your fun and engaging Wordle-style game bot!

✨ What I Can Do:
 • Fun and engaging word games
 • Track your scores & leaderboard
 • Play solo or with friends

📚 Need Help? Click the Help button below to see commands and instructions.`;

  // Start keyboard
  const startKeyboard = new InlineKeyboard()
    .text("➕ Add Me to Group").url("https://t.me/YourBotUsername?startgroup=true")
    .row()
    .text("Support").url("https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .text("👑 Owner").url("https://t.me/YourUsername");

  await ctx.api.editMessageText(ctx.chat!.id, tempMsg.message_id, startText, {
    reply_markup: startKeyboard,
  });
});

// Help button callback
bot.callbackQuery("help", async (ctx) => {
  const helpText = `📘 <b>How to Play:</b>
1. Guess a random 5-letter word.
2. After each guess, you'll get hints:
   - 🟩 - Correct letter in the right spot.
   - 🟨 - Correct letter in the wrong spot.
   - 🟥 - Letter not in the word.
3. Game runs until word is found or 30 guesses max.
4. First to guess wins.

<b>Commands:</b>
- /new - Start a new game
- /end - End current game (admins only)
- /help - Get this help
- /leaderboard - Group leaderboard
- /myscore - Your score

🛠 Developed by Tamanna
📢 Channel: @pookue_updates
🗨 Group: @Echoclubx`;

  const helpKeyboard = new InlineKeyboard()
    .text("⬅ Back").callback("back")
    .text("❌ Delete").callback("delete");

  await ctx.api.editMessageText(ctx.chat!.id, ctx.callbackQuery.message!.message_id, helpText, {
    reply_markup: helpKeyboard,
    parse_mode: "HTML"
  });

  await ctx.answerCallbackQuery();
});

// Back button
bot.callbackQuery("back", async (ctx) => {
  const startText = `ʜᴇʟʟᴏ 𝐒ᴏᴘʜɪᴀ 🧸
I am WordSeek, your fun and engaging Wordle-style game bot!

✨ What I Can Do:
 • Fun and engaging word games
 • Track your scores & leaderboard
 • Play solo or with friends

📚 Need Help? Click the Help button below to see commands and instructions.`;

  const startKeyboard = new InlineKeyboard()
    .text("➕ Add Me to Group").url("https://t.me/YourBotUsername?startgroup=true")
    .row()
    .text("Support").url("https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .text("👑 Owner").url("https://t.me/YourUsername");

  await ctx.api.editMessageText(ctx.chat!.id, ctx.callbackQuery.message!.message_id, startText, {
    reply_markup: startKeyboard
  });

  await ctx.answerCallbackQuery();
});

// Delete button
bot.callbackQuery("delete", async (ctx) => {
  await ctx.api.deleteMessage(ctx.chat!.id, ctx.callbackQuery.message!.message_id);
  await ctx.answerCallbackQuery();
});