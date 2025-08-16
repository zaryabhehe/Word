import { Composer, InlineKeyboard } from "grammy";
import { FOOTER_MESSAGE } from "../config/constants";
import { CommandsHelper } from "../util/commands-helper";

const composer = new Composer();

// Start buttons
const startKeyboard = new InlineKeyboard()
  .url("➕ Add Me", "https://t.me/YourBotUsername?startgroup=true")
  .row()
  .url("Updates", "https://t.me/echoclubx")
  .text("Help", "help")
  .row()
  .text("Owner", "owner");

// Help buttons
const helpKeyboard = new InlineKeyboard().text("Delete", "delete");

// Main start message
const START_TEXT = `<blockquote><strong>WordSeek</strong></blockquote>
A fun and competitive Wordle-style game that you can play directly on Telegram!

1. Use /new to start a game. Add me to a group with admin permission to play with your friends.
2. Use /help to get help on how to play and commands list.

${FOOTER_MESSAGE}`;

// Help message
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
/help - Show this help
/leaderboard - Show leaderboard
/myscore - Show your score

🛠 Developed by Tamanna
📢 Channel: @pookue_updates
🗨 Group: @Echoclubx
`;

// /start command with animation
composer.command("start", async (ctx) => {
  const tempMsg = await ctx.reply("🟢⚪⚪");

  await new Promise((res) => setTimeout(res, 500));
  await ctx.api.editMessageText(ctx.chat.id, tempMsg.message_id, "🟢🟢⚪");

  await new Promise((res) => setTimeout(res, 500));
  await ctx.api.editMessageText(ctx.chat.id, tempMsg.message_id, "🟢🟢🟢");

  // Replace with main start message
  await ctx.api.editMessageText(ctx.chat.id, tempMsg.message_id, START_TEXT, {
    parse_mode: "HTML",
    reply_markup: startKeyboard,
  });
});

// Callback queries for buttons
composer.callbackQuery("help", async (ctx) => {
  await ctx.editMessageText(HELP_TEXT, {
    parse_mode: "HTML",
    reply_markup: helpKeyboard,
  });
  await ctx.answerCallbackQuery();
});

composer.callbackQuery("delete", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.answerCallbackQuery();
});

CommandsHelper.addNewCommand("start", "Start the bot.");

export const startCommand = composer;