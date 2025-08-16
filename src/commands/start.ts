import { InlineKeyboard, Context } from "grammy";
import { bot } from "../config/bot";

// Utility function for sleep/delay
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// Start command with animation
bot.command("start", async (ctx: Context) => {
  // Animation sequence
  const animationMsg = await ctx.reply("⚡");
  await sleep(300);
  await ctx.api.editMessageText(ctx.chat!.id, animationMsg.message_id, "⚡⚡");
  await sleep(300);
  await ctx.api.editMessageText(ctx.chat!.id, animationMsg.message_id, "⚡⚡⚡");
  await sleep(300);

  // Final start message
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

  await ctx.api.editMessageText(ctx.chat!.id, animationMsg.message_id, startText, {
    reply_markup: startKeyboard,
  });
});

// Help button callback
bot.callbackQuery("help", async (ctx) => {
  const helpText = `📘 <b>How to Play:</b>
1. You have to guess a random 5-letter word.
2. After each guess, you'll get hints:
   - 🟩 - Correct letter in the right spot.
   - 🟨 - Correct letter in the wrong spot.
   - 🟥 - Letter not in the word.
3. The game will run until the word is found or a maximum of 30 guesses are reached.
4. The first person to guess the word correctly wins.

<b>Commands:</b>
- /new - Start a new game.
- /end - End the current game (admins only in groups).
- /help - Get help on how to play and commands list.
- /leaderboard - Get leaderboard from current group.
- /myscore - Get your score of the game.
- Leaderboard and MyScore parameters: /[leaderboard/myscore] [global/group] [today/week/month/year/all]
- Example: /leaderboard global month /myscore group all

🛠 Developed by Tamanna
📢 Official Channel for announcements: @pookue_updates
🗨 Official Group for playing and suggestions: @Echoclubx`;

  const helpKeyboard = new InlineKeyboard()
    .text("⬅ Back").callback("back")
    .text("❌ Delete").callback("delete");

  await ctx.api.editMessageText(
    ctx.chat!.id,
    ctx.callbackQuery.message!.message_id,
    helpText,
    { reply_markup: helpKeyboard, parse_mode: "HTML" }
  );

  await ctx.answerCallbackQuery();
});

// Back button callback
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

  await ctx.api.editMessageText(
    ctx.chat!.id,
    ctx.callbackQuery.message!.message_id,
    startText,
    { reply_markup: startKeyboard }
  );

  await ctx.answerCallbackQuery();
});

// Delete button callback
bot.callbackQuery("delete", async (ctx) => {
  await ctx.api.deleteMessage(ctx.chat!.id, ctx.callbackQuery.message!.message_id);
  await ctx.answerCallbackQuery();
});