import "dotenv/config"; // Load BOT_TOKEN from .env
import { Bot, InlineKeyboard } from "grammy";

const bot = new Bot(process.env.BOT_TOKEN!);

// Helper sleep function
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

bot.command("start", async (ctx) => {
  // Send temporary blank message for animation
  const tempMsg = await ctx.reply("⚡");

  const word = "WordSeek";
  let display = "";

  for (let i = 0; i < word.length; i++) {
    display += word[i];
    await ctx.api.editMessageText(ctx.chat!.id, tempMsg.message_id, `ʜᴇʟʟᴏ 𝐒ᴏᴘʜɪᴀ 🧸\n\n${display}`);
    await sleep(200);
  }

  // Full start message
  const startText = `ʜᴇʟʟᴏ 𝐒ᴏᴘʜɪᴀ 🧸
I am WordSeek, your fun Wordle-style game bot!

✨ What I Can Do:
 • Fun and engaging word games
 • Track your scores & leaderboard
 • Play solo or with friends

📚 Need Help? Click Help below!`;

  const startKeyboard = new InlineKeyboard()
    .text("➕ Add Me to Group").url("https://t.me/YourBotUsername?startgroup=true")
    .row()
    .text("Support").url("https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .text("👑 Owner").callback("owner");

  await ctx.api.editMessageText(ctx.chat!.id, tempMsg.message_id, startText, {
    reply_markup: startKeyboard,
  });
});

// Help callback
bot.callbackQuery("help", async (ctx) => {
  const helpText = `How to Play:
1. Guess a random 5-letter word.
2. Hints: 🟩 correct spot, 🟨 wrong spot, 🟥 not in word.
3. First to guess wins!

Commands:
• /new - Start a new game
• /end - End current game
• /leaderboard - Show leaderboard
• /myscore - Show your score`;

  const helpKeyboard = new InlineKeyboard()
    .text("⬅️ Back").callback("back")
    .text("🗑 Delete").callback("delete");

  await ctx.editMessageText(helpText, { reply_markup: helpKeyboard });
});

// Back button
bot.callbackQuery("back", async (ctx) => {
  await ctx.answerCallbackQuery();
  const startText = `ʜᴇʟʟᴏ 𝐒ᴏᴘʜɪᴀ 🧸
I am WordSeek, your fun Wordle-style game bot!

✨ What I Can Do:
 • Fun and engaging word games
 • Track your scores & leaderboard
 • Play solo or with friends

📚 Need Help? Click Help below!`;

  const startKeyboard = new InlineKeyboard()
    .text("➕ Add Me to Group").url("https://t.me/YourBotUsername?startgroup=true")
    .row()
    .text("Support").url("https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .text("👑 Owner").callback("owner");

  await ctx.editMessageText(startText, { reply_markup: startKeyboard });
});

// Delete button
bot.callbackQuery("delete", async (ctx) => {
  await ctx.deleteMessage();
});

bot.start({
  drop_pending_updates: true,
});