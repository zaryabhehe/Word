import { autoRetry } from "@grammyjs/auto-retry";
import { parseMode } from "@grammyjs/parse-mode";
import { run, sequentialize } from "@grammyjs/runner";

import { bot } from "./config/bot";
import { commands } from "./commands";
import { callbackQueryHandler } from "./handlers/callback-query";
import { onBotAddedInChat } from "./handlers/on-bot-added-in-chat";
import { onMessageHander } from "./handlers/on-message";
import { CommandsHelper } from "./util/commands-helper";

// Enable retry & parse mode
bot.api.config.use(autoRetry());
bot.api.config.use(parseMode("HTML"));

// Ensure sequential updates per chat/user
bot.use(
  sequentialize((ctx) => {
    return ctx.chatId?.toString() || ctx.from?.id.toString();
  }),
);

// Register all middlewares
bot.use(commands);
bot.use(callbackQueryHandler);
bot.use(onMessageHander);
bot.use(onBotAddedInChat);

// Run with @grammyjs/runner
run(bot);

console.log("✅ Bot started with @grammyjs/runner");

// Set Telegram bot commands (helper)
await CommandsHelper.setCommands();