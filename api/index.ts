import { Bot, InlineKeyboard, webhookCallback } from "grammy";
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
import { and, asc, count, countDistinct, desc, eq, sql } from "drizzle-orm";
import { NeonDbError } from "@neondatabase/serverless";

const bot = new Bot(env.BOT_TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    `<blockquote>How to Play:</blockquote>
1. Use /new to start a game. Add me to a group with admin permission to play with your friends.
2. Use /help to get help on how to play and commands list.
  <blockquote>Developed by Binamra Lamsal | Join for discussions related to the game: @wordguesser</blockquote>`,
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
- /leaderboard - Get leaderboard from current group.
- /myscore - Get your score of the game.
- Leaderboard, and MyScore parameters: /[leaderboard/myscore] [global/group] [today/week/month/year/all]
- Example: <code>/leaderboard global month</code> <code>/myscore group all</code>

<blockquote>Developed by Binamra Lamsal | Join for discussions related to the game: @wordguesser.</blockquote>`,
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

      chatMember.status;

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

function formatLeaderboardMessage(
  data: LeaderboardEntry[],
  searchKey: AllowedChatSearchKey,
  timeKey: AllowedChatTimeKey
) {
  const blocks = data.reduce((acc, entry, index) => {
    const rank = index < 3 ? ["🥇", "🥈", "🥉"][index] : "🔅";

    let usernameLink = escapeHtmlEntities(entry.name);
    if (entry.username) {
      usernameLink = `<a href="t.me/${entry.username}">${escapeHtmlEntities(
        entry.name
      )}</a>`;
    }

    const line = `${rank}${usernameLink} - ${entry.totalScore.toLocaleString()} pts`;

    if (index === 0 || index === 3 || (index > 3 && (index - 3) % 10 === 0)) {
      acc.push([]);
    }
    acc[acc.length - 1].push(line);

    return acc;
  }, [] as string[][]);

  const formattedEntries = blocks
    .map((block) => `<blockquote>${block.join("\n")}</blockquote>`)
    .join("\n");

  return `<blockquote>🏆 ${
    searchKey === "global" ? "Global" : "Group"
  } Leaderboard 🏆</blockquote>\n\n${formattedEntries}\n\n<blockquote>Developed by Binamra Lamsal | Join for discussions related to the game: @wordguesser.</blockquote>`;
}

const allowedChatSearchKeys = ["global", "group"] as const;
type AllowedChatSearchKey = (typeof allowedChatSearchKeys)[number];
const allowedChatTimeKeys = ["today", "week", "month", "year", "all"] as const;
type AllowedChatTimeKey = (typeof allowedChatTimeKeys)[number];

function parseInput(
  input: string,
  defaultSearchKey: AllowedChatSearchKey = "group",
  defaultTimeKey: AllowedChatTimeKey = "month"
) {
  const parts = input.toLowerCase().trim().split(" ");

  const searchKey = (parts.find((part) =>
    allowedChatSearchKeys.includes(part as AllowedChatSearchKey)
  ) || defaultSearchKey) as AllowedChatSearchKey;

  const timeKey = (parts.find((part) =>
    allowedChatTimeKeys.includes(part as AllowedChatTimeKey)
  ) || defaultTimeKey) as AllowedChatTimeKey;

  return { searchKey, timeKey };
}

function generateButtonText<T>(key: T, currentKey: T, label: string) {
  return `${key === currentKey ? "✅ " : ""}${label}`;
}

function generateKeyboard(
  searchKey: AllowedChatSearchKey,
  timeKey: AllowedChatTimeKey,
  callbackKey: "leaderboard" | `myscore ${number}` = "leaderboard"
) {
  const keyboard = new InlineKeyboard();

  allowedChatSearchKeys.forEach((key) => {
    keyboard.text(
      generateButtonText(
        searchKey,
        key,
        key === "group" ? "This group" : "Global"
      ),
      `${callbackKey} ${key} ${timeKey}`
    );
  });
  keyboard.row();

  allowedChatTimeKeys.forEach((key, index) => {
    keyboard.text(
      generateButtonText(
        timeKey,
        key,
        key === "all" ? "All time" : key === "today" ? "Today" : `This ${key}`
      ),
      `${callbackKey} ${searchKey} ${key}`
    );
    if ((index + 1) % 3 === 0) {
      keyboard.row();
    }
  });

  keyboard.row();
  keyboard.text("🔄 Refresh", `${callbackKey} ${searchKey} ${timeKey}`);

  return keyboard;
}

function getTimeFilter(timeKey: AllowedChatTimeKey) {
  switch (timeKey) {
    case "today":
      return sql`date_trunc('day', ${leaderboardTable.createdAt}) = date_trunc('day', now())`;
    case "week":
      return sql`date_trunc('week', ${leaderboardTable.createdAt}) = date_trunc('week', now())`;
    case "month":
      return sql`date_trunc('month', ${leaderboardTable.createdAt}) = date_trunc('month', now())`;
    case "year":
      return sql`date_trunc('year', ${leaderboardTable.createdAt}) = date_trunc('year', now())`;
    case "all":
      return undefined;
  }
}

async function getLeaderboardScores({
  chatId,
  searchKey,
  timeKey,
}: {
  chatId: string;
  searchKey: AllowedChatSearchKey;
  timeKey: AllowedChatTimeKey;
}) {
  const conditions = [
    searchKey === "group" ? eq(leaderboardTable.chatId, chatId) : undefined,
    getTimeFilter(timeKey),
  ].filter(Boolean);

  return db
    .select({
      userId: usersTable.telegramUserId,
      name: usersTable.name,
      username: usersTable.username,
      totalScore: sql<number>`cast(sum(${leaderboardTable.score}) as integer)`,
    })
    .from(leaderboardTable)
    .where(and(...conditions))
    .groupBy(usersTable.telegramUserId, usersTable.name, usersTable.username)
    .innerJoin(usersTable, eq(usersTable.id, leaderboardTable.userId))
    .orderBy(desc(sql`sum(${leaderboardTable.score})`))
    .limit(20)
    .execute();
}

async function getUserScores({
  chatId,
  searchKey,
  userId,
  timeKey,
}: {
  chatId: string;
  searchKey: AllowedChatSearchKey;
  userId: string;
  timeKey: AllowedChatTimeKey;
}) {
  let conditions = [
    searchKey === "group" ? eq(leaderboardTable.chatId, chatId) : undefined,
    getTimeFilter(timeKey),
  ].filter(Boolean);

  const [{ totalLeaderboards }] = await db
    .select({ totalLeaderboards: count(leaderboardTable.userId) })
    .from(leaderboardTable)
    .where(and(...conditions));

  if (totalLeaderboards === 0) return null;

  const leaderboardData = db
    .select({
      count: count(leaderboardTable.userId),
      userId: leaderboardTable.userId,
      totalScore:
        sql<number>`cast(sum(${leaderboardTable.score}) as integer)`.as(
          "totalScore"
        ),
      rank: sql<number>`cast(RANK() OVER (ORDER BY sum(${leaderboardTable.score}) DESC) as integer)`.as(
        "rank"
      ),
    })
    .from(leaderboardTable)
    .where(and(...conditions))
    .groupBy(leaderboardTable.userId)
    .as("leaderboards");

  return db
    .select({
      userId: usersTable.telegramUserId,
      name: usersTable.name,
      username: usersTable.username,
      totalScore: leaderboardData.totalScore,
      rank: leaderboardData.rank,
    })
    .from(leaderboardData)
    .where(and(eq(usersTable.telegramUserId, userId)))
    .groupBy(
      usersTable.telegramUserId,
      usersTable.name,
      usersTable.username,
      leaderboardData.rank,
      leaderboardData.totalScore
    )
    .innerJoin(usersTable, eq(usersTable.id, leaderboardData.userId))
    .orderBy(desc(sql`sum(${leaderboardData.totalScore})`))
    .limit(20);
}

function escapeHtmlEntities(text: string) {
  const entityMap = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#39;", // Single quotes
    "/": "&#x2F;", // Slash
  };

  return text.replace(/[<>&"'\/]/g, (char) => entityMap[char]);
}

bot.command("myscore", async (ctx) => {
  if (!ctx.from) return;

  if (ctx.chat.type === "private")
    return ctx.reply(
      "This command is not available in private chats. Please add me in a group and use it."
    );

  const { searchKey, timeKey } = parseInput(ctx.match);

  const keyboard = generateKeyboard(
    searchKey,
    timeKey,
    `myscore ${ctx.from.id}`
  );

  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id.toString();
  const userScores = await getUserScores({
    userId,
    chatId,
    searchKey,
    timeKey,
  });

  if (userScores === null) return ctx.reply("No one has scored yet.");

  const userScore = userScores[0];

  const message = formatUserScoreMessage(userScore, searchKey);

  ctx.reply(message, {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: keyboard,
    reply_parameters: {
      message_id: ctx.msgId,
    },
    link_preview_options: {
      is_disabled: true,
    },
  });
});

bot.command("stats", async (ctx) => {
  if (!ctx.from) return;

  if (!env.ADMIN_USERS.includes(ctx.from.id)) return;

  const [{ usersCount }] = await db
    .select({ usersCount: count(usersTable.id) })
    .from(usersTable);
  const [{ groupsCount }] = await db
    .select({ groupsCount: countDistinct(leaderboardTable.chatId) })
    .from(leaderboardTable);

  return ctx.reply(`Total Users: ${usersCount}\nTotal Groups: ${groupsCount}`);
});

type FormatUserScoreData = {
  totalScore: number;
  rank: number;
  name: string;
  username: string | null;
  userId: string;
};

function formatUserScoreMessage(
  data: FormatUserScoreData,
  searchKey: AllowedChatSearchKey
) {
  const name = escapeHtmlEntities(data.name);
  const mentionLink = data.username
    ? `<a href="t.me/${data.username}">${name}'s</a>`
    : `${name}'s`;

  const message = `<blockquote><strong>🏆 ${mentionLink} total score ${
    searchKey === "global" ? "globally" : "in group"
  } is ${data.totalScore.toLocaleString()}, and rank is ${data.rank.toLocaleString()} 🏆</strong></blockquote>`;

  return `${message}\n\n<blockquote>Developed by Binamra Lamsal | Join for discussions related to the game: @wordguesser.</blockquote>`;
}

