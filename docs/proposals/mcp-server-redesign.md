# Proposal: MCP Server Redesign

## Status

Draft — research and target design. Nothing is implemented. Replaces the REST-catalog MCP server in `apps/meteor/ee/server/api/mcp/`.

## Problem

The current MCP server has three structural defects.

1. **The tool surface is a mirror of the REST API.** `catalog.ts` turns REST routes into tools one-to-one. The curated mode exposes 6 routes. The extended mode exposes 93 allow-listed routes, and routes with `oneOf` request schemas split into several `_by_<field>` tools, so the real count is higher than 93. Every tool carries the full AJV request schema of its route. The model sees `get_dm_messages`, `get_dm_history`, `get_chat_syncMessages` and `get_rooms_get` as four different ways to read messages, and the tool list alone takes a large part of the context window before the first call. Results come back as `JSON.stringify` of the raw REST body, with every Mongo field.
2. **Authentication is Personal Access Token only.** `index.ts` rejects any request that does not carry a PAT. MCP clients (Claude, ChatGPT, Cursor, VS Code) expect the MCP authorization flow: a `401` with `WWW-Authenticate` pointing at protected-resource metadata, then OAuth 2.1 with PKCE against the workspace. Today a user must create a PAT in the account page and paste it into a client config, often through `mcp-remote`.
3. **Tool calls go through the loopback interface.** `dispatch.ts` sends an HTTP request to `http://127.0.0.1:$PORT` with the caller's PAT. It guesses the port from `PORT`, copies `ROOT_URL_PATH_PREFIX` from the Meteor runtime config, and forwards the client IP in `X-Real-IP` so the rate limiter does not put every caller in one bucket. Each call pays for a socket, a second authentication, a second rate-limit check and a JSON round trip.

## How other products do it

Sources: the source code of each server where available, otherwise its official docs. Items marked *(unverified)* come only from search snippets, because the egress proxy blocked the vendor doc sites during the research.

### Mattermost (`mattermost-plugin-agents`, `mcpserver/`, commit `4491b8a6`, 2026-10-05)

Mattermost is the closest peer, and its catalog is **not** small:

| Aspect | Mattermost |
| --- | --- |
| Tool count | 121 registered (118 outside dev mode). 73 are read-only, 48 change state. The admin guide lists 16 as the "core" tools. |
| Core tools | `read_post` (with `include_thread`), `read_channel`, `search_posts` (keyword + optional semantic), `create_post`, `dm`, `group_message`, `create_channel`, `get_channel_info`, `get_team_info`, `search_users`, `get_channel_members`, `add_channel_member`, `get_user_channels`, `get_team_members`, `add_team_member`, `list_agents` |
| Gating | Write tools are hidden below an Enterprise license. Dev-only tools exist only in the standalone binary. No per-client toolset selection for external clients. |
| Context control | Hard `limit` caps (20 posts default, 100 max). Output is compact plain text with markdown headers, built by a shared `format/` package, never raw JSON. `read_file` pages by character offset. Errors tell the model what to do next. On-demand tool loading (`search_tools`/`load_tool`) exists only for Mattermost's own in-product agents, not for external MCP clients. |
| Transport | Streamable HTTP, stateless, inside the plugin at `/plugins/mattermost-ai/mcp-server/mcp`. In-memory transport for the in-product agents. |
| Auth | Mattermost is the authorization server. `401` + `WWW-Authenticate: Bearer resource_metadata=…`, RFC 9728 protected-resource metadata, RFC 8414 server metadata, optional Dynamic Client Registration behind its own setting, PAT as a Bearer token as a fallback. |
| Dispatch | HTTP to its own REST API v4 through `model.Client4`, with a per-user session the plugin creates. So Mattermost also loops back over HTTP; we should not copy that part. |

An internal Confluence page ("The Sovereign Agentic Governance") shows a System Console screenshot with 12 Mattermost tools. That is most likely an older plugin version. The current source has 121.

**Conclusion on Mattermost:** copy its auth flow, its output format and its 16-tool core. Do not copy the 121-tool catalog or the loopback dispatch.

### Other chat products

