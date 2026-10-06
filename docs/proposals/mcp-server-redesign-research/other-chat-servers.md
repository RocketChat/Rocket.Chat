# Research: other chat-product MCP servers

> Raw research output, kept unedited. Collected on 2026-10-06 by a research agent for [the MCP server redesign proposal](../mcp-server-redesign.md).
> Scope: Slack (official, archived reference, korotovsky), Zulip, Microsoft Teams, Discord, and GitHub (design patterns only).

---

## Chat-product MCP servers: research report

**Method and caveats:** The egress proxy blocked docs.slack.dev, mcp.slack.com, learn.microsoft.com and most blogs. So I cloned and read source and READMEs from GitHub, and took everything else from search-result snippets. Items marked **[UNVERIFIED]** come only from snippets. Clones are in `/tmp/claude-0/-home-user-Rocket-Chat/23dd6cb9-769f-508b-8ee8-db3ddddb5e13/scratchpad/src/`.

---

### 1a. Slack official hosted MCP server
Docs: https://docs.slack.dev/ai/slack-mcp-server/ (blocked). Read instead: Slack's own plugin, https://github.com/slackapi/slack-skills-plugin (`.mcp.json`, `skills/*/SKILL.md`, README).

- **Tools seen in Slack's own plugin (17):**
  - Search: `slack_search_public`, `slack_search_public_and_private` (asks for user consent), `slack_search_channels`, `slack_search_users`.
  - Reading: `slack_read_channel` (takes `oldest`/`latest`), `slack_read_thread`, `slack_read_user_profile`, `slack_read_file`, `slack_list_channel_members`.
  - Messaging: `slack_send_message`, `slack_send_message_draft`, `slack_schedule_message` (`post_at` from 2 minutes to 120 days ahead).
  - Reactions: `slack_add_reaction`, `slack_get_reactions`.
  - Canvases: `slack_create_canvas`, `slack_read_canvas`, `slack_update_canvas`.
