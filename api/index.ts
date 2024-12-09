import { Bot, webhookCallback } from "grammy";
import express from "express";
import type { Request, Response } from "express";
import { env } from "./env";
import allWords from "./allWords.json";
import commonWords from "./commonWords.json";
import { db } from "./drizzle/db";
import {
  gamesTable,
  guessesTable,
  leaderboardTable,
  usersTable,
} from "./drizzle/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { NeonDbError } from "@neondatabase/serverless";

const bot = new Bot(env.BOT_TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    `<blockquote>How to Play:</blockquote>
1. Use /new to start a game. Add me to a group with admin permission to play with your friends.
2. Use /help to get help on how to play and commands list.
  <blockquote>Proudly built with ❤️ by Binamra Lamsal @BinamraBots.</blockquote>`,
    {
      parse_mode: "HTML",
    }
  )
);

bot.command("help", (ctx) =>
  ctx.reply(
    `<blockquote>How to Play:</blockquote>
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
- /help - Get help on how to play and commands list.

<blockquote>Proudly built with ❤️ by Binamra Lamsal @BinamraBots.</blockquote>`,
    {
      parse_mode: "HTML",
    }
  )
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
    if (error instanceof NeonDbError && error.code === "23505") {
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
    if (!ctx.message) return;

    if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
      const chatMember = await ctx.api.getChatMember(
        ctx.chat.id,
        ctx.message.from.id
      );

      if (chatMember.status !== "administrator") {
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

    ctx.reply(
      "Game Ended!\nCorrect word was " + currentGame.word + "\nStart with /new"
    );
  } catch (err) {
    console.error(err);
    return ctx.reply("Something went wrong. Please try again.");
  }
});

type LeaderboardEntry = {
  userId: string;
  name: string;
  username: string | null;
  totalScore: number;
};

function formatLeaderboardMessage(data: LeaderboardEntry[]) {
  const blocks = data.reduce((acc, entry, index) => {
    const rank = index < 3 ? ["🥇", "🥈", "🥉"][index] : "🔅";

    let usernameLink = entry.name;
    if (entry.username) {
      usernameLink = `<a href="t.me/${entry.username}">${entry.name}</a>`;
    }

    const line = `${rank}${usernameLink} - ${entry.totalScore} pts`;

    if (index === 0 || index === 3 || (index > 3 && (index - 3) % 10 === 0)) {
      acc.push([]);
    }
    acc[acc.length - 1].push(line);

    return acc;
  }, [] as string[][]);

  const formattedEntries = blocks
    .map((block) => `<blockquote>${block.join("\n")}</blockquote>`)
    .join("\n");

  return `<blockquote>🏆 Game Leaderboard 🏆</blockquote>\n\n${formattedEntries}\n\n<blockquote>Proudly built with ❤️ by Binamra Lamsal @BinamraBots.</blockquote>`;
}

bot.command("leaderboard", async (ctx) => {
  if (ctx.chat.type === "private")
    return ctx.reply(
      "This command is not available in private chats. Please add me in a group and use it."
    );

  const chatId = ctx.chat.id.toString();
  const memberScores = await db
    .select({
      userId: usersTable.telegramUserId,
      name: usersTable.name,
      username: usersTable.username,
      totalScore: sql<number>`cast(sum(${leaderboardTable.score}) as integer)`,
    })
    .from(leaderboardTable)
    .where(eq(leaderboardTable.chatId, chatId))
    .groupBy(usersTable.telegramUserId, usersTable.name, usersTable.username)
    .innerJoin(usersTable, eq(usersTable.id, leaderboardTable.tempUserId))
    .orderBy(desc(sql`sum(${leaderboardTable.score})`))
    .limit(20)
    .execute();

  ctx.reply(formatLeaderboardMessage(memberScores), {
    parse_mode: "HTML",
    disable_notification: true,
    link_preview_options: {
      is_disabled: true,
    },
  });
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
    where: and(
      eq(guessesTable.guess, currentGuess),
      eq(guessesTable.chatId, ctx.chat.id.toString())
    ),
  });

  if (guessExists)
    return ctx.reply(
      "Someone has already guessed your word. Please try another one!"
    );

  if (currentGuess === currentGame.word) {
    const allGuesses = await db.query.guessesTable.findMany({
      where: eq(guessesTable.gameId, currentGame.id),
    });

    const name = `${ctx.from.first_name}${
      ctx.from.last_name ? " " + ctx.from.last_name : ""
    }`;
    const username = ctx.from.username;
    const userId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();

    let additionalMessage = "";
    if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
      const score = 30 - allGuesses.length;
      additionalMessage = `Added ${30 - allGuesses.length} to the leaderboard.`;

      const [dbUser] = await db
        .insert(usersTable)
        .values({
          name,
          telegramUserId: userId,
          username,
        })
        .onConflictDoUpdate({
          target: [usersTable.telegramUserId],
          set: {
            name,
            username,
          },
        })
        .returning({ userId: usersTable.id });
      await db.insert(leaderboardTable).values({
        score,
        chatId,
        tempUserId: dbUser.userId,
      });
    }
    ctx.reply(
      `Congrats! You guessed it correctly.\n${additionalMessage}\nStart with /new`,
      {
        reply_parameters: { message_id: ctx.message.message_id },
      }
    );
    ctx.react("🎉");
    await db.delete(gamesTable).where(eq(gamesTable.id, currentGame.id));
    return;
  }

  await db.insert(guessesTable).values({
    gameId: currentGame.id,
    guess: currentGuess,
    chatId: ctx.chat.id.toString(),
  });

  const allGuesses = await db.query.guessesTable.findMany({
    where: eq(guessesTable.gameId, currentGame.id),
    orderBy: asc(guessesTable.createdAt),
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

async function init() {
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
    {
      command: "leaderboard",
      description: "Get leaderboard of the game in this chat.",
    },
  ]);
}

init();

const app = express();
app.use(express.json());

if (env.NODE_ENV === "development") {
  bot.start({
    onStart: () => console.log("Bot started"),
    drop_pending_updates: true,
  });
} else {
  app.use(webhookCallback(bot, "express"));
}

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