| Server | Tools | Auth | Context control |
| --- | --- | --- | --- |
| Slack official (hosted, `mcp.slack.com`) | ~13–18, varies by the scopes of the token *(count unverified)* | OAuth user tokens, pre-registered client, no DCR | Search-first design. Search capped at 20 per page with a cursor. |
| Slack reference server (archived) | 8 | Bot token, stdio | Caps at 200. Raw JSON output. |
| korotovsky/slack-mcp-server | 22 | User, bot or browser tokens | CSV output. Write tools off by default. Tool allow-list env var. Unreads capped per channel. |
| Zulip (akougkas/zulipchat-mcp) | 20 core, 60 extended | API key | Core/extended split, stated reason: "fewer tools means faster tool selection, lower token overhead". |
| Microsoft Teams (Agent 365) | ~28 *(unverified)* | Entra ID delegated scope | Thin Graph wrappers. |
| floriscornel/teams-mcp | 31 | MSAL device code | Read-only mode. HTML converted to markdown. |
| Discord (community) | 46–75 | Bot token | Per-call limits only. |
| GitHub official (non-chat, for patterns) | Toolsets; default set `context,repos,issues,pull_requests,users` | OAuth + PRM, no DCR, PAT fallback | Toolsets, `/readonly` URL, consolidated tools with a `method` parameter (`issue_read`, `issue_write`), `minimal_output` on by default. Dynamic toolset discovery was removed in May 2026 as unused. |

### Patterns every chat MCP server shares

1. Search messages, with `from`, `in`, and date filters. This is the main entry point for the hosted servers.
2. Read the history of a channel, with a limit and a cursor.
3. Read a thread.
4. Send a message to a channel, a thread or a DM.
5. List or find channels.
6. Find users, so the model can turn names into IDs.
7. Add a reaction.
8. Read unreads or mentions ("what did I miss").
9. Read-only mode or write tools off by default.
10. Compact output (text, markdown or CSV), never the raw API body.
11. Hosted servers use OAuth with the product's own identity provider and act as the user.

## Proposed solution

### 1. A task-shaped tool set: 10 core tools

Each tool answers one question an agent asks, and hides which REST routes or models serve it. Room references accept an ID, a `#name`, or an `@username` (which resolves to the DM with that user), so the model does not need a lookup call before most actions.

| Tool | Kind | Replaces (current tools) |
| --- | --- | --- |
| `search_messages` | read | `get_chat_search`, `get_spotlight` (messages). Uses AI Intelligent Search when it is enabled and configured, keyword search otherwise. Filters: `query`, `room`, `from`, `before`, `after`, `limit` (default 10, max 20), `cursor`. |
| `read_room` | read | `get_dm_history`, `get_dm_messages`, `get_chat_syncMessages`, channel and group history. Params: `room`, `limit` (default 20, max 100), `before`, `after`, `cursor`. Thread replies are collapsed into a reply count. |
| `read_message` | read | `get_chat_getMessage`, `get_chat_getThreadMessages`, `get_chat_syncThreadMessages`. Params: `message_id`, `include_thread` (default true), `limit`. |
| `list_rooms` | read | `get_rooms_get`, `get_subscriptions_get`, `get_dm_list`, `get_channels_list_joined`, `get_rooms_autocomplete_*`, `get_teams_listRooms*`. Params: `query`, `scope` (`joined` \| `directory`), `type`, `team`, `unread_only`, `limit`, `cursor`. |
| `get_room` | read | `get_rooms_info`, `get_teams_info`, `get_rooms_membersOrderedByRole`, `get_dm_members`, `get_teams_members`, `get_chat_getPinnedMessages`. Params: `room`, `include` (`members` \| `pinned` \| `topic`…). |
| `find_users` | read | `get_users_info`, `get_users_autocomplete`, `get_users_getPresence`, `get_users_getStatus`, `get_me`. Params: `query` or `user`, `limit`. With no arguments it returns the caller. |
| `get_inbox` | read | `get_chat_getMentionedMessages`, `get_chat_getThreadsList`, unread counts from subscriptions. Returns unread rooms, recent mentions and followed threads with new replies, each capped. |
| `send_message` | write | `post_chat_postMessage`, `post_chat_sendMessage`, `post_dm_create`, `post_dm_open`. Params: `room`, `text`, `thread_id`, `also_send_to_room`. Opens the DM when `room` is `@username`. |
| `react` | write | `post_chat_react`. Params: `message_id`, `emoji`, `remove`. |
| `create_room` | write | `post_channels_create`, `post_rooms_createDiscussion`, `post_teams_create`. Params: `type` (`channel` \| `private` \| `discussion` \| `team`), `name`, `members`, `parent` (for a discussion), `team`. |

Ten tools cover the eight shared patterns above. The current extended set needs more than 93 tools for the same coverage.

### 2. Optional toolsets, off by default

Everything outside the core goes into named toolsets. Each toolset uses consolidated tools with an `action` parameter, the way GitHub uses `issue_read`/`issue_write`, so a toolset adds one to three tools, not twenty.

