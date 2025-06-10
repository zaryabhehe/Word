import { Composer } from "grammy";

// import crypto from "node:crypto";
import { DatabaseError } from "pg";

// import commonWords from "../data/commonWords.json";
import { db } from "../drizzle/db";
import { gamesTable } from "../drizzle/schema";
import { CommandsHelper } from "../util/commands-helper";
import { WordSelector } from "../util/word-selector";

const composer = new Composer();

composer.command("new", async (ctx) => {
  try {
    const chatId = ctx.chat.id;

    // const allWords = Object.keys(commonWords);

    // const randomIndex = crypto.randomInt(0, allWords.length);
    // const randomWord = allWords[randomIndex].toLowerCase();

    const wordSelector = new WordSelector();
    const randomWord = await wordSelector.getRandomWord(chatId);

    await db.insert(gamesTable).values({
      word: randomWord,
      activeChat: String(chatId),
    });
    ctx.reply("Game started! Guess the 5 letter word!");
  } catch (error) {
    if (error instanceof DatabaseError && error.code === "23505") {
      return ctx.reply(
        "There is already a game in progress in this chat. Use /end to end the current game.",
      );
    }

    console.error(error);
    ctx.reply("Something went wrong. Please try again.");
  }
});

CommandsHelper.addNewCommand("new", "Start a new game.");

export const newGameCommand = composer;
