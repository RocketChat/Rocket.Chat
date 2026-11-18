# Research: Agent Identity and Access

Phase 0 output for [plan.md](plan.md). Each entry gives the decision, the rationale, and the alternatives. Code references are relative to the repository root.

## Findings that shape every decision

- `IUser.type` is a free `string` (`packages/core-typings/src/IUser.ts:203`). The REST API and the user methods cannot set it (`apps/meteor/server/lib/users/saveUser/saveUser.ts`). Only server code sets `bot`, `app`, and `visitor`.
- The MCP server has no per-caller filter. `listTools()` returns one global list (`apps/meteor/ee/server/api/mcp/server.ts`). Every tool is a loopback call to a REST route with the caller's credential (`dispatch.ts`).
- The MCP server cannot push. `GET /api/v1/mcp` returns `405`, and `initialize` advertises no subscriptions.
- REST auth accepts any login token of the user, with no scope (`apps/meteor/server/api/ApiClass.ts:890-905`, `apps/meteor/server/api/v1/middlewares/authentication.ts:28`).
- `canAccessRoom` runs an OR chain of validators (`packages/authorization/src/canAccessRoom.ts:132-136`). A deny rule must run before the chain.
- `executeSendMessage` resolves a reply to a thread message onto the thread root, and it takes the room from the parent message (`apps/meteor/server/meteor-methods/messages/sendMessage.ts:72-80`).
- REST rate limits are keyed by IP and route, not by user (`ApiClass.ts:~540`). `chat.postMessage` gets the default of 10 calls per 60 s.
- The audit trail is `ServerEvents.createAuditServerEvent(key, data, actor)` with typed keys (`packages/models/src/models/ServerEvents.ts:83`, `packages/core-typings/src/IServerEvent.ts`).
- Core UiKit apps handle block actions on the server (`apps/meteor/server/modules/core-apps/videoconf.module.ts`).

## D-1: Agent identity

- **Decision**: An agent is an `IUser` with `type: 'agent'`, the protected role `agent`, and an `agent` subdocument for the owner, description, reply mode, capabilities, room allow list, and status. See [data-model.md](data-model.md).
- **Rationale**: DC-1 asks to reuse the user model. The user type is already system-only, so FR-004 needs only a guard on the role assignment. Messages, mentions, avatars, and the user administration work with no change.
- **Alternatives**: A separate `Agents` collection that points at a bot user. Rejected: two records per agent and a join on every call.

## D-2: Agent credential

- **Decision**: The credential is a personal access token on the agent user, issued by the server at registration. Rotation removes every login token of the agent and adds a new one. Revocation removes every login token.
- **Rationale**: The MCP server already accepts a PAT through `X-User-Id` and `X-Auth-Token`, and it already refuses a session token on POST (`ee/server/api/mcp/index.ts:~92-104`). FR-037 needs no new auth method. One token per agent meets FR-052.
- **Alternatives**: An OAuth token. Rejected for this iteration: OAuth tokens resolve to the approving human and carry no scope (`docs/features/oauth2-server.md`).

## D-3: Effective scope enforcement (FR-015 to FR-017, FR-038, FR-039, FR-043)

- **Decision**: One agent guard runs in the REST auth middleware for every request by an agent. The guard maps the route to an entry of the agent tool table. It denies the call when:
  - the route has no entry in the table,
  - the tool is not in the declared capabilities,
  - the agent role or the owner lacks a permission that the entry lists,
  - the room that the call targets is not on the room allow list and is not a direct message of the agent,
  - the agent is suspended.
- The guard returns an error that names the tool or the room, and it writes an `agent.call.denied` audit event.
- MCP tool calls pass through the guard, because every tool is a loopback REST call. `tools/list` applies the same table, so an agent sees only its effective scope.
- A pre-check in `canAccessRoom` backs the guard up: an agent reaches a room only when the room is on its allow list or is a direct message that the agent is a member of.
- **Rationale**: One rule serves REST and MCP the same way (FR-039). The guard reads the scope on each call, so a change applies on the next call (FR-016). A route outside the table is denied by default, so FR-043 holds by construction.
- **Alternatives**: A filter only in the MCP server. Rejected: the agent credential also works on REST, so a direct REST call would skip the filter.

## D-4: Agent tool table

