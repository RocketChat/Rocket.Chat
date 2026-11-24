# Data Model: Agent Identity and Access

Phase 1 output for [plan.md](plan.md). Decisions: [research.md](research.md).

Every read and write goes through a named model method (constitution II). The method names below are the ones the tasks add to `I<Name>Model` in `packages/model-typings`.

## Agent (`IAgent`, an `IUser` with `type: 'agent'`)

`IAgent` in `packages/core-typings` extends `IUser`. It narrows `type` to `'agent'` and adds the required `agent` field. `IUser` gets no agent field.

The agent reuses the `users` collection. The existing fields `_id`, `username`, `name`, `avatarETag`, `roles`, `active`, `createdAt`, and `services.resume.loginTokens` keep their meaning.

| Field | Type | Rules |
|-------|------|-------|
| `type` | `'agent'` | Only `AgentService.register` sets it. No REST or method input can set it (FR-004, FR-011). |
| `roles` | `string[]` | Always `['agent']`. The role guard blocks any change (D-14). |
| `agent.ownerId` | `string \| null` | The human who authorized the registration (FR-009). Only an admin can change it (FR-045). `null` after the owner is deleted (D-11). |
| `agent.description` | `string` | 1 to 500 characters. |
| `agent.replyMode` | `'mention' \| 'ambient' \| 'autonomous'` | Required (FR-024). |
| `agent.capabilities` | `string[]` | MCP tool names from the agent tool table. Fixed at registration (FR-008, FR-014). |
| `agent.status` | `'active' \| 'suspended'` | Default `active` (FR-046). |
| `agent.postWindow` | `{ start: Date; count: number }` | The FR-050 counter (RQ-3). Internal. No endpoint returns it. |
| `agent.refusalAuditAt` | `{ rest?: Date; 'ddp-method'?: Date; 'ddp-subscription'?: Date }` | The last audited refusal per entry point (FR-055, D-17). Internal. No endpoint returns it. |

### State transitions

```text
register ──▶ active ──suspend──▶ suspended
               ▲                     │
               └──────reactivate─────┘
active | suspended ──delete──▶ (removed; messages stay)
```

Credential state, independent of the agent status:

```text
issued ──rotate──▶ issued (new secret; old secret fails)
issued ──revoke──▶ none ──rotate──▶ issued
```

### Agents model methods (new)

The `Agents` model (`AgentsRaw extends UsersRaw`, interface `IAgentsModel extends IUsersModel`) reads and writes the `users` collection. Every agent method lives on `Agents`, not on `Users`, so the generic user surface gains no agent method. Each `Agents` method matches `type: 'agent'`.

| Method | Purpose |
|--------|---------|
| `insertAgent(doc)` | Creates the agent user. It writes `type` and `roles` itself, and never calls `Accounts.insertUserDoc` or `saveUser`. Those paths force `type: 'user'`, add the default roles, and join the default channels. |
| `findOneAgentById(id, options)` | Reads an agent by id. It matches `type: 'agent'` only. |
| `findAgentsByOwnerId(ownerId, options)` | Lists the agents of an owner. |
| `updateAgentSettings(id, { description?, ownerId?, replyMode? })` | Applies an admin edit. |
| `setAgentStatus(id, status)` | Suspends or reactivates. |
| `unsetAgentOwnerByOwnerId(ownerId)` | Runs on owner deletion (D-11). |
| `replaceAgentCredential(id, hashedToken)` | Removes every login token and adds one PAT (rotation). The PAT `createdAt` is the credential issue date. |
| `incrementAgentPostCount(id, windowStart)` | Counts a post inside the window atomically, and returns the new count. It resets the count when the window changes. |
| `claimAgentRefusalAuditSlot(id, entryPoint, now)` | Sets `agent.refusalAuditAt.<entryPoint>` to `now` only when it is unset or older than 60 s. It returns `true` when it wrote (D-17). |
| `findAgentIds(options)` | Lists every agent id, for the forced logout when the MCP server turns off (D-18). |

Revocation reuses `unsetLoginTokens(userId)`, inherited from `UsersRaw`.

## Room allow list (FR-061)

The agent has no allow list field. The allow list is the set of its subscriptions whose `status` is not `INVITED` (D-5). It is empty at registration (FR-010), because `Agents.insertAgent` joins no default channel (PQ-1).

| Read | Method |
|------|--------|
| The room check per call | `Subscriptions.findOneByRoomIdAndUserId(rid, agentId, { projection: { status: 1 } })` (existing) |
| The rooms for `agents.messages` and `agents.me` | `Subscriptions.findByUserId(agentId, { projection: { rid: 1, status: 1 } })` (existing). The endpoint drops the `INVITED` rows. |
| The agent members of a room at deletion (FR-064) | `Agents.findAgentIds()`, then `Subscriptions.findByRoomIdAndUserIds(rid, agentIds, { projection: { 'u._id': 1 } })` (existing). The read scales with the agent count, not the room size. |

