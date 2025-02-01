import { Composer } from "grammy";

import { eq } from "drizzle-orm";

import { db } from "../drizzle/db";
import { gamesTable } from "../drizzle/schema";
import { CommandsHelper } from "../util/commands-helper";
import { formatWordDetails } from "../util/format-word-details";

const composer = new Composer();

composer.command("end", async (ctx) => {
  try {
    if (!ctx.message) return;

    if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
      const chatMember = await ctx.api.getChatMember(
        ctx.chat.id,
        ctx.message.from.id,
      );

      const allowedStatus = ["administrator", "creator"];
      if (!allowedStatus.includes(chatMember.status)) {
        return ctx.reply("Only admins can end the game.");
      }
    }

    const currentGame = await db.query.gamesTable.findFirst({
      where: eq(gamesTable.activeChat, String(ctx.chat.id)),
    });

    if (!currentGame) return ctx.reply("There is no game in progress.");

    await db
      .delete(gamesTable)
      .where(eq(gamesTable.activeChat, String(ctx.chat.id)));

    const endResponse = `Game Ended!\nCorrect word was <strong>${
      currentGame.word
    }</strong>\nStart with /new\n${formatWordDetails(currentGame.word)}`;

    ctx.reply(endResponse);
  } catch (err) {
    console.error(err);
    return ctx.reply("Something went wrong. Please try again.");
  }
});

CommandsHelper.addNewCommand(
  "end",
  "End the current game. Available for only admins in groups.",
);

export const endGameCommand = composer;