- **Decision**: A static table in `apps/meteor/server/lib/agents/agentTools.ts` lists each tool that an agent may declare. Each entry holds the MCP tool name, the REST method and path, the permissions it needs, the argument that names its room (`roomId`, `rid`, `msgId`, `tmid`, or none), and whether it posts a message. The tool list is in [contracts/mcp-tools.md](contracts/mcp-tools.md).
- The table leaves out the tools that manage users, ban or mute, change room settings, archive rooms, invite members, edit teams, and resolve a room by name.
- **Rationale**: A declared capability is an MCP tool (FR-008). The table gives the guard the permission and room data that the catalog lacks.

## D-5: Room allow list and membership (FR-020 to FR-022)

- **Decision**: `agents.update` writes `agent.allowedRoomIds`. It calls `addUserToRoom` for each added room and `removeUserFromRoom` for each removed room. Room deletion removes the room from every allow list.
- **Rationale**: The agent subscriptions then match the allow list, so `chat.search` and the subscription tools stay inside the list without a filter.

## D-6: Reply placement (FR-026 to FR-028)

- **Decision**: An agent posts through two endpoints only:
  - `agents.reply` takes a message id. It posts into the thread of that message, or into the conversation in a direct message, or into the main timeline when threads are disabled.
  - `agents.post` takes a room id. It accepts only agents in autonomous mode.
- The generic post tools (`chat.postMessage`, `chat.sendMessage`) are not in the agent tool table.
- **Rationale**: The server picks the place, so SC-007 holds no matter what the harness sends. `executeSendMessage` already resolves a thread message onto its root.

## D-7: Agent badge (FR-001 to FR-006)

- **Decision**:
  - The agent endpoints set `agent: true` on every message they post. The message header renders an agent badge from that field, next to the existing roles, with an accessible label.
  - Member lists, the mention autocomplete, the user info panel, and the user administration read `type === 'agent'` from the user record.
  - Notifications prefix the sender with the translated "Agent" label.
- **Rationale**: The bot tag reads `message.bot` (`apps/meteor/client/components/message/header/MessageHeaderRoles.tsx:20`). A parallel field keeps the bot tag as is (FR-003) and needs no lookup per message.
- **Alternatives**: A client lookup of the sender type. Rejected: one query per message author.

## D-8: Registration paths

| Path | Decision | Reason |
|------|----------|--------|
| RP-1 MCP tool | Ships | The baseline. It loops back to `agents.register`. |
| RP-7 REST | Ships | It is the same `agents.register` endpoint, so it costs nothing extra. |
| RP-2 OAuth consent | Deferred (SH-005) | OAuth tokens resolve to the approving human and carry no scope. The consent must mint a new user and mark the client. Medium size. |
| RP-3 Registration token | Deferred (SH-005) | A new model and two endpoints. It solves the headless case, which RP-1 covers with a one-time call by the developer. |
| RP-4 Pending self-registration | Out of scope this iteration (SH-005) | It needs a public, unauthenticated endpoint with abuse limits. |
| RP-5 Admin form | Out of scope this iteration (SH-005) | An admin holds `register-agents` and can use RP-1 or RP-7. A form conflicts with the "no manual setup" goal. |
| RP-6 Apps Engine | Deferred (SH-005) | The users bridge creates `bot` and `app` users but has no credential flow. |

The RP-1 open question: a headless agent has no human session. The developer runs the registration once with their own PAT, and the harness stores the agent credential. The quickstart shows this.

## D-9: Approval card (FR-029 to FR-035)

- **Decision**:
  - `agents.approvals.create` stores an `AgentApproval` and posts a message with UiKit blocks from the core app `agent-approval-core`.
  - The core app `blockAction` checks that the clicker is an approver and a room member (FR-031). It then locks the card with one atomic model update that matches `state: 'pending'` and an unexpired `expiresAt` (FR-032), and it updates the message blocks.
  - A cron job marks expired cards every minute and updates their messages (FR-033).
  - Decisions reach the agent through `agents.messages` events and `agents.approvals.info` (FR-034).
- **Rationale**: Core UiKit apps already run block actions on the server (`videoconf.module.ts`). The atomic update makes the first decision win.

## D-10: Reply mode filter (FR-024, FR-025)

