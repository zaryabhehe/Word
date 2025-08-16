import { Composer, InlineKeyboard } from "grammy";
import { FOOTER_MESSAGE } from "../config/constants";
import { CommandsHelper } from "../util/commands-helper";

const composer = new Composer();

// Create the inline keyboard
const startKeyboard = new InlineKeyboard()
  .url("➕ Add Me to Group", "https://t.me/YourBotUsername?startgroup=true") // first big button
  .row()
  .url("💭 Support", "https://t.me/echoclubx") // second button
  .url("📚 Help", "https://t.me/echoclubx")    // third button in same row
  .row()
  .url("🌟 Owner", "https://t.me/billichor");  // fourth button

composer.command("start", (ctx) =>
  ctx.reply(
    `<blockquote><strong>WordSeek</strong></blockquote>

How to Play:
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
- /myscore - Get your score

Leaderboard & MyScore parameters: /[leaderboard/myscore] [global/group] [today/week/month/year/all]
Example: /leaderboard global month /myscore group all

🛠 Developed by Zaryab
📢 Official Channel: @Pookie_updates
🗨 Official Group: @EchoClubX

${FOOTER_MESSAGE}`,
    { reply_markup: startKeyboard }
  ),
);

CommandsHelper.addNewCommand("start", "Start the bot with buttons.");

export const startCommand = composer;