Only an actor with `manage-agents` adds an agent to a room (FR-062, D-19). Any member remover may remove one (FR-063).

## Agent role and permissions

| Item | Kind | Default holders |
|------|------|-----------------|
| `agent` | Protected role, scope `Users` | Agents only |
| `register-agents` | Permission | `admin` |
| `manage-agents` | Permission | `admin` |
| `access-mcp` | Existing permission | Add `agent` |
| `view-joined-room`, `view-d-room` | Existing permissions | Add `agent` |
| `api-bypass-rate-limit` | Existing permission | Add `agent` (RQ-3) |

The agent role holds no other permission. In particular it does not hold `view-c-room`, `view-outside-room`, `view-room-administration`, `create-c`, `create-p`, `create-d`, or any user-management, ban, mute, archive, or room-settings permission (FR-043).

## Effective scope (computed per call, never stored)

```text
effectiveScope(agent) =
  agent.capabilities
  ∩ AGENT_TOOLS
  ∩ { tool | the agent role holds every permission in tool.permissions }
  ∩ { tool | agent.ownerId is set and the owner holds every permission in tool.permissions }
  ∪ { 'get_agents_me' }
```

Room check per call: the agent holds a subscription to the room whose `status` is not `INVITED` (FR-061). A direct message passes the same check.

The computation and `AGENT_TOOLS` live in `packages/authorization/src/agents/`, so the REST guard and the DDP stream checks in both deployments use one rule (D-16).

## Entry points (FR-053, FR-054)

| Entry point | Agent credential | Check |
|-------------|------------------|-------|
| `POST /api/v1/mcp` | Accepted | The MCP route checks, then the guard on each loopback call. |
| Any other REST route | Refused with `error-agent-mcp-only`, unless the request carries the dispatch secret | The guard (D-15). |
| REST `login`, the login screen | Refused | `canAgentLogIn` (D-13). |
| DDP `login` with `resume` | Accepted | `canAgentLogIn` (D-13). |
| DDP methods other than `login` | Refused with `error-agent-mcp-only` | `checkAgentDdpCall` (D-16). |
| DDP `stream-room-messages`, `stream-notify-room` | Accepted per room | `Authorization.canAgentReadRoomEvents` (D-16). |
| Other DDP subscriptions | Refused | `checkAgentDdpCall` (D-16). |

## DDP session field

| Field | Type | Rules |
|-------|------|-------|
| `Session.userType` | `string \| undefined` | In `@rocket.chat/ddp-server`. The login method sets it from the login result. It is not stored. |

## Agent tool table entry (`AGENT_TOOLS`, code constant)

| Field | Type | Meaning |
|-------|------|---------|
| `name` | `string` | The MCP tool name, the same as in the catalog. |
| `method`, `path` | `string` | The REST route that the tool calls. |
| `permissions` | `string[]` | The permissions that the agent role and the owner must both hold. |
| `roomArg` | `'roomId' \| 'rid' \| 'msgId' \| 'tmid' \| null` | The argument the guard resolves to a room. `msgId` and `tmid` resolve through `Messages.findOneById` with a projection of `rid`. |
| `posts` | `boolean` | The FR-050 counter applies. |

## AgentApproval (new collection `rocketchat_agent_approvals`)

| Field | Type | Rules |
|-------|------|-------|
| `_id` | `string` | |
| `agentId` | `string` | The agent that posted the card. |
| `rid` | `string` | It must pass the room check. |
| `mid` | `string` | The message that carries the card. |
| `request` | `string` | 1 to 2000 characters. |
| `approverIds` | `string[]` | Defaults to `[agent.ownerId]` (FR-030). It must not be empty. |
| `expiresAt` | `Date \| null` | Optional (FR-029). |
| `state` | `'pending' \| 'approved' \| 'rejected' \| 'expired'` | |
| `decidedBy` | `string \| null` | |
| `decidedAt` | `Date \| null` | |
| `_updatedAt` | `Date` | Feeds the `agents.messages` events. |

Indexes: `{ agentId: 1, _updatedAt: 1 }`, and `{ state: 1, expiresAt: 1 }` for the expiry sweep.

```text
pending ──approve──▶ approved
pending ──reject───▶ rejected
pending ──expiry───▶ expired
```

Every transition leaves `pending` through one atomic update that matches `state: 'pending'`. The first decision wins (FR-032).

### AgentApprovals model methods

| Method | Purpose |
|--------|---------|
| `insertOne` (base) | Creates the card. |
| `findOneById` (base) | Reads one card. |
| `decideIfPending(id, state, userId, now)` | Approves or rejects only a pending card whose expiry has not passed. It returns the updated document or `null`. |
| `findPendingExpiredBefore(now, options)` | Lists cards for the sweep. |
| `expireIfPending(id, now)` | Marks one card expired. |
| `findByAgentIdUpdatedAfter(agentId, since, options)` | Feeds the decision events of `agents.messages`. |

## Message fields

