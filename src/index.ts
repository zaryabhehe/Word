import { Bot, webhookCallback } from "grammy";
import express from "express";
import type { Request, Response } from "express";
import { env } from "./env";
import allWords from "./allWords.json";
import commonWords from "./commonWords.json";
import { db } from "./drizzle/db";
import { gamesTable, guessesTable } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import postgres from "postgres";

const { PostgresError } = postgres;

const bot = new Bot(env.BOT_TOKEN);

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.command("help", (ctx) =>
  ctx.reply(`How to Play:
1. You have to guess a random 5-letter word.
2. After each guess, you'll get hints:
   - 🟩 - Correct letter in the right spot.
   - 🟨 - Correct letter in the wrong spot.
   - 🟥 - Letter not in the word.
3. The game will run until the word is found or a maximum of 30 guesses are reached.
4. The first person to guess the word correctly wins.

Commands:
- /new - Start a new game.
- /end - End the current game. Available for only admins in groups.
- /help - Get help on how to play and commands list.`)
);

bot.command("new", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const randomWord =
      commonWords[Math.floor(Math.random() * commonWords.length)].toLowerCase();

    await db.insert(gamesTable).values({
      word: randomWord,
      activeChat: String(chatId),
    });
    ctx.reply("Game started! Guess the 5 letter word!");
  } catch (error) {
    if (error instanceof PostgresError && error.code === "23505") {
      return ctx.reply(
        "There is already a game in progress in this chat. Use /end to end the current game."
      );
    }

    console.error(error);
    ctx.reply("Something went wrong. Please try again.");
  }
});

bot.command("end", async (ctx) => {
  try {
    const currentGame = await db.query.gamesTable.findFirst({
      where: eq(gamesTable.activeChat, String(ctx.chat.id)),
    });

    if (!currentGame) return ctx.reply("There is no game in progress.");

    await db
      .delete(gamesTable)
      .where(eq(gamesTable.activeChat, String(ctx.chat.id)));

    ctx.reply(
      "Game Ended!\nCorrect word was " + currentGame.word + "\nStart with /new"
    );
  } catch (err) {
    console.error(err);
    return ctx.reply("Something went wrong. Please try again.");
  }
});

bot.on("message", async (ctx) => {
  const currentGuess = ctx.message.text?.toLowerCase();
  if (!currentGuess || currentGuess.length !== 5) return;

  const currentGame = await db.query.gamesTable.findFirst({
    where: eq(gamesTable.activeChat, String(ctx.chat.id)),
  });

  if (!currentGame) return;

  if (!allWords.includes(currentGuess) && !commonWords.includes(currentGuess))
    return ctx.reply(`${currentGuess} is not a valid word.`);

  const guessExists = await db.query.guessesTable.findFirst({
    where: eq(guessesTable.guess, currentGuess),
  });

  if (guessExists)
    return ctx.reply(
      "Someone has already guessed your word. Please try another one!"
    );

  if (currentGuess === currentGame.word) {
    ctx.reply("Congrats! You guessed it correctly.\nStart with /new", {
      reply_parameters: { message_id: ctx.message.message_id },
    });
    ctx.react("🎉");
    await db.delete(gamesTable).where(eq(gamesTable.id, currentGame.id));
    return;
  }

  await db.insert(guessesTable).values({
    gameId: currentGame.id,
    guess: currentGuess,
  });

  const allGuesses = await db.query.guessesTable.findMany({
    where: eq(guessesTable.gameId, currentGame.id),
  });

  if (allGuesses.length === 30) {
    await db.delete(gamesTable).where(eq(gamesTable.id, currentGame.id));
    return ctx.reply(
      "Game Over! The word was " +
        currentGame.word +
        "\nYou can start a new game with /new"
    );
  }

  ctx.reply(getFeedback(allGuesses, currentGame.word));
});

await bot.api.setMyCommands([
  { command: "new", description: "Start a new game." },
  {
    command: "end",
    description: "End the current game. Available for only admins in groups.",
  },
  {
    command: "help",
    description: "Get help on how to play and commands list.",
  },
]);

if (env.NODE_ENV === "development") {
  bot.start({
    onStart: () => console.log("Bot started"),
    drop_pending_updates: true,
  });
}

const app = express();
app.use(express.json());
app.use(webhookCallback(bot, "express"));

app.get("/", (req: Request, res: Response) => {
  res.send("Bot is running!");
});

export default app;

interface GuessEntry {
  id: number;
  guess: string;
  gameId: number;
  createdAt: Date;
  updatedAt: Date;
}

function getFeedback(data: GuessEntry[], solution: string): string {
  return data
    .map((entry) => {
      let feedback = "";
      const guess = entry.guess.toUpperCase();

      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === solution[i].toUpperCase()) {
          feedback += "🟩 ";
        } else if (solution.toUpperCase().includes(guess[i])) {
          feedback += "🟨 ";
        } else {
          feedback += "🟥 ";
        }
      }

      return `${feedback.trim()} ${guess}`;
    })
    .join("\n");
}
