import { autoRetry } from "@grammyjs/auto-retry";
import { parseMode } from "@grammyjs/parse-mode";
import { run, sequentialize } from "@grammyjs/runner";

import { commands } from "./commands";
import { bot } from "./config/bot";
import { callbackQueryHandler } from "./handlers/callback-query";
import { onBotAddedInChat } from "./handlers/on-bot-added-in-chat";
import { onMessageHander } from "./handlers/on-message";
import { CommandsHelper } from "./util/commands-helper";

// --- Middlewares ---
bot.api.config.use(autoRetry());
bot.api.config.use(parseMode("HTML"));

bot.use(
  sequentialize((ctx) => {
    return ctx.chatId?.toString() || ctx.from?.id.toString();
  }),
);

// --- Handlers ---
bot.use(commands);
bot.use(callbackQueryHandler);
bot.use(onMessageHander);
bot.use(onBotAddedInChat);

// --- Start bot ---
run(bot); // ✅ Use runner instead of bot.start()

console.log("✅ Bot started with @grammyjs/runner");

// --- Set bot commands on startup ---
await CommandsHelper.setCommands();