import { Bot, InlineKeyboard } from "grammy";
import * as dotenv from "dotenv";
dotenv.config();

// Bot token from .env
const bot = new Bot(process.env.BOT_TOKEN || "");

// URL for your start image
const START_IMAGE = "https://files.catbox.moe/spvlya.jpg";

// Start menu keyboard
function getStartKeyboard() {
  return new InlineKeyboard()
    .url("➕  Add Me to Group", "https://t.me/YourBotUsername?startgroup=true")
    .row()
    .url("Support", "https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .url("Owner", "https://t.me/billichor");
}

// Help menu keyboard
function getHelpKeyboard() {
  return new InlineKeyboard()
    .text("⬅ Back").callback("back")
    .text("❌ Delete").callback("delete");
}

// /start command
bot.command("start", async (ctx) => {
  // Animation sequence
  const tempMsg = await ctx.reply("⚡");
  await new Promise(res => setTimeout(res, 500));
  await tempMsg.editText("🕊️");
  await new Promise(res => setTimeout(res, 500));
  await tempMsg.editText("Starting...");
  await tempMsg.delete();

  // Send start image + caption
  await ctx.replyWithPhoto(
    START_IMAGE,
    {
      caption: `**𝖧𝖾𝗒, ${ctx.from?.first_name || "there"} 🧸**\nI am WordSeek, your fun and engaging Wordle-style game bot!\n\n✨  What I Can Do:\n • Fun and engaging word games\n • Track your scores & leaderboard\n • Play solo or with friends\n\n📚 Need Help? Click Help button below to see commands.`,
      parse_mode: "Markdown",
      reply_markup: getStartKeyboard()
    }
  );
});

// Help button callback
bot.callbackQuery("help", async (ctx) => {
  await ctx.editMessageCaption(
    `📘 **WordSeek - How to Play:**\n
1. Guess a random 5-letter word.
2. After each guess, you'll get hints:
   - 🟩 Correct letter in the right spot
   - 🟨 Correct letter in the wrong spot
   - 🟥 Letter not in the word
3. Game runs until word is found or max 30 guesses.
4. First person to guess correctly wins.

**Commands:**
- /new - Start a new game
- /end - End current game (admins only)
- /help - Get help
- /leaderboard - Get leaderboard
- /myscore - Get your score

Leaderboard & MyScore parameters: /[leaderboard/myscore] [global/group] [today/week/month/year/all]
Example: /leaderboard global month /myscore group all

🛠 Developed by Zaryab
📢 Official Channel: @Pookie_updates
🗨 Official Group: @EchoClubX`,
    { reply_markup: getHelpKeyboard() }
  );
});

// Back button callback
bot.callbackQuery("back", async (ctx) => {
  await ctx.editMessageCaption(
    `**𝖧𝖾𝗒, ${ctx.from?.first_name || "there"} 🧸**\nI am WordSeek, your fun and engaging Wordle-style game bot!\n\n✨  What I Can Do:\n • Fun and engaging word games\n • Track your scores & leaderboard\n • Play solo or with friends\n\n📚 Need Help? Click Help button below to see commands.`,
    { reply_markup: getStartKeyboard() }
  );
});

// Delete button callback
bot.callbackQuery("delete", async (ctx) => {
  await ctx.deleteMessage();
});

// Start the bot
bot.start();