| Toolset | Tools | Covers |
| --- | --- | --- |
| `messages` | `edit_message` (`action`: `update` \| `delete`), `mark_message` (`action`: `pin` \| `unpin` \| `star` \| `unstar` \| `follow` \| `unfollow` \| `report`) | 12 current `post_chat_*` tools |
| `membership` | `manage_room_members` (`action`: `join` \| `leave` \| `invite` \| `remove` \| `mute` \| `unmute` \| `ban` \| `unban` \| `set_role`) | `post_rooms_*`, `post_teams_addMembers`… |
| `rooms` | `update_room` (`action`: `settings` \| `archive` \| `unarchive` \| `favorite` \| `hide` \| `read` \| `unread`) | `post_rooms_saveRoomSettings`, `post_subscriptions_*`… |
| `teams` | `manage_team` (`action`: `update` \| `add_room` \| `remove_room` \| `convert`) | `post_teams_*` |
| `profile` | `set_status` | `post_users_setStatus`, `post_custom_user_status_*` |

User administration (`post_users_create`, `post_users_update`) leaves the MCP surface. Those are admin operations, not agent tasks.

Selection, in order of precedence:

- An admin setting lists the toolsets the workspace allows. Default: core only.
- A client narrows the set per connection with a URL path (`/api/v1/mcp/x/messages,membership`) or an `X-MCP-Toolsets` header.
- A read-only switch (`/api/v1/mcp/readonly`, an admin setting, or a token without the `mcp:write` scope) removes every write tool. It overrides everything else.

With all toolsets on, the server exposes about 17 tools.

### 3. Output format for a model, not for a REST client

- Every tool returns one `text` content block in compact markdown, built by one formatter module. No raw REST bodies, no Mongo fields such as `_updatedAt`, `ts.$date` or `u._id` unless the model needs them as a reference.
- A message renders as one line: `[msg_id] 2026-10-06 14:02 @alice: text (3 replies, :+1: 2)`.
- Every list ends with the cursor for the next page, or with "no more results".
- Hard caps live in the input schema (`maximum`), so the client sees them.
- Errors set `isError` and say what to do next, for example "Room `#foo` not found. Call `list_rooms` with `query: \"foo\"`".
- Every tool carries the MCP annotations `readOnlyHint`, `destructiveHint` and `idempotentHint`.
- The `instructions` field of `initialize` tells the model the search-first workflow and the room reference syntax, once, instead of repeating it in every tool description.

### 4. OAuth 2.1 through the workspace's own OAuth provider

The workspace already runs an OAuth 2.0 authorization server (`apps/meteor/server/oauth2-server/`, `@node-oauth/oauth2-server` ~5.3), and the REST layer already accepts its Bearer tokens (`oAuth2ServerAuth`). The MCP authorization spec needs these additions:

| Requirement (MCP authorization spec) | Current state | Change |
| --- | --- | --- |
| `401` + `WWW-Authenticate: Bearer resource_metadata="…"` | The MCP route returns `-32001 Personal Access Token required` | Return the challenge from the MCP route. |
| RFC 9728 protected-resource metadata | Missing | Serve `/.well-known/oauth-protected-resource/api/v1/mcp` with `resource`, `authorization_servers`, `scopes_supported: ["mcp:read", "mcp:write"]`. |
| RFC 8414 authorization-server metadata | Missing | Serve `/.well-known/oauth-authorization-server` with the existing `/oauth/authorize` and `/oauth/token` endpoints. |
| PKCE (S256) is mandatory | The model drops the challenge: `saveAuthorizationCode` and `getAuthorizationCode` in `model.ts` do not store or return `codeChallenge`/`codeChallengeMethod` | Persist both fields in `OAuthAuthCodes`; require S256 for public clients. |
| Scopes | `verifyScope` compares scopes to grant types; codes and tokens store no scope | Store the granted scope on codes and tokens. Gate write tools on `mcp:write`. |
| Audience binding (RFC 8707 `resource` parameter) | Tokens have no audience | Store the `resource` on the token; the MCP route rejects a token issued for another audience. |
| Client registration | Admin creates OAuth apps manually | Keep manual registration. Add Client ID Metadata Documents (the registration method the 2025-11-25 spec recommends). Add Dynamic Client Registration only behind a setting that is off by default, as Mattermost does, because the DCR endpoint is unauthenticated. |
| Consent | `/oauth/authorize` UI exists | Show the requested scopes and the client's metadata URL. |

PATs stay valid as a Bearer token for headless agents and CI. The `access-mcp` permission and the AI license module still gate the route.

These OAuth changes are useful outside MCP too, so they ship as their own pull requests before the MCP rewrite (see [change organization](../change-organization.md)).

