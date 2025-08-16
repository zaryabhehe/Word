import { Bot, InlineKeyboard, Context } from "grammy";

const bot = new Bot("<YOUR_BOT_TOKEN>");

// Function to get Start Menu Keyboard
function getStartKeyboard() {
  return new InlineKeyboard()
    .url("➕ Add Me to Group", "https://t.me/YourBotUsername?startgroup=true")
    .row()
    .url("Support", "https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .url("Owner", "https://t.me/billichor");
}

// Function to get Help Menu Keyboard
function getHelpKeyboard() {
  return new InlineKeyboard()
    .text("⬅ Back", "back")
    .text("❌ Delete", "delete");
}

// /start command
bot.command("start", async (ctx) => {
  // Send image + animated text
  const startText = `ʜᴇʟʟᴏ ${ctx.from?.first_name} 🧸\nI am WordSeek, your fun and engaging Wordle-style game bot!\n\n✨  What I Can Do:\n • Fun and engaging word games\n • Track your scores & leaderboard\n • Play solo or with friends\n\n📚 Need Help? Click Help button below.`;

  // Send image first
  const sentMsg = await ctx.replyWithPhoto("https://files.catbox.moe/spvlya.jpg");

  // Small "animation" effect before sending text
  const animMsg = await ctx.reply("Starting...");
  await new Promise(r => setTimeout(r, 500));
  await animMsg.editText("⚡ Preparing...");
  await new Promise(r => setTimeout(r, 500));
  await animMsg.delete();

  // Send main start message with buttons
  await ctx.reply(startText, { reply_markup: getStartKeyboard() });
});

// Help callback
bot.callbackQuery("help", async (ctx) => {
  await ctx.answerCallbackQuery(); // acknowledge click

  const helpText = `📘 WordSeek - How to Play:
1. Guess a random 5-letter word.
2. After each guess, you'll get hints:
   - 🟩 Correct letter in the right spot
   - 🟨 Correct letter in the wrong spot
   - 🟥 Letter not in the word
3. Game runs until word is found or max 30 guesses.
4. First person to guess correctly wins.

Commands:
- /new - Start a new game
- /end - End current game (admins only)
- /help - Get help
- /leaderboard - Get leaderboard
- /myscore - Get your score`;

  // Edit the same message to show help + back/delete buttons
  if (ctx.callbackQuery.message) {
    await ctx.editMessageText(helpText, { reply_markup: getHelpKeyboard() });
  }
});

// Back button callback
bot.callbackQuery("back", async (ctx) => {
  await ctx.answerCallbackQuery();

  const startText = `ʜᴇʟʟᴏ ${ctx.from?.first_name} 🧸\nI am WordSeek, your fun and engaging Wordle-style game bot!\n\n✨  What I Can Do:\n • Fun and engaging word games\n • Track your scores & leaderboard\n • Play solo or with friends\n\n📚 Need Help? Click Help button below.`;

  await ctx.editMessageText(startText, { reply_markup: getStartKeyboard() });
});

// Delete button callback
bot.callbackQuery("delete", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.callbackQuery.message) {
    await ctx.deleteMessage();
  }
});

// Start bot
bot.start();