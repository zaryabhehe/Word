import { Composer, InlineKeyboard } from "grammy";
import { CommandsHelper } from "../util/commands-helper";

const composer = new Composer();

// --- Stylish Start Message ---
const START_TEXT = `
𝖧𝖾𝗒, 🧸
𝖨 𝖺𝗆 <b>Word Seek</b>, 𝗒𝗈𝗎𝗋 𝗏𝖾𝗋𝗌𝖺𝗍𝗂𝗅𝖾 gaming 𝖻𝗈𝗍, 𝖽𝖾𝗌𝗂𝗀𝗇𝖾𝖽 𝗍𝗈 𝗁𝖾𝗅𝗉 𝗒𝗈𝗎 learn and guess new words with their meaning.  
➕ Add me to your groups for using my 𝗉𝗈𝗐𝖾𝗋𝖿𝗎𝗅 modules and commands!

✨ <b>What I Can Do</b>:
 • 𝖲𝖾𝖺𝗆𝗅𝖾𝗌𝗌 gaming control 𝗈𝖿 𝗒𝗈𝗎𝗋 𝗀𝗋𝗈𝗎𝗉𝗌  
 • 𝖯𝗈𝗐𝖾𝗋𝖿𝗎𝗅 5-word guess game  
 • 𝖥𝗎𝗇 𝖺𝗇𝖽 𝖾𝗇𝗀𝖺𝗀𝗂𝗇𝗀 features  

📚 <b>Need Help?</b>  
Click the <b>Help</b> button below to get details about my modules and commands.
`;

// --- Help Message ---
const HELP_TEXT = `
<b>How to Play:</b>
1. You have to guess a random 5-letter word.  
2. After each guess, you'll get hints:  
   🟩 - Correct letter in the right spot  
   🟨 - Correct letter in the wrong spot  
   🟥 - Letter not in the word  

3. The game runs until the word is found or a maximum of 30 guesses are reached.  
4. The first person to guess the word correctly wins.  

<b>Commands:</b>  
/new - Start a new game  
/end - End the current game (admins only in groups)  
/help - Get help on how to play and commands list  
/leaderboard - Show leaderboard  
/myscore - Show your score  

<b>Leaderboard & MyScore usage:</b>  
/leaderboard [global/group] [today/week/month/year/all]  
/myscore [group/global] [today/week/month/year/all]  

Example:  
/leaderboard global month  
/myscore group all  

🛠 Developed by <b>Pookie Tech Team</b>  
📢 Channel: @pookie_updates  
🗨 Group: @pookieempire
`;

// --- Inline Keyboards ---
// Start buttons
const startKeyboard = new InlineKeyboard()
  .url("➕ Add Me to Your Group", "https://t.me/YourBotUsername?startgroup=true")
  .row()
  .url("📢 Updates", "https://t.me/pookie_updates")
  .url("🛠 Support", "https://t.me/pookietechteam")
  .row()
  .text("📚 Help", "help")
  .url("👨‍💻 Coder", "https://t.me/iambilli")
  .url("👑 Owner", "https://t.me/billichor");

// Help buttons
const helpKeyboard = new InlineKeyboard()
  .text("⬅️ Back", "back")
  .text("🗑 Delete", "delete");

// --- Commands ---
// /start with animation
composer.command("start", async (ctx) => {
  const tempMsg = await ctx.reply("🟢⚪⚪");

  await new Promise((res) => setTimeout(res, 500));
  await ctx.api.editMessageText(ctx.chat.id, tempMsg.message_id, "🟢🟢⚪");

  await new Promise((res) => setTimeout(res, 500));
  await ctx.api.editMessageText(ctx.chat.id, tempMsg.message_id, "🟢🟢🟢");

  // Final Start Text
  await ctx.api.editMessageText(ctx.chat.id, tempMsg.message_id, START_TEXT, {
    parse_mode: "HTML",
    reply_markup: startKeyboard,
  });
});

// Callback: Help
composer.callbackQuery("help", async (ctx) => {
  await ctx.editMessageText(HELP_TEXT, {
    parse_mode: "HTML",
    reply_markup: helpKeyboard,
  });
  await ctx.answerCallbackQuery();
});

// Callback: Back to Start
composer.callbackQuery("back", async (ctx) => {
  await ctx.editMessageText(START_TEXT, {
    parse_mode: "HTML",
    reply_markup: startKeyboard,
  });
  await ctx.answerCallbackQuery();
});

// Callback: Delete
composer.callbackQuery("delete", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.answerCallbackQuery();
});

// Register command for helper
CommandsHelper.addNewCommand("start", "Start the bot.");

export default composer;