- **Decision**: `agents.messages` reads new messages in the allowed rooms and the agent direct messages with a new model method. The query uses the existing `{ rid, ts, _updatedAt }` index. The endpoint keeps:
  - every message in a direct message,
  - in mention mode, the messages that mention the agent,
  - in ambient and autonomous mode, every message,
  - a message from another agent only when it mentions this agent,
  - no message from the agent itself.

## RQ-1: How does a harness learn of events?

- **Answer**: The harness polls `agents.messages` with a cursor. A poll every 2 s meets FR-049 with a 3 s margin. The response carries messages and approval decisions.
- The response may repeat a message near the cursor. The harness removes repeats by `_id`. The server reads from `cursor − 2 s` so that a message with a late `ts` is not lost.
- Load: 10 agents that poll every 2 s make 5 indexed reads per second.
- **Alternatives**:
  - MCP notifications. They need a server-initiated SSE stream, which the transport does not offer.
  - Webhooks. They need an outbound HTTP client, retries, and URL validation.
  - A pub/sub channel. It needs a new transport.
- These go to the next iteration (SH-006).

## RQ-2: Can the platform detect one credential shared by two harness instances?

- **Answer**: Partly, at low cost. The guard can record the client IP and the `User-Agent` of each call. A switch between two values inside a short window flags a shared credential.
- Blocking needs a session concept. The MCP transport is stateless and issues no session id, so the platform cannot block a second instance today.
- The cost of detection is one small write per call. That write can be sampled.
- **Feeds**: SH-002. No change in this iteration.

## RQ-3: Do the inherited REST rate limits meet FR-050 and FR-051?

- **Answer**: No.
  - The REST limits are keyed by IP. Many agents behind one IP share one bucket.
  - `chat.postMessage` allows 10 calls per minute, which is below 60.
  - The MCP endpoint allows 60 requests per minute. A harness that polls and posts needs more.
- **Decision**:
  - The agent role holds `api-bypass-rate-limit`, so the IP limits do not apply to agents. `canBypassRateLimit` reads that permission (`apps/meteor/server/api/api.helpers.ts:42`).
  - The guard counts the posts of each agent in a fixed one-minute window on the user document, with an atomic model update. Post 61 fails with `error-agent-rate-limited` and a `retryAfter` value (FR-050). The counter lives in MongoDB, so it holds across instances.
  - The guard also caps all calls of each agent at 300 per minute, in memory per instance (SH-007). This guard protects FR-051.
  - A start-up burst gets no separate cap. The post limit already bounds it.
- **Verify**: The MCP endpoint limiter honors `api-bypass-rate-limit`. Its route registers through `API.v1.registerRateLimiterForRoute`, so it should. A task confirms it with a test.

## RQ-4: Is one agent role with per-tool capabilities enough?

- **Answer**: Yes, for this iteration.
  - A tool is the unit of read versus write, because each REST route is either a read or a write.
  - The room allow list is the per-room scope.
  - The owner's permissions cap the scope.
- Two gaps remain, with no spec change in this iteration:
  - The scope cannot differ per room, for example read-only in one room. That would need a capability list per allow-list entry.
  - The OAuth path (RP-2) would need token scopes. It is deferred.

## D-11: Owner loss

- **Decision**: When the owner account no longer exists, the agent stays active. Its effective scope shrinks to `agents.me` until an admin sets a new owner.
- **Rationale**: DC-2 forbids a scope beyond the owner's permissions. With no owner, no permission is proven.

## D-12: Suspension (FR-046, FR-047)

- **Decision**: Suspension sets `agent.status: 'suspended'`. The guard rejects every call by a suspended agent. Suspension does not use `active: false`.
- **Rationale**: `setUserActiveStatus` removes the login tokens of an inactive user (`apps/meteor/server/lib/users/setUserActiveStatus.ts:118-123`). Reactivation must restore the same credential (US6, Independent Test).

## D-13: Interactive login (FR-019)

- **Decision**: `Accounts.validateLoginAttempt` rejects `type === 'agent'`, the same way it rejects `app` (`apps/meteor/server/lib/auth/startup.js:391-395`).
- **Effect**: Agents cannot log in over DDP either, so the realtime API stays closed to them.

## D-14: Role assignment guard (FR-004)

- **Decision**: The role assignment path rejects the `agent` role for a user whose type is not `agent`. It also rejects the removal of the `agent` role from an agent.
- **Rationale**: `users.create` and `users.update` accept a `roles` array, so the role is the only way a human account could look like an agent.
