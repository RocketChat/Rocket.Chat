# Research: Mattermost MCP server

> Raw research output, kept unedited. Collected on 2026-10-06 by a research agent for [the MCP server redesign proposal](../mcp-server-redesign.md).
> Scope: the MCP server in mattermost-plugin-agents — tools, transports, authentication, dispatch, output size.

---

## Mattermost MCP server: research report

**Sources.** I cloned github.com/mattermost/mattermost-plugin-agents at commit `4491b8a6` (2026-10-05) and read the Go source. The egress proxy blocks docs.mattermost.com and mattermost.com (403), so I could only see search-result snippets of the docs page and the blog post. Anything taken only from those is marked unverified.

Key files (paths relative to the repo root, browsable at `https://github.com/mattermost/mattermost-plugin-agents/blob/master/...`):
- `mcpserver/tools/provider.go`: tool registration, license gating, result format.
- `mcpserver/tools/*.go`: one file per area.
- `mcpserver/tools/classification_test.go`: the definitive tool list.
- `mcpserver/plugin_handlers.go`: the production HTTP endpoint.
- `mcpserver/http_server.go`, `stdio_server.go`, `inmemory_server.go`: the other transports.
- `mcpserver/auth/*.go`: authentication providers.
- `mcpserver/oauth_metadata.go`: protected-resource metadata.
- `api/api.go`, `api/middleware_mcp.go`, `api/mcp_handlers.go`: plugin routing and auth.
- `mcp/embedded_session_store.go`: the per-user session it creates.
- `docs/admin_guide.md` (section "Mattermost MCP Server") and `mcpserver/README.md`.

### 1. Tools

