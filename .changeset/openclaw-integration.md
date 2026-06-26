---
"@rocket.chat/meteor": minor
---

feat: Add OpenClaw AI agent integration

Adds a new OpenClaw integration module that allows Rocket.Chat users to interact with OpenClaw autonomous AI agents directly from chat channels.

**Features:**
- `/openclaw` slash command to send prompts to the AI agent
- Incoming webhook endpoint (`/api/v1/openclaw.webhook`) for receiving AI responses
- Admin settings for configuring API URL, auth token, default model, bot username, and thread behavior
- Bot message loop prevention and proper error handling

**Configuration:**
- Navigate to Admin → Settings → OpenClaw to enable and configure the integration
- Requires a running OpenClaw instance with a valid authentication token
