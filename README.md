# Rough Slack Bot

The official Slack integration for [Rough.app](https://rough.app). This bot allows Slack users to capture insights, ideas, and important information directly from Slack messages into their Rough workspace.

## Features

- **Capture Insights**: Convert Slack messages into insights in Rough with a simple shortcut
- **OAuth Integration**: Secure authentication between Slack and Rough accounts
- **Message Context**: Preserves message content, author information, and links when creating insights
- **Visual Feedback**: Adds a 📌 reaction to messages that have been captured
- **Installation Flow**: Self-serve installation for any Slack workspace

## Tech Stack

- Node.js v24+
- TypeScript
- PostgreSQL
- [Kysely](https://github.com/koskimas/kysely) for type-safe SQL
- [@slack/bolt](https://github.com/slackapi/bolt-js) for Slack API integration
- [Graphile Migrate](https://github.com/graphile/migrate) for database migrations
- [Fly.io](https://fly.io) for deployment

## Local Development Setup

### Prerequisites

- Node.js v24+
- PNPM v10+
- Docker (for running PostgreSQL)
- Access to a Rough account with admin privileges

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/build-great-products/slack-bot.git
   cd slack-bot
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file based on the provided `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your specific configuration.

4. **Start the PostgreSQL database**

   ```bash
   docker-compose up -d
   ```

5. **Set up the database**

   For local development, the docker-compose.yml file will create a PostgreSQL database with the configuration specified in your .env file.
   
   Run the migrations to set up the database schema:

   ```bash
   pnpm graphile-migrate migrate
   ```

6. **Create a Slack App**

   - Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
   - Use the `manifest.dev.json` file in this repository as your app manifest
   - Update any URLs in the manifest to match your local development environment
   - Install the app to your workspace

7. **Create a Rough OAuth2 Application**

   - If using a local Rough instance, navigate to `http://localhost:5173/admin/oauth2`
   - If using production Rough and you have admin access, visit `https://in.rough.app/admin/oauth2`
   - Create a new OAuth2 application and note the Client ID and Client Secret

8. **Update your `.env` file**

   Add the following values:

   ```
   ROUGH_CLIENT_ID=your_rough_client_id
   ROUGH_CLIENT_SECRET=your_rough_client_secret
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   SLACK_STATE_SECRET=random_secure_secret
   ```

9. **Start the development server**

   ```bash
   pnpm watch
   ```

10. **Expose your local server to the internet**

    Use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet so Slack can send requests to it:

    ```bash
    ngrok http 3000
    ```

    Update your Slack app's Request URLs with the ngrok URL.

## Project Structure

```
├── migrations/           # Database migrations
├── src/
│   ├── __generated__/    # Generated types for the database
│   ├── db/               # Database access layer
│   ├── slack/            # Slack integration
│   │   ├── commands/     # Slash commands
│   │   ├── routes/       # API routes
│   │   ├── shortcuts/    # Slack shortcuts
│   ├── test/             # Test utilities
│   ├── utils/            # Utility functions
│   ├── database.ts       # Database configuration
│   ├── env.ts            # Environment configuration
│   └── index.ts          # Entry point
├── docker-compose.yml    # Development database
├── fly.toml              # Fly.io configuration
└── manifest.*.json       # Slack app manifests
```

## Available Commands

- `pnpm watch`: Start the development server with hot reload
- `pnpm start`: Start the production server
- `pnpm test`: Run tests
- `pnpm fmt`: Format code
- `pnpm tidy`: Lint and fix code
- `pnpm check`: Type check the code
- `pnpm graphile-migrate`: Run database migrations

## Deployment to Production (Fly.io)

1. **Set up Fly.io**

   Install the Fly CLI and log in:

   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Create a new app on Fly.io**

   ```bash
   fly apps create rough-slack-bot
   ```

3. **Set up a PostgreSQL database**

   You can use Fly.io's Postgres offering or an external provider like CrunchyBase. 
   
   When setting up a production database, you'll need to create a dedicated role with appropriate permissions:

   ```sql
   -- Create role and database
   CREATE ROLE slackbot WITH LOGIN PASSWORD 'your_secure_password';
   CREATE DATABASE slackbot OWNER slackbot;

   -- Grant database privileges
   GRANT ALL PRIVILEGES ON DATABASE slackbot TO slackbot;

   -- Grant schema privileges on all schemas
   GRANT ALL PRIVILEGES ON SCHEMA public TO slackbot;

   -- Grant privileges on all objects in all schemas
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO slackbot;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO slackbot;
   GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO slackbot;

   -- Grant default privileges for future objects
   ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON TABLES TO slackbot;
   ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON SEQUENCES TO slackbot;
   ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON FUNCTIONS TO slackbot;
   ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON TYPES TO slackbot;
   ```

   Set up your database and note the connection string for the next step.

4. **Set secrets**

   Set all required environment variables as secrets:

   ```bash
   fly secrets set DATABASE_URL="postgres://username:password@host:port/database"
   fly secrets set ROUGH_CLIENT_ID="your_rough_client_id"
   fly secrets set ROUGH_CLIENT_SECRET="your_rough_client_secret"
   fly secrets set SLACK_CLIENT_ID="your_slack_client_id"
   fly secrets set SLACK_CLIENT_SECRET="your_slack_client_secret"
   fly secrets set SLACK_SIGNING_SECRET="your_slack_signing_secret"
   fly secrets set SLACK_STATE_SECRET="random_secure_secret"
   ```

5. **Deploy the app**

   ```bash
   fly deploy
   ```

6. **Setup HTTPS and Domain**

   After deploying, you'll get a fly.dev domain. You can set up a custom domain in the Fly.io dashboard if needed.

7. **Update Slack App Configuration**

   Update your Slack app with the production URLs (point to your fly.io domain).

## How It Works

The Slack Bot connects Rough.app with Slack using OAuth2 for authentication. Here's how the application works:

1. **Installation**: Users install the bot to their Slack workspace
2. **Authentication**: Users authenticate with their Rough account using OAuth
3. **Capturing Insights**: Users can select messages in Slack and use the "Capture Insight" shortcut
4. **Token Management**: The app manages access tokens, automatically refreshing them when needed
5. **Database**: All user connections and tokens are stored in PostgreSQL

The core flow for capturing an insight:

1. User selects a message in Slack and uses the "Capture Insight" shortcut
2. If not authenticated, the user is prompted to connect their Rough account
3. The app processes the message, resolving user mentions and formatting links
4. It creates an insight in the user's Rough workspace
5. A 📌 reaction is added to the original message
6. The user receives a confirmation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
