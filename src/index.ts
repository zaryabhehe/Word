import { autoRetry } from "@grammyjs/auto-retry";
import { parseMode } from "@grammyjs/parse-mode";
import { run } from "@grammyjs/runner";

import { commands } from "./commands";
import { bot } from "./config/bot";
import { callbackQueryHandler } from "./handlers/callback-query";
import { onMessageHander } from "./handlers/on-message";
import { CommandsHelper } from "./util/commands-helper";

bot.api.config.use(autoRetry());
bot.api.config.use(parseMode("HTML"));

bot.use(commands);
bot.use(callbackQueryHandler);
bot.use(onMessageHander);

// bot.start({
//   onStart: () => console.log("Bot started"),
//   drop_pending_updates: true,
// });
run(bot);

console.log("Bot started");
await CommandsHelper.setCommands();
