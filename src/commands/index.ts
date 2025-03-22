import { Composer } from "grammy";

import { banCommand } from "./ban-user";
import { endGameCommand } from "./end-game";
import { helpCommand } from "./help";
import { leaderboardCommand } from "./leaderboard";
import { myScoreCommand } from "./my-score";
import { newGameCommand } from "./new-game";
import { startCommand } from "./start";
import { statsCommand } from "./stats";

const composer = new Composer();

composer.use(
  startCommand,
  helpCommand,
  newGameCommand,
  endGameCommand,
  myScoreCommand,
  statsCommand,
  banCommand,
  leaderboardCommand,
);

export const commands = composer;
