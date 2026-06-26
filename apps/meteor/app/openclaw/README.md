# OpenClaw AI Agent Integration

This module integrates [OpenClaw](https://openclaw.ai), an open-source autonomous AI agent platform, into Rocket.Chat.

## Features

- **`/openclaw` slash command**: Send prompts directly to your OpenClaw AI agent from any channel
- **Webhook endpoint**: OpenClaw can post responses back to Rocket.Chat channels via `/api/v1/openclaw.webhook`
- **Admin settings**: Configure API URL, authentication token, default LLM model, and bot behavior

## Setup

1. **Enable the integration**: Go to **Admin → Settings → OpenClaw** and enable it
2. **Set the API URL**: Enter your OpenClaw instance URL (e.g., `http://localhost:3080`)
3. **Set the authentication token**: Enter the shared secret token for webhook authentication
4. **Optional**: Configure the default LLM model, bot username, and thread response behavior

## Usage

### Slash command

```bash
/openclaw What is the weather in Berlin today?
```

The AI agent will process your prompt and respond in the channel.

### Webhook (for OpenClaw → Rocket.Chat)

OpenClaw can POST responses to:

```json
POST /api/v1/openclaw.webhook
Content-Type: application/json

{
  "token": "<your_auth_token>",
  "channel_id": "<room_id>",
  "text": "Hello from OpenClaw!",
  "thread_id": "<optional_thread_id>"
}
```

## Architecture

```text
Rocket.Chat ──► OpenClaw /hooks/agent  (outbound: user messages/commands)
OpenClaw    ──► Rocket.Chat /api/v1/openclaw.webhook  (inbound: AI responses)
```

## Requirements

- A running OpenClaw instance (self-hosted or cloud)
- A valid authentication token configured on both sides