- **Count:** 121 tools in total. 118 are always registered and 3 only in dev mode. 73 are read-only (`ReadOnlyHint` annotation set) and 48 change state (45 outside dev mode). `classification_test.go` asserts every registered tool appears in its map.
- **Core tools** (the admin guide's headline list, 16):
  - `read_post`: params `post_id`, `include_thread` (default true).
  - `read_channel`: params `channel_id`, `limit` (default 20, max 100), `since`, `before`, `after`, `page`.
  - `search_posts`: params `query`, `team_id`, `channel_id`, `from`, `in`, `before`, `after`, `keyword_limit`/`keyword_offset`. When semantic search is enabled it also takes `semantic_limit` (max 50) / `semantic_offset`.
  - `create_post`: params `channel_id`, `message`, `root_id`, `props`, `attachments`.
  - `dm`, `group_message`.
  - `create_channel`: params `name`, `display_name`, `type`, `team_id`.
  - `get_channel_info`: looks up by id, display name or name.
  - `get_team_info`.
  - `search_users`: params `term`, `limit` (max 100).
  - `get_channel_members`: `limit` default 50, max 200; `exclude_bots`.
  - `add_channel_member`, `get_user_channels`, `get_team_members`, `add_team_member`, `list_agents`.
- **Extended catalog**, by area:
  - **Posts:** `get_post_info`, `list_pinned_posts`, `list_saved_posts`, `update_post`, `delete_post`, `pin_post`, `unpin_post`, `save_post`, `acknowledge_post`.
  - **Scheduled posts:** `list_scheduled_posts`, `create_scheduled_post`, `update_scheduled_post`, `delete_scheduled_post`, `set_post_reminder`.
  - **Reactions and emoji:** `get_post_reactions`, `list_custom_emoji`, `search_custom_emoji`, `add_reaction`, `remove_reaction`.
  - **Threads and unreads:** `get_threads`, `get_mentions`, `get_unread_counts`, `get_channel_unread`, `get_posts_around_unread`, `mark_channel_read`, `mark_channels_viewed`, `mark_post_unread`, `set_thread_follow`.
  - **Channels:** `get_channel_stats`, `get_channel_member_counts`, `search_channels`, `list_team_channels`, `list_archived_channels`, `update_channel`, `archive_channel`, `restore_channel`, `convert_channel_privacy`.
  - **Channel members:** `get_channel_member`, `get_channel_members_by_ids`, `get_channel_members_by_status`, `get_user_channel_memberships`, `get_users_not_in_channel`, `search_users_in_channel`, `list_sidebar_categories`, `add_channel_members`, `remove_channel_member`, `set_channel_mute`, `set_channel_favorite`, `update_channel_notify_props`.
  - **Bookmarks:** list, create, update and delete.
  - **Users:** `get_me`, `get_user`, `get_user_by_username`, `get_user_by_email`, `get_users_by_ids`, `get_users_by_usernames`, `get_user_stats`, `get_user_cpa_values`, `list_cpa_fields`, `update_user`.
  - **Status:** `get_user_status`, `get_users_statuses`, `get_user_custom_status`, `set_status`, `set_dnd`.
  - **Teams:** 9 read tools plus `add_team_members`, `remove_team_member`, `update_team`, `invite_users_to_team`, `invite_users_to_team_and_channels`.
  - **Files:** `read_file` (`offset`; `limit` default 6000 characters, capped at 20000), `get_file_info`, `get_post_files`, `get_file_link`, `search_files`, `upload_file`.
  - **Integrations:** `get_bot`, `list_bots`, `list_incoming_webhooks`, `list_outgoing_webhooks`.
  - **Groups:** 6 read tools.
  - **Roles:** `get_role`, `get_channel_moderations`, `update_channel_member_roles`, `update_team_member_roles`.
- **Gating:**
  - **Dev mode:** `create_user`, `create_team` and `create_post_as_user` (username/password login) appear only with `--dev`, which only the standalone binary can set. The plugin endpoint hard-codes `DevMode: false`.
  - **License:** state-changing tools are hidden from `tools/list` and refused on `tools/call` below Enterprise. The check runs on every request. The license table reads "Built-in Mattermost tools: read-only" for Free/Professional and "read + write" for Enterprise and above.
  - **Access mode:** schema fields tagged `access:"local"` (local file-path attachments) exist only in stdio mode. HTTP and embedded servers run in "remote" mode.
  - **Admin and access control:** the plugin endpoint adds an access-control (ABAC) filter middleware and per-tool admin policies. There is no admin-only tool set; tools run with the user's own Mattermost permissions.
- **Not part of the server:** `search_tools` and `load_tool` belong to the plugin's own agent client (`mcp/meta_tools.go`) for loading tools on demand. They are not exposed by the MCP server.

### 2. Resources and prompts

None. There are no `AddResource`, `AddPrompt` or resource-template calls anywhere in `mcpserver/`; it exposes tools only. The plugin's external endpoint can also re-expose (proxy) tools from other plugins' MCP servers (`proxy_tools.go`). Native tools win name collisions and the conflicting plugin tool is skipped.

### 3. Transports and where it runs

All transports use the official `modelcontextprotocol/go-sdk`. There are three ways to run it:

- **Embedded, for in-product agents.** In-memory transport (`mcp.NewInMemoryTransports`) inside the plugin process. Always on.
- **Production external endpoint.** Served inside the Agents plugin at `{SiteURL}/plugins/mattermost-ai/mcp-server/mcp`. It needs the admin setting "Enable Mattermost MCP Server (HTTP)".
  - Streamable HTTP in stateless mode (`Stateless: true`), with a 4 MiB request limit.
  - The admin guide says it does not support the older SSE transport.
  - Requires Mattermost Server v11.2+.
  - Limited to 32 concurrent requests per user; over the cap it returns 429 with `Retry-After: 10`.
- **Standalone binary** `mattermost-mcp-server`. Supports stdio (default) or `--transport http`.
  - HTTP mode serves `/mcp` (streamable HTTP, stateful by default, `--stateless` optional), plus legacy `/sse` and `/message`.
  - It checks the Origin and Host headers to block DNS-rebinding attacks.
  - The repo labels it "development and local use only, not supported for production."

### 4. Authentication

- **Plugin endpoint:** OAuth with Mattermost acting as the authorization server.
  - An unauthenticated request gets `401` with `WWW-Authenticate: Bearer resource_metadata="{SiteURL}/plugins/mattermost-ai/mcp-server/.well-known/oauth-protected-resource"`.
  - The RFC 9728 metadata returns `resource`, `authorization_servers: [SiteURL]`, `scopes_supported: ["user"]` and `resource_name`.
  - The authorization-server metadata is at `{SiteURL}/.well-known/oauth-authorization-server`, served by the core server.
  - The admin must enable the "OAuth 2.0 Service Provider" setting. Dynamic Client Registration (RFC 7591) is optional and has its own setting; the docs warn the DCR endpoint is unauthenticated. Manual OAuth app registration also works. Both public and confidential clients are supported.
  - A PAT sent as a Bearer token also works (admin guide).
- **How the plugin knows the user:** it does not validate the token itself. The Mattermost server authenticates the request (OAuth access token, PAT or session) and passes the `Mattermost-User-Id` header to the plugin. The plugin then creates or reuses a dedicated Mattermost session for that user, writes an audit record for that grant, and builds a token resolver from the session.
- **Standalone binary:**
  - stdio uses a PAT (`MM_ACCESS_TOKEN` / `--token`), checked at startup with `GetMe`.
  - HTTP mode takes a Bearer token and passes it through as an OAuth token. The source has a TODO saying token introspection is not implemented yet.

### 5. How a tool call reaches the Mattermost API

Every transport calls the REST API over HTTP using `model.Client4` (API v4), built per call from the auth provider. The plugin's internal plugin API is not used for tool logic.

- **Embedded and plugin endpoint:** the client uses the per-user session token, against the internal URL if one is configured, otherwise the SiteURL.
- **Semantic search and `read_file`:** external servers call back to the plugin's own HTTP routes (`/plugins/mattermost-ai/api/v1/search/raw` and the file-content route). The embedded server calls the search service in-process.
- **Proxied plugin tools:** the call is relayed to the source plugin over the inter-plugin HTTP round tripper, carrying the caller's user ID.

### 6. Keeping output small

- **Pagination:** list tools take `limit`/`page` (or offset) with schema maximums of 100 (7 fields), 200 (17 fields) or 50 (1 field). Common defaults are 20 posts, 50 members and 10 search hits. `read_file` pages by character offset (default 6000, cap 20000) and tells the model what offset to use next.
- **Input bounds:** ID fields are fixed at 26 characters; queries are capped at 4000.
- **Format:** each result is a single MCP `TextContent` of compact plain text with markdown bold headers, built by a shared `format/` package. It is not JSON; the contributor notes forbid ad-hoc `Sprintf` on model types. Errors come back as `isError` text that tells the model what to do next.
- **Discovery:** only the plugin's own agents load schemas on demand ("dynamic tool loading", on by default). External clients receive the full `tools/list`.

### 7. Published design rationale

Little is stated explicitly. What exists:
- The admin guide's use cases: channel summaries, cross-posting, search, team coordination, workflow automation, reading threads for context.
- "All operations respect Mattermost's permission system."
- A note that dynamic loading avoids "carrying every schema in context."
- Tool descriptions that embed guidance for the model, e.g. search is a literal AND match so use 1–2 terms, and mention search should use the username.
- `mcpserver/AGENTS.md` conventions: read vs state-changing classification, and gating write tools by license.

I found no document explaining why this particular tool set was chosen.

**Unverified (sites blocked):** the full content of docs.mattermost.com/agents/mcpserver/README.html. It appears to be a render of the repo's `mcpserver/README.md`. From the blog post mattermost.com/blog/mattermost-mcp-server/, only search snippets were visible: availability in Agents v1.7.2+ on all plans, and agents inheriting the user's permissions.
