# Contract: REST endpoints `agents.*`

Every endpoint uses the validated `API.v1.get()` / `.post()` pattern, with request and response schemas in `packages/rest-typings/src/v1/agents.ts` (constitution VI). Every endpoint carries `authRequired: true`. The MCP catalog turns each one into a tool ([mcp-tools.md](mcp-tools.md)). Entities: [data-model.md](../data-model.md).

## Common errors

| Error | HTTP | When |
|-------|------|------|
| `error-agent-capability-not-allowed` | 403 | The tool is outside the effective scope. `details.tool` names it. |
| `error-agent-room-not-allowed` | 403 | The agent is not a member of the room (FR-061). `details.roomId` names it. |
| `error-agent-suspended` | 403 | The agent is suspended. |
| `error-agent-rate-limited` | 429 | Post 61 inside the window. `details.retryAfter` gives the seconds to wait. The `Retry-After` header carries the same value. |
| `error-not-an-agent` | 403 | A human calls an agent-only endpoint. |
| `error-agent-cannot-register` | 403 | An agent calls `agents.register`. |
| `error-agent-mcp-only` | 403 | An agent calls a REST route directly, not through the MCP server (FR-053). `details.entryPoint` holds `/api/v1/mcp`. |
| `error-agent-mcp-unavailable` | 403 | `agents.register`, `agents.update`, `agents.suspend`, `agents.reactivate`, or `agents.credential.rotate` runs while the MCP server is off or unlicensed (D-18, FR-060). |
| `error-license-user-limit-reached` | 400 | `agents.register` runs while the workspace has no free license seat (FR-059). |
| `error-agent-invalid-blocks` | 400 | `agents.reply` or `agents.post` carries a block outside the allow list, an interactive element, or a malformed block (FR-057). `details.rejected` lists each one. |

The guard writes an `agent.call.denied` audit event for each of the first four errors. It writes `agent.entry.refused` for `error-agent-mcp-only`, at most once per agent per minute (FR-055).

An agent reaches every endpoint below only through an MCP tool. The examples show the REST shapes that the tools return.

## Human endpoints

### `POST agents.register` (FR-007 to FR-014, FR-056)

Permission: `register-agents`. The caller must not be an agent. The MCP server must be enabled and licensed (D-18).

Request:

```json
{
  "username": "release-bot",
  "name": "Release Agent",
  "description": "Posts release notes and asks for deploy approval.",
  "replyMode": "mention",
  "capabilities": ["get_agents_messages", "post_agents_reply", "post_agents_approvals_create"]
}
```

Response `200`:

```json
{
  "agent": { "_id": "…", "username": "release-bot", "ownerId": "<caller>", "replyMode": "mention", "capabilities": ["…"], "status": "active" },
  "credential": { "userId": "…", "token": "<shown once>" }
}
```

Response `400` with `error-agent-capabilities-refused`. `details.refused` lists each refused capability with a reason: `unknown-tool`, `not-allowed-for-agents`, `owner-lacks-permission`.

The request has no owner field. The owner is always the caller (FR-009).

An agent takes a license seat. The endpoint refuses with `error-license-user-limit-reached` when no seat is free, on every path (FR-059). The admin form (RP-5) calls this endpoint and sends the fixed capability set (SH-009).

The caller authenticates with a PAT (RP-1, RP-7) or an OAuth access token (RP-2). With an OAuth token, the endpoint deletes every access token and refresh token of that client for the caller after it creates the agent (FR-056). A later call with the token gets `401`. A refused registration keeps the token. A PAT is never revoked. The deletes go through `OAuthAccessTokens.deleteByClientIdAndUserId` and `OAuthRefreshTokens.deleteByClientIdAndUserId`, two new model methods.

### `GET agents.info?agentId=` (FR-005)

Permission: none beyond `authRequired`. The response holds the info panel data. The caller must be allowed to see the user under the existing user rules.

```json
{ "agent": { "_id": "…", "username": "…", "name": "…", "description": "…", "owner": { "_id": "…", "username": "…", "name": "…" } , "capabilities": ["…"], "replyMode": "mention", "status": "active" } }
```

`owner` is `null` when the owner was deleted.

### `POST agents.update` (FR-020, FR-021, FR-024, FR-045, FR-061)

Permission: `manage-agents`.

```json
{ "agentId": "…", "description": "…", "ownerId": "…", "replyMode": "ambient", "roomIds": ["GENERAL", "…"] }
```

Every field except `agentId` is optional. `roomIds` is the wanted room set. The endpoint adds the agent to each room it is not a member of and removes it from each room outside the set, with the caller as the actor, before the response returns. The membership is the allow list, so no other field stores it. A direct message id is refused.

## Agent room membership (FR-062 to FR-064)

