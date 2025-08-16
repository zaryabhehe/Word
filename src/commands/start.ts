import { Composer, InlineKeyboard } from "grammy";
import { FOOTER_MESSAGE } from "../config/constants";
import { CommandsHelper } from "../util/commands-helper";

const composer = new Composer();

// Inline keyboard for /start
const startKeyboard = new InlineKeyboard()
  .url("➕ Add Me to Group", "https://t.me/YourBotUsername?startgroup=true")
  .row()
  .url("Support", "https://t.me/echoclubx")
  .url("Help", "help_callback") // Callback to show help
  .row()
  .url("Owner", "https://t.me/billichor");

// Helper function to simulate animated text
async function animateMessage(ctx: any, texts: string[], delay = 500) {
  const msg = await ctx.reply(texts[0]);
  for (let i = 1; i < texts.length; i++) {
    await new Promise((r) => setTimeout(r, delay));
    await ctx.api.editMessageText(msg.chat.id, msg.message_id, texts[i]);
  }
  return msg;
}

// /start command
composer.command("start", async (ctx) => {
  // React to user
  try { await ctx.api.sendMessage(ctx.chat.id, "🍓"); } catch {}

  // Animated welcome messages
  await animateMessage(ctx, ["`ʜᴇʟʟᴏ " + ctx.from?.first_name + " ʜᴏᴡ ᴀʀᴇ ʏᴏᴜ \nᴡᴀɪᴛ ᴀ ᴍᴏᴍᴇɴᴛ ... <3`",
                             "🕊️", "⚡", "ꜱᴛᴀʀᴛɪɴɢ..."]);

  // Reply with quote image on top
  await ctx.replyWithPhoto("https://files.catbox.moe/spvlya.jpg");

  // Main bot message
  const userMention = ctx.from?.first_name;
  const botMention = ctx.botInfo?.first_name;

  await ctx.reply(
    `**𝖧𝖾𝗒, ${userMention} 🧸**\n` +
    `**𝖨 𝖺𝗆 ${botMention}, your fun and engaging Wordle-style game bot!**\n\n` +
    `[✨](https://files.catbox.moe/spvlya.jpg) **What I Can Do:**\n` +
    " • Fun and engaging word games\n" +
    " • Track your scores & leaderboard\n" +
    " • Play solo or with friends\n\n" +
    "📚 **Need Help?**\nClick the Help button below to see commands and instructions.",
    {
      reply_markup: startKeyboard,
    }
  );
});

// Callback for Help button
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
🗨 Group: @EchoClubX`
  );
});

CommandsHelper.addNewCommand("start", "Start the bot with welcome buttons, animation, and help.");

export const startCommand = composer;