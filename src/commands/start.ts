import { Composer, InlineKeyboard } from "grammy";
import { CommandsHelper } from "../util/commands-helper";

const composer = new Composer();

// Animate start messages
async function animateStart(ctx: any, texts: string[], delay = 400) {
  const msg = await ctx.reply(texts[0]);
  for (let i = 1; i < texts.length; i++) {
    await new Promise(r => setTimeout(r, delay));
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, texts[i]);
  }
  await ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
}

// Start text
function getStartText(userName: string, botName: string) {
  return `Hey, ${userName} 🧸\n` +
         `I am ${botName}, your fun and engaging Wordle-style game bot!\n\n` +
         "✨ What I Can Do:\n" +
         " • Fun and engaging word games\n" +
         " • Track your scores & leaderboard\n" +
         " • Play solo or with friends\n\n" +
         "📚 Need Help? Click Help below!";
}

// Keyboards
function getStartKeyboard() {
  return new InlineKeyboard()
    .text("➕ Add Me to Group").url("https://t.me/YourBotUsername?startgroup=true")
    .row()
    .text("Support").url("https://t.me/echoclubx")
    .text("Help").callback("help")
    .row()
    .text("Owner").url("https://t.me/billichor");
}

function getHelpKeyboard() {
  return new InlineKeyboard()
    .text("Back").callback("back")
    .text("Delete").callback("delete");
}

// /start command
composer.command("start", async (ctx) => {
  const userName = ctx.from?.first_name || "there";
  const botName = ctx.botInfo?.first_name || "WordSeek";

  // Animated start
  await animateStart(ctx, [
    `ʜᴇʟʟᴏ ${userName} ʜᴏᴡ ᴀʀᴇ ʏᴏᴜ ... ❤️`,
    "🕊️",
    "⚡",
    "ꜱᴛᴀʀᴛɪɴɢ..."
  ]);

  // Send main start message with image + buttons
  await ctx.replyWithPhoto(
    "https://files.catbox.moe/spvlya.jpg",
    {
      caption: getStartText(userName, botName),
      reply_markup: getStartKeyboard()
    }
  );
});

// Handle button callbacks
composer.callbackQuery("help", async (ctx) => {
  const msg = ctx.callbackQuery.message!;
  await ctx.api.editMessageCaption(
    ctx.chat!.id,
    msg.message_id,
    `📘 WordSeek - How to Play:
1. Guess a random 5-letter word.
2. After each guess:
   - 🟩 Correct letter in right spot
   - 🟨 Correct letter in wrong spot
   - 🟥 Letter not in word
3. Up to 30 guesses per round.
4. First to guess wins.

Commands:
/new - Start new game
/end - End game (admins)
/help - Show this help
/leaderboard - Leaderboard
/myscore - Check your score

🛠 Developed by Zaryab
📢 Channel: @Pookie_updates
🗨 Group: @EchoClubX`,
    { reply_markup: getHelpKeyboard() }
  );
  await ctx.answerCallbackQuery();
});

composer.callbackQuery("back", async (ctx) => {
  const msg = ctx.callbackQuery.message!;
  const userName = ctx.from?.first_name || "there";
  const botName = ctx.botInfo?.first_name || "WordSeek";

  await ctx.api.editMessageCaption(
    ctx.chat!.id,
    msg.message_id,
    getStartText(userName, botName),
    { reply_markup: getStartKeyboard() }
  );
  await ctx.answerCallbackQuery();
});

composer.callbackQuery("delete", async (ctx) => {
  const msg = ctx.callbackQuery.message!;
  await ctx.api.deleteMessage(ctx.chat!.id, msg.message_id);
  await ctx.answerCallbackQuery();
});

CommandsHelper.addNewCommand("start", "Start the bot with animation, image, help, back, and delete buttons.");

export const startCommand = composer;