- **Tool count:** **[UNVERIFIED]** Other sources give 11, 13, 15 or 18. A May 2026 changelog added tools (https://docs.slack.dev/changelog/2026/05/13/new-mcp-tools/). Snippets say the server returns only the tools the token's scopes allow, so the count varies by token.
- **Transport and hosting:** hosted remote server, streamable HTTP, at `https://mcp.slack.com/mcp`. Admins must approve it per workspace. The Slack app needs its "MCP" toggle switched on, and users must re-authorize after that **[UNVERIFIED]**.
- **Auth:**
  - OAuth with a pre-registered client only. Slack's plugin hard-codes `"oauth": {"clientId": "1601185624273.8899143856786", "callbackPort": 3118}`.
  - **No dynamic client registration (DCR).** Claude Code, Cursor and others fail with "does not support dynamic client registration" (https://github.com/anthropics/claude-code/issues/52354).
  - Exposes `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server` **[UNVERIFIED]**.
  - It uses the **user-token** OAuth endpoints (`slack.com/oauth/v2_user/authorize`, `oauth.v2.user.access`). Bot tokens are rejected with 401. Scopes are granular, for example `search:read.public`, `search:read.private`, `search:read.im`, `search:read.files`, `files:read`, `chat:write` **[UNVERIFIED]**.
- **Context limits:**
  - The design is search-first: the search skill says to search, then follow up with `read_thread` or `read_channel`.
  - Search `limit` is capped at 20 per page, with a `cursor`.
  - Search takes `content_types`, `only_my_channels`, `sort` and Slack query modifiers.
  - Messages are written in standard markdown, with at most 5000 characters per text element **[UNVERIFIED]**.

### 1b. Archived reference server: `modelcontextprotocol/servers-archived/src/slack`
Source: https://github.com/modelcontextprotocol/servers-archived/tree/main/src/slack (`index.ts`)
- **Tools (8):**
  - `slack_list_channels`: lists public channels, or the ones named in `SLACK_CHANNEL_IDS`.
  - `slack_post_message`: posts a message.
  - `slack_reply_to_thread`: replies in a thread.
  - `slack_add_reaction`: adds a reaction.
  - `slack_get_channel_history`: returns recent messages, 10 by default.
  - `slack_get_thread_replies`: returns a thread.
  - `slack_get_users`: lists users (default 100, max 200).
  - `slack_get_user_profile`: returns one user's profile.
- **Transport:** local stdio.
- **Auth:** `SLACK_BOT_TOKEN` (xoxb) plus `SLACK_TEAM_ID`.
- **Context limits:** list sizes capped with `Math.min(limit, 200)`, plus cursors. Output is raw `JSON.stringify` of the Slack API response, which is verbose. There is no search tool.

### 1c. korotovsky/slack-mcp-server (Go)
Source: https://github.com/korotovsky/slack-mcp-server (`pkg/server/server.go`)
- **Tools (22):**
  - Reading: `conversations_history`, `conversations_replies`, `conversations_search_messages` (filters: channel, IM, from-user, with-user, before/after/on/during dates, threads only; limit 1–100; hidden for bot tokens), `conversations_unreads`.
  - Writing: `conversations_add_message` (markdown/plain or Block Kit), `reactions_add`, `reactions_remove`.
  - Conversation state: `conversations_mark`, `conversations_join`, `conversations_leave`.
  - Channels and users: `channels_list` (substring query on name, topic or purpose), `channels_me`, `users_search`.
  - Files: `attachment_get_data` (5 MB cap).
  - User groups: `usergroups_list`, `usergroups_me`, `usergroups_create`, `usergroups_update`, `usergroups_users_update`.
  - Saved items: `saved_list`, `saved_update`, `saved_clear_completed`.
  - It also has two **resources**, CSV directories of channels and users.
- **Transport:** stdio, SSE and streamable HTTP. HTTP can require a bearer key via `SLACK_MCP_API_KEY`.
- **Auth:** one of four token types:
  - `xoxp` user OAuth token;
  - `xoxb` bot token (no search);
  - `xoxc` + `xoxd` browser-session "stealth" tokens (needed for the saved-items tools; best for unreads).
- **Context limits:**
  - **CSV output** everywhere (`gocsv.MarshalBytes`), which is compact.
  - History `limit` accepts a time range ("1d", "1w", "90d") or a message count. The cursor is the last CSV cell.
  - Activity messages are filtered out by default.
  - Unreads are capped with `max_channels` (default 50) and `max_messages_per_channel` (default 10).
  - Write tools are off by default and turned on by env vars (`SLACK_MCP_ADD_MESSAGE_TOOL` and others), optionally with a per-channel allow-list.
  - `SLACK_MCP_ENABLED_TOOLS` is a tool allow-list.
  - Tools carry `readOnlyHint` / `destructiveHint` annotations.

### 2. Zulip
**I found no official Zulip MCP server.** Monadical-SAS/zulip-mcp is sometimes described as "official", but it is not in the zulip organization.
- **Monadical-SAS/zulip-mcp** (https://github.com/Monadical-SAS/zulip-mcp, `index.ts`), **8 tools:**
  - `zulip_list_channels`, `zulip_post_message` (stream + topic), `zulip_send_direct_message`, `zulip_add_reaction`;
  - `zulip_get_channel_history` (stream + topic, default 20, with an anchor), `zulip_get_topics`, `zulip_subscribe_to_channel`, `zulip_get_users`.
  - Stdio transport. Auth is a bot API key (`ZULIP_EMAIL`, `ZULIP_API_KEY`, `ZULIP_URL`). Output is raw JSON.
- **akougkas/zulipchat-mcp** (Python FastMCP, https://github.com/akougkas/zulipchat-mcp): the most notable context design among the Zulip servers.
  - **20 "core" tools by default, 60 with `--extended-tools`.** The README's reason: "fewer tools means faster tool selection, lower token overhead".
  - Core tools: `send_message`, `edit_message`, `get_message`, `add_reaction`, `search_messages`, `get_streams`, `get_stream_info`, `get_stream_topics`, `resolve_user`, `get_users`, `get_own_user`, six agent-communication tools, `switch_identity`, `server_info`, `manage_message_flags`.
  - Transport is stdio or HTTP. Auth is a zuliprc API key, with an optional second "bot" identity.
- **avisekrath/zulip-mcp-server** (https://github.com/avisekrath/zulip-mcp-server):
  - 24 kebab-case tools, among them `search-users`, `get-messages`, `send-message`, `edit-message`, `delete-message`, `upload-file`, `create-scheduled-message`, `create-draft`, `get-message-read-receipts`, `get-user-groups`.
  - Also `users-directory` and `streams-directory` resources. Stdio transport.

### 3. Microsoft Teams
- **Official: Work IQ / Agent 365 "Teams" MCP server**, server ID `mcp_TeamsServer`.
  - Hosted remote at `https://agent365.svc.cloud.microsoft/agents/tenants/{tenantId}/servers/mcp_TeamsServer`.
  - One Entra ID delegated scope, `McpServers.Teams.All`.
  - Tools are thin Graph wrappers named `mcp_graph_<area>_<op>`, for example `mcp_graph_chat_listChats` (`$top`, `$filter`, `$expand`, `$orderby`), `mcp_graph_chat_listChatMessages`, `mcp_graph_chat_postMessage`, `mcp_graph_teams_listTeams`.
  - It covers creating, updating and deleting chats, members, messages, channels and search.
  - **[UNVERIFIED]** Reported as 28 tools and as needing a Copilot licence. learn.microsoft.com was blocked, so I could not get the full list (https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/teams).
- **Community: floriscornel/teams-mcp** (https://github.com/floriscornel/teams-mcp, `src/tools/*.ts`), **31 tools:**
  - Account and users: `auth_status`, `get_current_user`, `search_users`, `get_user`, `search_users_for_mentions`.
  - Teams and channels: `list_teams`, `list_channels`, `list_team_members`, `get_channel_messages`, `get_channel_message_replies`, `send_channel_message`, `reply_to_channel_message`, `update_channel_message`, `delete_channel_message`.
  - Chats: `list_chats`, `get_chat_messages`, `send_chat_message`, `update_chat_message`, `delete_chat_message`, `create_chat`, `add_chat_member`.
  - Reactions: `set_channel_message_reaction`, `unset_channel_message_reaction`, `set_chat_message_reaction`, `unset_chat_message_reaction`.
  - Files: `send_file_to_channel`, `send_file_to_chat`, `download_chat_hosted_content`, `download_message_hosted_content`.
  - Search: `search_messages`, `get_my_mentions`.
  - Stdio transport. Auth is MSAL device-code with Graph delegated scopes.
  - Context limits: **read-only mode** (`TEAMS_MCP_READ_ONLY=true`) requests fewer scopes and drops write tools. Teams HTML is converted to Markdown (`contentFormat: markdown`, the default). Reads take a `limit`.

### 4. Discord (no official server)
- **SaseQ/discord-mcp** (Java/JDA, most stars, https://github.com/SaseQ/discord-mcp), **75 `@Tool`s:**
  - Messages: `send_message`, `read_messages`, `edit_message`, `delete_message`.
  - Reactions and attachments: `add_reaction`, `remove_reaction`, `get_attachment`.
  - DMs: `send_private_message`, `read_private_messages` and related tools.
  - Channels and threads: `list_channels`, `find_channel`, `get_channel_info`, `list_active_threads`.
  - Forums: `create_forum_post`, `list_forum_posts` and related tools.
  - Other: `get_user_id_by_name`, `get_server_info`, plus many admin tools (roles, bans, webhooks, emoji, invites, events, voice, permissions).
  - Transport is HTTP at `localhost:8085/mcp` or legacy stdio. Auth is a bot token, `DISCORD_TOKEN`, with an optional default `DISCORD_GUILD_ID`.
- **barryyip0625/mcp-discord** (TypeScript, the most actively developed): 46 `discord_*` tools, bot token.
- Neither has any context-limiting features beyond per-call limits.

### 5. github/github-mcp-server (design patterns only)
Source: https://github.com/github/github-mcp-server (README, `docs/remote-server.md`, `docs/scope-filtering.md`, `docs/host-integration.md`)
- **Toolsets.** Turned on with `--toolsets` or `GITHUB_TOOLSETS`. The default set is `context,repos,issues,pull_requests,users`, plus `all`, and `default,X` adds to the default. `--tools` / `X-MCP-Tools` cherry-picks individual tools and adds to the toolsets. Toolsets also gate their resources and prompts.
- **Remote URL modifiers.** `/readonly`, `/x/{toolset}`, `/x/all`, `/insiders`. Headers: `X-MCP-Toolsets`, `X-MCP-Tools`, `X-MCP-Readonly`, `X-MCP-Lockdown`, `X-MCP-Insiders`.
- **Read-only mode.** `--read-only` overrides everything, including tools named explicitly.
- **Dynamic toolset discovery was removed on 2026-05-20** (commit 0f0506d, PR #2512). It consisted of the meta-tools `enable_toolset`, `list_available_toolsets` and `get_toolset_tools` behind `--dynamic-toolsets`. The commit message gives the reason: "local-only feature never offered by the remote server … no longer in active use."
- **Consolidated tools with a `method` parameter.** For example `issue_read` takes `method`: get | get_comments | get_sub_issues | get_parent | get_labels. Write tools follow the same pattern: `issue_write`, `pull_request_review_write`, `sub_issue_write`.
- **Output and paging.** `minimal_output` defaults to true. `page` / `perPage` default to 30 with a maximum of 100. The server instructions tell models to page in batches of 5–10.
- **Scope filtering.** With a classic PAT, the server hides tools the token's scopes cannot use.
- **Lockdown mode.** Filters public-repo content by whether the author has push access (a defence against prompt injection).
- **Auth on the remote server.** OAuth with protected-resource metadata (`.well-known/oauth-protected-resource`, a 401 with `WWW-Authenticate` naming `resource_metadata`) and scope challenges (403). **DCR is not supported**. PATs are also accepted.

---

### Common patterns across chat MCP servers
1. **List channels or conversations**, usually with a name filter and a cursor (all of them).
2. **Read channel history** with limit, cursor or time-range paging (all of them).
3. **Read a thread or replies** (Slack and Teams; Zulip uses topics).
4. **Search messages** with from, in and date filters. This is the main entry point for Slack official, korotovsky and Teams. Bot tokens often cannot search.
5. **Send a message** to a channel, optionally in a thread or topic (all of them).
6. **Send a DM**, where the DM is a channel ID (Slack) or a separate tool (Zulip, Discord, Teams).
7. **Add a reaction** (all of them). Removing or reading reactions is less common.
8. **Search users / get a user profile**, so the model can resolve IDs to people (all of them).
9. **Edit or delete messages** (Teams, Discord, Zulip community servers).
10. **Join a channel, list members**, and read unread or mention feeds (korotovsky `conversations_unreads`, Teams `get_my_mentions`).
11. **Read attachments or files**, with size caps (Slack `read_file`, korotovsky 5 MB).
12. **Schedule messages and drafts** (Slack official, Zulip).
13. **Safety and context controls:**
    - read-only mode or write tools off by default;
    - tool allow-lists or a core/extended split;
    - per-channel write allow-lists;
    - compact output (CSV, or markdown instead of HTML) rather than raw JSON;
    - hard page caps (Slack search 20; Slack, korotovsky and GitHub around 100).
14. **Auth split.**
    - Vendor-hosted servers (Slack, Teams, GitHub) use OAuth with the product's own identity provider, act on behalf of the user, and **do not support dynamic client registration**: clients must be pre-registered.
    - Community servers run over local stdio with static bot or user tokens.