bot.command("leaderboard", async (ctx) => {
  if (ctx.chat.type === "private")
    return ctx.reply(
      "This command is not available in private chats. Please add me in a group and use it."
    );

  const { searchKey, timeKey } = parseInput(ctx.match);

  const keyboard = generateKeyboard(searchKey, timeKey);

  const chatId = ctx.chat.id.toString();
  const memberScores = await getLeaderboardScores({
    chatId,
    searchKey,
    timeKey,
  });

  const message = formatLeaderboardMessage(memberScores, searchKey, timeKey);
  console.log(message);

  ctx.reply(formatLeaderboardMessage(memberScores, searchKey, timeKey), {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: keyboard,
    link_preview_options: {
      is_disabled: true,
    },
  });
});

bot.on("callback_query:data", async (ctx) => {
  condition: if (ctx.callbackQuery.data.startsWith("leaderboard")) {
    const [, searchKey, timeKey] = ctx.callbackQuery.data.split(" ");
    if (!allowedChatSearchKeys.includes(searchKey as AllowedChatSearchKey))
      break condition;
    if (!allowedChatTimeKeys.includes(timeKey as AllowedChatTimeKey))
      break condition;
    if (!ctx.chat) break condition;

    const chatId = ctx.chat.id.toString();
    const memberScores = await getLeaderboardScores({
      chatId,
      searchKey: searchKey as AllowedChatSearchKey,
      timeKey: timeKey as AllowedChatTimeKey,
    });

    const keyboard = generateKeyboard(
      searchKey as AllowedChatSearchKey,
      timeKey as AllowedChatTimeKey
    );

    await ctx
      .editMessageText(
        formatLeaderboardMessage(
          memberScores,
          searchKey as AllowedChatSearchKey,
          timeKey as AllowedChatTimeKey
        ),
        {
          reply_markup: keyboard,
          link_preview_options: { is_disabled: true },
          parse_mode: "HTML",
        }
      )
      .catch(() => {});
  } else if (ctx.callbackQuery.data.startsWith("myscore")) {
    const [, userId, searchKey, timeKey] = ctx.callbackQuery.data.split(" ");
    if (!allowedChatSearchKeys.includes(searchKey as AllowedChatSearchKey))
      break condition;
    if (!allowedChatTimeKeys.includes(timeKey as AllowedChatTimeKey))
      break condition;
    if (!ctx.chat) break condition;

    const chatId = ctx.chat.id.toString();
    const userScores = await getUserScores({
      chatId,
      userId,
      searchKey: searchKey as AllowedChatSearchKey,
      timeKey: timeKey as AllowedChatTimeKey,
    });

    if (!userScores)
      return ctx.answerCallbackQuery({
        text: "No one has scored yet.",
        show_alert: true,
      });

    const userScore = userScores[0];

    const keyboard = generateKeyboard(
      searchKey as AllowedChatSearchKey,
      timeKey as AllowedChatTimeKey,
      `myscore ${Number(userId)}`
    );

    await ctx
      .editMessageText(
        formatUserScoreMessage(userScore, searchKey as AllowedChatSearchKey),
        {
          reply_markup: keyboard,
          link_preview_options: { is_disabled: true },
          parse_mode: "HTML",
        }
      )
      .catch(() => {});
  }
  await ctx.answerCallbackQuery();
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
        userId: dbUser.userId,
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
      description: "Get leaderboard of the game.",
    },
    {
      command: "myscore",
      description: "Get your score of the game.",
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

function getFeedback(data: GuessEntry[], solution: string) {
  return data
    .map((entry) => {
      let feedback = "";
      const guess = entry.guess.toUpperCase();
      const solutionCount: Record<string, number> = {};

      for (const char of solution.toUpperCase()) {
        solutionCount[char] = (solutionCount[char] || 0) + 1;
      }

      const result = Array(guess.length).fill("🟥");
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === solution[i].toUpperCase()) {
          result[i] = "🟩";
          solutionCount[guess[i]]--;
        }
      }

      for (let i = 0; i < guess.length; i++) {
        if (result[i] === "🟥" && solutionCount[guess[i]] > 0) {
          result[i] = "🟨";
          solutionCount[guess[i]]--;
        }
      }

      feedback = result.join(" ");
      return `${feedback} ${guess}`;
    })
    .join("\n");
}