### 5. In-process dispatch, no loopback

Two options, both without a socket:

- **A. Synthetic request through the Hono app.** Build a `Request` and pass it to the API router's `fetch`, with the identity and the client address already set in the Hono context. The REST route runs its own validation, permission checks and response schema. This keeps the "no duplicated business logic" property of today's design. The MCP layer must set `remoteAddress` directly, because `remoteAddressMiddleware` has no socket to read and a forwarded `X-Real-IP` header must not be trusted. It must also skip the second authentication and the second rate-limit check, because the MCP route already did both.
- **B. Direct calls into services and lib functions** (`messageSearch`, `executeSendMessage`, `findChannelAndPrivateAutocomplete`, `AISearch`). This is faster and gives the formatter typed data, but each tool must repeat the permission checks the REST route does.

Recommendation: use **A** for the first version. Each task-shaped tool calls one or more REST routes in-process and formats the result. Move a tool to **B** only when a measurement shows that A is too slow for it. Either way, the stateless Streamable HTTP transport stays as it is.

### 6. Code layout

```
apps/meteor/ee/server/api/mcp/
  index.ts          # route, transport checks, auth challenge (kept, smaller)
  protocol.ts       # JSON-RPC handling (from server.ts)
  dispatch.ts       # in-process synthetic request (rewritten)
  format/           # message, room, user, list renderers
  tools/            # one file per tool; each exports definition + handler
  toolsets.ts       # core + optional toolsets, read-only filtering
apps/meteor/server/oauth2-server/
  metadata.ts       # RFC 8414 + RFC 9728 documents
```

`catalog.ts` and its schema-flattening code (`mcpSafeSchema`, `variantsForRoute`, `fitToolName`) are deleted. Tool input schemas are written by hand, small and flat.

## Delivery plan

Each step is one pull request that can be reverted alone.

1. **fix(oauth):** persist PKCE challenge fields and granted scopes.
2. **feat(oauth):** authorization-server and protected-resource metadata; `resource` audience on tokens.
3. **refactor(mcp):** in-process dispatch replaces the loopback `fetch`. Same tools, same behaviour, so the change is verifiable alone.
4. **feat(mcp):** OAuth challenge on the MCP route; PAT stays as a fallback.
5. **feat(mcp)!:** the 10 core tools with the new formatter replace the catalog. `MCP_Expose_Extended_API` is removed.
6. **feat(mcp):** optional toolsets and read-only mode.

The MCP endpoint is behind an alpha alert today (`MCP_Alpha_Alert`), so step 5 can break the tool names without a deprecation period.

## Open questions

1. Must `search_messages` fall back to keyword search when AI Intelligent Search is off, or must it say that search needs the AI module? The MCP route already requires the AI license module.
2. Do we expose omnichannel (livechat rooms, departments) as a toolset? No surveyed competitor has an equivalent.
3. Do we need an admin audit record for each MCP grant, as Mattermost writes? This also ties in with the agent governance work in PI-168.
4. Do we expose resources (for example, a room as `rocketchat://room/{id}`)? Mattermost and the hosted Slack server expose tools only, and most MCP clients use tools only.

## Sources

The raw research output is in [mcp-server-redesign-research/](mcp-server-redesign-research/): [Mattermost](mcp-server-redesign-research/mattermost.md), [other chat servers](mcp-server-redesign-research/other-chat-servers.md), and [the current Rocket.Chat state](mcp-server-redesign-research/rocket-chat-current-state.md).

- Mattermost: `github.com/mattermost/mattermost-plugin-agents` — `mcpserver/tools/provider.go`, `mcpserver/tools/classification_test.go`, `mcpserver/plugin_handlers.go`, `mcpserver/oauth_metadata.go`, `docs/admin_guide.md`.
- Slack: `github.com/slackapi/slack-skills-plugin`; `github.com/modelcontextprotocol/servers-archived/tree/main/src/slack`; `github.com/korotovsky/slack-mcp-server`; `docs.slack.dev/ai/slack-mcp-server/` (not reachable during research).
- Zulip: `github.com/akougkas/zulipchat-mcp`, `github.com/Monadical-SAS/zulip-mcp`.
- Teams: `github.com/floriscornel/teams-mcp`; `learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/teams` (not reachable during research).
- Discord: `github.com/SaseQ/discord-mcp`, `github.com/barryyip0625/mcp-discord`.
- GitHub: `github.com/github/github-mcp-server` — README, `docs/remote-server.md`, `docs/scope-filtering.md`.
- Internal: Confluence "The Sovereign Agentic Governance"; Jira PI-125, CORE-2624.
