import { Composer, InlineKeyboard } from "grammy";
import { CommandsHelper } from "../util/commands-helper";

const composer = new Composer();

// Function to generate the start message text
function getStartText(userName: string, botName: string) {
  return `Hey, ${userName} 🧸\n` +
    `I am ${botName}, your fun and engaging Wordle-style game bot!\n\n` +
    `✨ What I Can Do:\n` +
    " • Fun and engaging word games\n" +
    " • Track your scores & leaderboard\n" +
    " • Play solo or with friends\n\n" +
    "📚 Need Help?\nClick the Help button below to see commands and instructions.";
}

// Function to generate start keyboard
function getStartKeyboard() {
  return new InlineKeyboard()
    .url("➕ Add Me to Group", "https://t.me/YourBotUsername?startgroup=true")
    .row()
    .url("Support", "https://t.me/echoclubx")
    .text("Help", "help") // callback data
    .row()
    .url("Owner", "https://t.me/billichor")
    .text("Delete", "delete"); // callback to delete the message
}

// Function to generate help keyboard
function getHelpKeyboard() {
  return new InlineKeyboard()
    .text("Back", "back") // go back to start message
    .row()
    .text("Delete", "delete");
}

// /start command
composer.command("start", async (ctx) => {
  const userName = ctx.from?.first_name || "there";
  const botName = ctx.botInfo?.first_name || "WordSeek";

  await ctx.replyWithPhoto(
    "https://files.catbox.moe/spvlya.jpg",
    {
      caption: getStartText(userName, botName),
      reply_markup: getStartKeyboard(),
    }
  );
});

// Callback query handler
composer.callbackQuery(/.*/, async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === "help") {
    await ctx.api.editMessageCaption(
      ctx.chat.id,
      ctx.callbackQuery.message?.message_id!,
      `📘 WordSeek - How to Play:
1. Guess a random 5-letter word.
2. After each guess, hints:
   - 🟩 Correct letter in the right spot
   - 🟨 Correct letter wrong spot
   - 🟥 Letter not in word
3. Up to 30 guesses per round.
4. First to guess correctly wins.

Commands:
- /new - Start new game
- /end - End game (admins)
- /help - Get help
- /leaderboard - See leaderboard
- /myscore - Check score

Leaderboard/MyScore example:
/leaderboard global month
/myscore group all

🛠 Developed by Zaryab
📢 Channel: @Pookie_updates
🗨 Group: @EchoClubX`,
      { reply_markup: getHelpKeyboard() }
    );
    await ctx.answerCallbackQuery();
  }

  else if (data === "back") {
    const userName = ctx.from?.first_name || "there";
    const botName = ctx.botInfo?.first_name || "WordSeek";
    await ctx.api.editMessageCaption(
      ctx.chat.id,
      ctx.callbackQuery.message?.message_id!,
      getStartText(userName, botName),
      { reply_markup: getStartKeyboard() }
    );
    await ctx.answerCallbackQuery();
  }

  else if (data === "delete") {
    await ctx.api.deleteMessage(ctx.chat.id, ctx.callbackQuery.message?.message_id!);
  }
});

CommandsHelper.addNewCommand("start", "Start the bot with inline image, help, back, and delete.");

export const startCommand = composer;