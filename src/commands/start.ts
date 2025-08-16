import { Composer, InlineKeyboard } from "grammy";
import { CommandsHelper } from "../util/commands-helper";

const composer = new Composer();

// Animation helper
async function animateStart(ctx: any, texts: string[], delay = 500) {
  const msg = await ctx.reply(texts[0]);
  for (let i = 1; i < texts.length; i++) {
    await new Promise(r => setTimeout(r, delay));
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, texts[i]);
  }
  // Delete the animated message after finishing
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
}

// Start text
function getStartText(userName: string, botName: string) {
  return `Hey, ${userName} 🧸\n` +
    `I am ${botName}, your fun and engaging Wordle-style game bot!\n\n` +
    `✨ What I Can Do:\n` +
    " • Fun and engaging word games\n" +
    " • Track your scores & leaderboard\n" +
    " • Play solo or with friends\n\n" +
    "📚 Need Help? Click Help below!";
}

// Start keyboard
function getStartKeyboard() {
  return new InlineKeyboard()
    .url("➕ Add Me to Group", "https://t.me/YourBotUsername?startgroup=true")
    .url("Support", "https://t.me/echoclubx")
    .text("Help", "help")
    .row()
    .url("Owner", "https://t.me/billichor");
}

// Help keyboard
function getHelpKeyboard() {
  return new InlineKeyboard()
    .text("Back", "back")
    .text("Delete", "delete");
}

// /start command
composer.command("start", async (ctx) => {
  const userName = ctx.from?.first_name || "there";
  const botName = ctx.botInfo?.first_name || "WordSeek";

  // Animated starting message
  await animateStart(ctx, [
    `ʜᴇʟʟᴏ ${userName} ʜᴏᴡ ᴀʀᴇ ʏᴏᴜ ... <3`,
    "🕊️",
    "⚡",
    "ꜱᴛᴀʀᴛɪɴɢ..."
  ], 400);

  // Send main start message with image + buttons
  await ctx.replyWithPhoto(
    "https://files.catbox.moe/spvlya.jpg",
    {
      caption: getStartText(userName, botName),
      reply_markup: getStartKeyboard()
    }
  );
});

// Callback handler for buttons
composer.callbackQuery(/.*/, async (ctx) => {
  const data = ctx.callbackQuery.data;
  const messageId = ctx.callbackQuery.message?.message_id!;
  const chatId = ctx.chat?.id!;

  if (data === "help") {
    await ctx.api.editMessageCaption(
      chatId,
      messageId,
      `📘 WordSeek - How to Play:
1. Guess a random 5-letter word.
2. After each guess, hints:
   - 🟩 Correct letter in the right spot
   - 🟨 Correct letter in the wrong spot
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
      chatId,
      messageId,
      getStartText(userName, botName),
      { reply_markup: getStartKeyboard() }
    );
    await ctx.answerCallbackQuery();
  }

  else if (data === "delete") {
    await ctx.api.deleteMessage(chatId, messageId);
  }
});

CommandsHelper.addNewCommand("start", "Start the bot with animation, image, help, back, and delete buttons.");

export const startCommand = composer;