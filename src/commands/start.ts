import { Bot, InlineKeyboard } from "grammy";
import * as dotenv from "dotenv";

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN!);

// URLs and texts
const START_IMAGE = "https://files.catbox.moe/v2y36k.jpg";
const START_TEXT = `
Hey, 🧸
I am WordSeek, your fun Wordle-style game bot!

✨ What I Can Do:
• Play fun 5-letter word games
• Track scores & leaderboard
• Play solo or with friends
`;
const HELP_TEXT = `
How to Play:
1. Guess a random 5-letter word.
2. After each guess:
   🟩 Correct letter & position
   🟨 Correct letter, wrong position
   🟥 Letter not in word
3. Game ends when word is found or max 30 guesses reached.
4. First to guess wins.

Commands:
/new - Start new game
/end - End current game (admins only)
/help - Show help
/leaderboard - Show leaderboard
/myscore - Show your score

🛠 Developed by Tamanna
📢 Channel: @pookue_updates
🗨 Group: @Echoclubx
`;

// Start keyboard
function getStartKeyboard() {
  return new InlineKeyboard()
    .url("➕ Add Me to Group", "https://t.me/YourBotUsername?startgroup=true")
    .row()
    .url("Support", "https://t.me/echoclubx")
    .text("Help", "help")
    .row()
    .text("Owner", "owner");
}

// Help keyboard
function getHelpKeyboard() {
  return new InlineKeyboard()
    .text("Back", "back")
    .text("Delete", "delete");
}

// /start command
bot.command("start", async (ctx) => {
  await ctx.replyWithPhoto(START_IMAGE, {
    caption: START_TEXT,
    reply_markup: getStartKeyboard(),
  });
});

// Callback query handler
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === "help") {
    await ctx.editMessageCaption(HELP_TEXT, {
      reply_markup: getHelpKeyboard(),
    });
  }

  if (data === "back") {
    await ctx.editMessageCaption(START_TEXT, {
      reply_markup: getStartKeyboard(),
    });
  }

  if (data === "delete") {
    await ctx.deleteMessage();
  }

  await ctx.answerCallbackQuery(); // remove loading state
});

console.log("Bot started");
bot.start();