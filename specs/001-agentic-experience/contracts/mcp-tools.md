# Contract: MCP tools for agents

The workspace MCP server (`apps/meteor/ee/server/api/mcp/`) keeps its transport, auth, and loopback dispatch. This contract adds tools to the catalog and a filter per caller. REST shapes: [rest-agents.md](rest-agents.md).

## Catalog evaluation (FR-036)

| Need | Requirement | Existing tool | Decision |
|------|-------------|---------------|----------|
| Register an agent | FR-007 | none | Add `post_agents_register` |
| Know itself | FR-041 | `get_me` (user only) | Add `get_agents_me` |
| Learn of messages and decisions | FR-042, FR-034 | `get_chat_syncMessages` (one room) | Add `get_agents_messages` |
| Reply in the right place | FR-026, FR-027 | `post_chat_postMessage` (no placement rule) | Add `post_agents_reply` |
| Post with no trigger | FR-028 | same | Add `post_agents_post` |
| Ask for approval | FR-029 | none | Add `post_agents_approvals_create` |
| Read a decision | FR-034 | none | Add `get_agents_approvals_info` |
| Read a message, a thread, room info, members | FR-022 | `get_chat_getMessage`, `get_chat_getThreadMessages`, `get_rooms_info`, `get_rooms_membersOrderedByRole` | Reuse |
| Search messages | FR-040 | `get_chat_search` (bounded by subscriptions and `canAccessRoom`) | Reuse |
| React | none | `post_chat_react` | Reuse |
| Directory, spotlight, autocomplete, user list | FR-040 | `get_spotlight`, `get_directory`, `get_users_autocomplete`, `get_rooms_autocomplete_*`, `get_users_list` | Leave out (SH-003) |
| Create rooms, discussions, direct messages | FR-023 edge cases | `post_channels_create`, `post_rooms_createDiscussion`, `post_dm_create` | Leave out (SH-004) |
| Owner operations | FR-018, FR-046 | none | Add `post_agents_suspend`, `post_agents_reactivate`, `post_agents_credential_rotate`, `post_agents_credential_revoke` for humans |

Every new tool is a catalog entry that points at an `agents.*` REST route. No tool needs a custom handler.

## Agent tool table (`AGENT_TOOLS`)

An agent may declare only these tools. `get_agents_me` is always in scope and needs no declaration.

| Tool | Route | Permissions | Room argument | Posts |
|------|-------|-------------|---------------|-------|
| `get_agents_me` | `GET agents.me` | none | none | no |
| `get_agents_messages` | `GET agents.messages` | `view-joined-room` | none (the endpoint reads only allowed rooms) | no |
| `post_agents_reply` | `POST agents.reply` | `view-joined-room` | `msgId` | yes |
| `post_agents_post` | `POST agents.post` | `view-joined-room` | `roomId` | yes |
| `post_agents_approvals_create` | `POST agents.approvals.create` | `view-joined-room` | `roomId` | yes |
| `get_agents_approvals_info` | `GET agents.approvals.info` | none | none | no |
| `get_chat_getMessage` | `GET chat.getMessage` | `view-joined-room` | `msgId` | no |
| `get_chat_getThreadMessages` | `GET chat.getThreadMessages` | `view-joined-room` | `tmid` | no |
| `get_chat_search` | `GET chat.search` | `view-joined-room` | `roomId` | no |
| `post_chat_react` | `POST chat.react` | `view-joined-room` | `messageId` (resolved as `msgId`) | no |
| `get_rooms_info` | `GET rooms.info` | `view-joined-room` | `roomId` | no |
| `get_rooms_membersOrderedByRole` | `GET rooms.membersOrderedByRole` | `view-joined-room` | `roomId` | no |

The table leaves out by design every tool that manages users, bans, mutes, changes room settings, archives rooms, invites members, edits teams, or resolves a room by name (FR-043).

## Per-caller behavior

| Caller | `tools/list` | `tools/call` |
|--------|--------------|--------------|
| Human | The current catalog, plus `post_agents_register` and the owner tools. Agent-only tools are hidden. | As today. The REST endpoint checks permissions. |
| Agent | Only the tools in its effective scope ([data-model.md](../data-model.md#effective-scope-computed-per-call-never-stored)). | A tool outside the effective scope returns a JSON-RPC error that names the tool. The REST guard denies it too. |

- The filter reads the user from the Hono context, which the POST handler already resolves (`index.ts:~270`). `McpAuth` gains the user type.
- The filter runs on each request. A scope change applies to the next `tools/list` and the next `tools/call` (FR-016).
- A REST error from the guard reaches the agent as a tool error with the same error code and `details`.
- The dispatch adds the `X-RC-MCP-Dispatch` header with the process secret to every loopback call, for humans and agents alike (D-15). A human call ignores it.

## Human MCP use

Human callers see the same tools as before, plus the agent registration and owner tools. Their calls follow the same path as today (DC-2).

## Amendment A-1: agent message stream

**Status**: Proposed ([plan.md, A-1](../plan.md#a-1-2026-11-19-push-delivery-over-mcp)). This section applies to MCP revision 2026-07-28 only.

### Capabilities

`server/discover` advertises `resources: { subscribe: true }` to an agent caller. A human caller sees no change.

### Resource

| URI | Caller | `resources/read` returns |
|-----|--------|--------------------------|
| `rocketchat://agents/me/messages` | Agent | The body of `agents.messages` for the `cursor` in the URI query, as JSON text. |

`resources/read` passes the agent guard as `get_agents_messages` does.

### `subscriptions/listen`

- Request: `notifications.resourceSubscriptions: ["rocketchat://agents/me/messages"]`. The server drops every other URI and every list-change type from the acknowledgment.
- Response: `text/event-stream`, with `X-Accel-Buffering: no`.
  1. `notifications/subscriptions/acknowledged` with the honored filter.
  2. `notifications/resources/updated` with the URI, when a message or an approval decision is ready for the agent. Several events in 250 ms merge into one.
  3. An SSE comment every 15 s.
  4. The closure result after 60 min, or when the server shuts down.
- The server closes the stream without a result when the agent is suspended, loses its credential, is deleted, or opens a second stream on the same instance.
- A human caller gets `-32601` (`Method not found`).
