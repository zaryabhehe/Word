import { Composer, InlineKeyboard } from "grammy";
import { CommandsHelper } from "../util/commands-helper";

const composer = new Composer();

// Inline keyboard for /start
const startKeyboard = new InlineKeyboard()
  .url("➕ Add Me to Group", "https://t.me/YourBotUsername?startgroup=true")
  .row()
  .url("Support", "https://t.me/echoclubx")
  .text("Help").callback("help_callback") // Fixed: use callback
  .row()
  .url("Owner", "https://t.me/billichor");

// Helper for animated greeting
async function animateMessage(ctx: any, texts: string[], delay = 500) {
  const msg = await ctx.reply(texts[0], { parse_mode: undefined });
  for (let i = 1; i < texts.length; i++) {
    await new Promise((r) => setTimeout(r, delay));
    await ctx.api.editMessageText(msg.chat.id, msg.message_id, texts[i], { parse_mode: undefined });
  }
  // Delete the animated message after animation
  await ctx.api.deleteMessage(msg.chat.id, msg.message_id);
}

// /start command
composer.command("start", async (ctx) => {
  // Animate greeting and delete afterward
  await animateMessage(ctx, [
    `ʜᴇʟʟᴏ ${ctx.from?.first_name} ʜᴏᴡ ᴀʀᴇ ʏᴏᴜ \nᴡᴀɪᴛ ᴀ ᴍᴏᴍᴇɴᴛ ... <3`,
    "🕊️",
    "⚡",
    "ꜱᴛᴀʀᴛɪɴɢ..."
  ]);

  // Send top quote image
  await ctx.replyWithPhoto("https://files.catbox.moe/spvlya.jpg");

  // Main welcome message
  const userName = ctx.from?.first_name || "there";
  const botName = ctx.botInfo?.first_name || "WordSeek";

  await ctx.reply(
    `Hey, ${userName} 🧸\n` +
    `I am ${botName}, your fun and engaging Wordle-style game bot!\n\n` +
    `✨ What I Can Do:\n` +
    " • Fun and engaging word games\n" +
    " • Track your scores & leaderboard\n" +
    " • Play solo or with friends\n\n" +
    "📚 Need Help?\nClick the Help button below to see commands and instructions.",
    { reply_markup: startKeyboard, parse_mode: undefined }
  );
});

// Help button callback
composer.callbackQuery("help_callback", async (ctx) => {
  await ctx.answerCallbackQuery(); // acknowledge click
  await ctx.reply(
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
    { parse_mode: undefined }
  );
});

CommandsHelper.addNewCommand("start", "Start the bot with welcome buttons, animation, and help.");

export const startCommand = composer;