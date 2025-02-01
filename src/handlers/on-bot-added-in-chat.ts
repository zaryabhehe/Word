import { Composer } from "grammy";

import { FOOTER_MESSAGE } from "../config/constants";

const composer = new Composer();

composer.on("my_chat_member", async (ctx) => {
  const botStatusInGroup = ctx.myChatMember.new_chat_member.status;

  if (botStatusInGroup === "left" || botStatusInGroup === "kicked") return;

  await ctx.reply(`<blockquote>Hey! Thanks for adding me to the group. 😊</blockquote>
  
To function properly, I need to be able to read messages. Please make me an <strong>administrator</strong> with the least privileges possible—just enough to read messages.
  
If one of my versions <strong>(@WordSeekBot •|• @WordSeek2Bot)</strong> isn’t working, feel free to remove it and add the other instead.
  
${FOOTER_MESSAGE}`);
});

export const onBotAddedInChat = composer;