| Field | Type | Rules |
|-------|------|-------|
| `IMessage.agent` | `true \| undefined` | Only the agent endpoints set it (D-7). The badge reads it. |
| `IMessage.blocks` | `MessageSurfaceLayout \| undefined` | Existing field. On an agent message it holds only the allowed block and element types (FR-057, D-20). |

Allowed in an agent message (`AGENT_BLOCK_TYPES`, a code constant next to `validateAgentBlocks`): the blocks `section`, `context`, `divider`, `header`, `image`, and `markdown`, and the elements `plain_text`, `mrkdwn`, and `image`. A `section` accessory must be an `image`.

### Messages model methods (new)

| Method | Purpose |
|--------|---------|
| `findVisibleByRoomIdsAfterTimestamp(rids, ts, options)` | Feeds `agents.messages`. It uses the `{ rid: 1, ts: 1, _updatedAt: 1 }` index. |

The reply-mode filter (D-10) runs in the endpoint, not in the model.

## Audit events (`ServerEvents`, typed keys in `IServerEvents`)

| Key | Data | Actor |
|-----|------|-------|
| `agent.registered` | agent id, owner id, capabilities, reply mode | owner |
| `agent.updated` | agent id, changed fields with old and new values | admin |
| `agent.credential.rotated` | agent id | admin or owner |
| `agent.credential.revoked` | agent id | admin or owner |
| `agent.suspended`, `agent.reactivated` | agent id | admin or owner |
| `agent.deleted` | agent id | admin |
| `agent.call.denied` | agent id, route, tool, reason (`capability`, `room`, `suspended`, `rate`), room id | system |
| `agent.entry.refused` | agent id, entry point (`rest`, `ddp-method`, `ddp-subscription`), route, method, or stream name | system. At most one per agent per entry point per minute (FR-055). |
| `agent.approval.created` | approval id, agent id, room id | the agent |
| `agent.approval.decided` | approval id, decision | the approver |
| `agent.approval.expired` | approval id | system |
| `agent.room.added` | agent id, room id, path | the user who added the agent (FR-064) |
| `agent.room.removed` | agent id, room id, path (`kick`, `leave`, `agents.update`, `room-deleted`) | the user who removed the agent, or the user who deleted the room |
| `agent.room.add.refused` | agent id, room id, path, missing permission (`manage-agents`) | the user who tried, or system for a path with no actor |

## Candidate C-1: derived counters

**Status**: To evaluate. The current design (RQ-3, D-17) stays in force until a decision.

`agent.postWindow` and `agent.refusalAuditAt` write to the user document. Each write bumps `_updatedAt`, so every agent post reaches the clients' user sync. The candidate drops both fields, and their methods `incrementAgentPostCount` and `claimAgentRefusalAuditSlot`, and derives each value from data the server already writes.

| Value | Derived from | Index |
|-------|--------------|-------|
| Posts in the FR-050 window | Count the agent's messages with `ts` in the last 60 s. `retryAfter` comes from the oldest one. | New partial index `{ 'u._id': 1, ts: 1 }` where `agent: true`. It reads at most 60 keys per check. |
| The last refusal audit per entry point (FR-055) | The last `agent.entry.refused` event for the agent in `ServerEvents`. | Existing `{ t: 1, 'u.username': 1, ts: -1 }`. It requires the agent as the event actor instead of "system". |

Trade-offs:

- Neither check is atomic. Concurrent posts can exceed 60 by a few, and two instances can each write a refusal entry in the same minute.
- The post window slides instead of resetting each minute.
- The existing single-field indexes `{ ts: 1 }` and `{ 'u._id': 1 }` do not suffice. The first scans every workspace message from the last minute. The second scans the agent's whole history. A `hint` to `{ ts: 1 }` is the fallback if the new index is refused.

## Amendment A-3: webhook

**Status**: Proposed ([plan.md, A-3](plan.md#a-3-2026-11-19-outgoing-webhook-delivery)).

| Field | Type | Rules |
|-------|------|-------|
| `agent.webhook` | `{ url: string; secret: string } \| undefined` | Set at registration or by `agents.update`. The server needs the plain secret to sign, so it stores it as is. No endpoint returns the secret after its creation or rotation. Every read for an endpoint projects it out. |

| Method | Purpose |
|--------|---------|
| `setAgentWebhook(id, webhook)` | Sets or clears `agent.webhook`. |
| `setAgentWebhookSecret(id, secret)` | Replaces the secret at rotation. |
| `findActiveAgentIdsWithWebhook(options)` | Lists the agents with a webhook that are both `active: true` and `agent.status: 'active'`. The sender caches the result on each instance and refreshes it on each agent change. |

The sender then reads `Subscriptions.findByRoomIdAndUserIds(rid, agentIds)` (existing) to keep the agents that are members of the room (FR-061). Index: `{ type: 1 }` with a partial filter on `agent.webhook` existing. Most saved messages have no agent with a webhook, so the sender skips the read.

Audit: `agent.updated` records a webhook change with the old and new URL, never the secret.
