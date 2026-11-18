# Contract: REST endpoints `agents.*`

Every endpoint uses the validated `API.v1.get()` / `.post()` pattern, with request and response schemas in `packages/rest-typings/src/v1/agents.ts` (constitution VI). Every endpoint carries `authRequired: true`. The MCP catalog turns each one into a tool ([mcp-tools.md](mcp-tools.md)). Entities: [data-model.md](../data-model.md).

## Common errors

| Error | HTTP | When |
|-------|------|------|
| `error-agent-capability-not-allowed` | 403 | The tool is outside the effective scope. `details.tool` names it. |
| `error-agent-room-not-allowed` | 403 | The room is outside the allow list. `details.roomId` names it. |
| `error-agent-suspended` | 403 | The agent is suspended. |
| `error-agent-rate-limited` | 429 | Post 61 inside the window. `details.retryAfter` gives the seconds to wait. The `Retry-After` header carries the same value. |
| `error-not-an-agent` | 403 | A human calls an agent-only endpoint. |
| `error-agent-cannot-register` | 403 | An agent calls `agents.register`. |

The guard writes an `agent.call.denied` audit event for each of the first four errors.

## Human endpoints

### `POST agents.register` (FR-007 to FR-014)

Permission: `register-agents`. The caller must not be an agent.

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
  "agent": { "_id": "…", "username": "release-bot", "ownerId": "<caller>", "replyMode": "mention", "capabilities": ["…"], "allowedRoomIds": [], "status": "active" },
  "credential": { "userId": "…", "token": "<shown once>" }
}
```

Response `400` with `error-agent-capabilities-refused`. `details.refused` lists each refused capability with a reason: `unknown-tool`, `not-allowed-for-agents`, `owner-lacks-permission`.

The request has no owner field. The owner is always the caller (FR-009).

### `GET agents.info?agentId=` (FR-005)

Permission: none beyond `authRequired`. The response holds the info panel data. The caller must be allowed to see the user under the existing user rules.

```json
{ "agent": { "_id": "…", "username": "…", "name": "…", "description": "…", "owner": { "_id": "…", "username": "…", "name": "…" } , "capabilities": ["…"], "replyMode": "mention", "status": "active" } }
```

`owner` is `null` when the owner was deleted.

### `POST agents.update` (FR-020, FR-021, FR-024, FR-045)

Permission: `manage-agents`.

```json
{ "agentId": "…", "description": "…", "ownerId": "…", "replyMode": "ambient", "allowedRoomIds": ["GENERAL", "…"] }
```

Every field except `agentId` is optional. A change to `allowedRoomIds` adds the agent to each new room and removes it from each dropped room before the response returns. A direct message id is refused.

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
{ "msgId": "…", "text": "…" }
```

The server picks the place:

- In a direct message, the reply goes to the conversation.
- In a room with threads enabled, the reply goes to the thread of the message, or of its root.
- In a room with threads disabled, the reply goes to the main timeline.

The response returns the posted message. The FR-050 counter applies.

### `POST agents.post` (FR-028)

```json
{ "roomId": "…", "text": "…" }
```

Only an agent in autonomous mode may call it. Others get `error-agent-capability-not-allowed`. The FR-050 counter applies.

### `POST agents.approvals.create` (FR-029, FR-030)

```json
{ "roomId": "…", "request": "Deploy 7.4.1 to production?", "approverIds": ["…"], "expiresAt": "2026-11-18T22:00:00.000Z" }
```

`approverIds` and `expiresAt` are optional. With no approvers, the owner is the only approver. The response returns `{ "approval": { "_id": "…", "mid": "…", "state": "pending" } }`. The FR-050 counter applies.

### `GET agents.approvals.info?approvalId=` (FR-034)

Returns the approval of the calling agent. Another agent gets `404`.

## Route coverage for the guard

The guard denies every route that is not in the agent tool table ([mcp-tools.md](mcp-tools.md)). The `agents.*` human endpoints are not in the table, so an agent cannot call them.
