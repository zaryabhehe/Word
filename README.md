# Word Guesser Bot

**A fun and competitive Wordle-style game that you can play directly on Telegram!**

## Features
- Play the Wordle-inspired word guessing game in private chats or group chats.
- Supports multiplayer gameplay in groups, with admin tools for game management.
- Keep track of scores with group and global leaderboards.
- Commands to view personal scores and leaderboard rankings filtered by time (today, week, month, etc.).
- Flexible game settings: customizable limits for attempts and group admin permissions.

## How to Play
1. **Start a game**: Use the `/new` command in a group or private chat.
2. **Guess the word**: Players try to guess a random 5-letter word.
3. **Hints after each guess**:
   - 🟩 - Correct letter in the right spot.
   - 🟨 - Correct letter in the wrong spot.
   - 🟥 - Letter not in the word.
4. The game ends when:
   - The word is correctly guessed, or
   - Maximum number of guesses (30) is reached.
5. The first person to guess the word correctly wins!

## Commands
- **/new** - Start a new game.
- **/end** - End the current game (admins only in group chats).
- **/help** - Get help with commands and game rules.
- **/leaderboard** - View leaderboards for the group or globally. Example:
  ```
  /leaderboard global week
  ```
- **/myscore** - View your score. Example:
  ```
  /myscore group all
  ```
- **/stats** - View bot usage stats (admin users only).

## Installation & Setup

### Requirements
- Node.js
- Telegram Bot Token (create one via [BotFather](https://core.telegram.org/bots#botfather))
- PostgreSQL or SQLite database

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/binamralamsal/word-guesser-bot
   cd word-guesser-bot
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure the environment variables:
   - Create a `.env` file:
     ```
     BOT_TOKEN=your-telegram-bot-token
     DATABASE_URL=your-database-url
     ```

4. Run the bot:
   - Start the bot in development mode:
     ```bash
     bun run dev
     ```
   - Or run in production:
     ```bash
     bun run start
     ```

## Technologies Used
- **[grammy](https://grammy.dev/)**: Telegram Bot API framework.
- **Drizzle ORM**: Simplified database queries.
- **PostgreSQL**: Persistent storage for game data.
- **Bun.js**: Blazing fast JavaScript runtime.
- **Zod**: Schema validation.

## Additional Resources
- **Try the Bot**:
  - [Word Guesser Bot](https://t.me/word_guesserbot) *(Main bot)*
  - [Backup Bot](https://t.me/wordguesser_game_bot) *(Use this if the main bot is busy)*
- **Join the Official Group**: [Word Guesser Group](https://t.me/wordguesser) - Play the game, discuss strategies, and share feedback.
- **Support the Developer**: [Binamra Bots Channel](https://t.me/BinamraBots)
- **Contact the Developer**: Suggestions? Reach out on Telegram: [@binamralamsal](https://t.me/binamralamsal)

## Contributing
We welcome contributions to enhance the bot! Here's how you can help:
1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and open a pull request.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