No new endpoint. Every existing path that adds a member (`channels.invite`, `groups.invite`, `/invite`, team adds, room creation with members, a group direct message, and the rest in [research.md, D-19](../research.md#d-19-who-adds-an-agent-to-a-room-fr-062-to-fr-064)) refuses an agent target unless the caller holds `manage-agents`:

```json
{ "success": false, "errorType": "error-agent-add-not-allowed", "details": { "permission": "manage-agents", "agentId": "…", "roomId": "…" } }
```

Status `403` on REST. A DDP method returns the same error. Room creation fails as a whole. An automated path with no actor skips the agent and writes the audit entry.

Every existing path that removes a member works for an agent, under its existing permission (FR-063).

### `POST agents.suspend`, `POST agents.reactivate` (FR-046, FR-047)

Caller: an admin with `manage-agents`, or the owner. Body: `{ "agentId": "…" }`.

### `POST agents.credential.rotate`, `POST agents.credential.revoke` (FR-018, FR-052)

Caller: an admin with `manage-agents`, or the owner. Body: `{ "agentId": "…" }`. Rotate returns `{ "credential": { "userId": "…", "token": "<shown once>" } }`.

### `POST agents.delete` (FR-046)

Permission: `manage-agents`. Body: `{ "agentId": "…" }`. The agent messages stay, the same as for any deleted user.

## Agent endpoints

The caller must be an agent. The guard checks the effective scope first.

### `GET agents.me` (FR-041)

Always in scope.

```json
{ "agent": { "_id": "…", "owner": { "_id": "…", "username": "…" }, "capabilities": ["…"], "effectiveScope": ["…"], "replyMode": "mention", "allowedRooms": [{ "_id": "…", "name": "…", "t": "c" }] } }
```

`allowedRooms` lists the rooms where the agent is a member, direct messages excluded (FR-061).

### `GET agents.messages?since=&count=` (FR-025, FR-034, FR-042, FR-049)

- `since`: an ISO date. Default: now minus 60 s.
- `count`: 1 to 100. Default: 50.

```json
{
  "messages": [{ "_id": "…", "rid": "…", "tmid": "…", "msg": "…", "u": { "_id": "…", "username": "…" }, "ts": "…", "agent": false }],
  "approvals": [{ "_id": "…", "state": "approved", "decidedBy": { "_id": "…", "username": "…" }, "decidedAt": "…" }],
  "cursor": "2026-11-18T20:00:00.000Z"
}
```

The response may repeat an item near the cursor. The harness removes repeats by `_id`. The harness polls every 2 s.

### `POST agents.reply` (FR-026, FR-027)

```json
{ "msgId": "…", "text": "…", "blocks": [{ "type": "section", "text": { "type": "mrkdwn", "text": "*Build 7.4.1* passed" } }] }
```

`blocks` is optional (FR-057). Allowed: the blocks `section`, `context`, `divider`, `header`, `image`, and `markdown`, and the elements `plain_text`, `mrkdwn`, and `image`. A `section` accessory must be an `image`. `text` is required with blocks too. A refusal:

```json
{ "success": false, "errorType": "error-agent-invalid-blocks", "details": { "rejected": [{ "index": 1, "type": "actions", "reason": "type-not-allowed" }, { "index": 2, "type": "section", "reason": "interactive", "path": "$input[2].accessory", "expected": "image" }] } }
```

`reason` is `interactive`, `type-not-allowed`, or `invalid`. `path` and `expected` come from the UiKit validator.

The server picks the place:

- In a direct message, the reply goes to the conversation.
- In a room with threads enabled, the reply goes to the thread of the message, or of its root.
- In a room with threads disabled, the reply goes to the main timeline.

The response returns the posted message. The FR-050 counter applies.

### `POST agents.post` (FR-028)

```json
{ "roomId": "…", "text": "…", "blocks": [] }
```

`blocks` follows the rules of `agents.reply`.

Only an agent in autonomous mode may call it. Others get `error-agent-capability-not-allowed`. The FR-050 counter applies.

### `POST agents.approvals.create` (FR-029, FR-030)

```json
{ "roomId": "…", "request": "Deploy 7.4.1 to production?", "approverIds": ["…"], "expiresAt": "2026-11-18T22:00:00.000Z" }
```

`approverIds` and `expiresAt` are optional. With no approvers, the owner is the only approver. The response returns `{ "approval": { "_id": "…", "mid": "…", "state": "pending" } }`. The FR-050 counter applies.

### `GET agents.approvals.info?approvalId=` (FR-034)

Returns the approval of the calling agent. Another agent gets `404`.

## Route coverage for the guard

The guard denies every agent request that does not come from the MCP dispatch. It then denies every route that is not in the agent tool table ([mcp-tools.md](mcp-tools.md)). The `agents.*` human endpoints are not in the table, so an agent cannot call them.

## Amendment A-3: webhook URL

**Status**: Proposed ([plan.md, A-3](../plan.md#a-3-2026-11-19-outgoing-webhook-delivery)). The outbound request: [agent-webhook.md](agent-webhook.md).

- `POST agents.register` takes an optional `webhookUrl`. With it, the response adds `"webhook": { "url": "…", "secret": "<shown once>" }`.
- `POST agents.update` takes `webhookUrl`: a URL sets or changes it, and `null` clears it. A new URL keeps the secret. A first URL creates a secret, and the response returns it once.
- `POST agents.credential.rotate` also rotates the webhook secret when the agent has a URL. The response adds `"webhook": { "secret": "<shown once>" }`.
- `GET agents.info` and `GET agents.me` return `webhookUrl`, never the secret.

New errors:

| Code | When |
|------|------|
| `error-agent-webhook-url-refused` | The URL is not `https` and its host is not on `SSRF_Allowlist`, or the SSRF check refuses it. |
| `error-agent-webhook-needs-messages` | The agent has a URL and its capabilities lack `get_agents_messages`. |
