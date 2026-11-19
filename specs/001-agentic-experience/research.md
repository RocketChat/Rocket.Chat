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
- The MCP loopback call carries the caller's credential and no other marker (`apps/meteor/ee/server/api/mcp/dispatch.ts`). The REST middleware cannot tell it from a direct call by the credential.
- The MCP route requires the `access-mcp` permission, the AI license module, and the `MCP_Enabled` setting (`apps/meteor/ee/server/api/mcp/index.ts:209-229`).
- The DDP `Server` runs a synchronous `CallCheck(session, type, name)` before every method and every subscription (`packages/ddp-server/src/Server.ts:28`). The monolith passes the DDP rate limit there (`apps/meteor/server/lib/realtime/ddpServer.ts`). ddp-streamer passes no check (`ee/apps/ddp-streamer/src/service.ts:37`).
- The room streams check `Authorization.canAccessRoom` on read, and `__my_messages__` checks it on each emit (`packages/streamer/src/notifications.module.ts:141-164,199-223`). The monolith and ddp-streamer share this module.
- The REST `login` route runs Meteor's `login` with a generated connection, not a DDP session (`apps/meteor/server/api/ApiClass.ts:993-1003`). `Accounts.validateLoginAttempt` runs for both.
- ddp-streamer logs a session in through the account service. That service accepts any resume token and does not run `validateLoginAttempt` (`ee/apps/account-service/src/lib/loginViaResume.ts`).
- The `user.forceLogout` event closes the sessions of a user on every instance and in ddp-streamer (`apps/meteor/server/services/realtime/service.ts:17`, `ee/apps/ddp-streamer/src/DDPStreamer.ts:53`).

## D-1: Agent identity

- **Decision**: An agent is an `IUser` with `type: 'agent'`, the protected role `agent`, and an `agent` subdocument for the owner, description, reply mode, capabilities, room allow list, and status. See [data-model.md](data-model.md).
- **Rationale**: DC-1 asks to reuse the user model. The user type is already system-only, so FR-004 needs only a guard on the role assignment. Messages, mentions, avatars, and the user administration work with no change.
- **Alternatives**: A separate `Agents` collection that points at a bot user. Rejected: two records per agent and a join on every call.

## D-2: Agent credential

- **Decision**: The credential is a personal access token on the agent user, issued by the server at registration. Rotation removes every login token of the agent and adds a new one. Revocation removes every login token.
- **Rationale**: The MCP server already accepts a PAT through `X-User-Id` and `X-Auth-Token`, and it already refuses a session token on POST (`ee/server/api/mcp/index.ts:~92-104`). FR-037 needs no new auth method. One token per agent meets FR-052.
- **Alternatives**: An OAuth token as the agent credential. Rejected: OAuth tokens resolve to the approving human and carry no scope (`docs/features/oauth2-server.md`). RP-2 uses an OAuth token only to authorize the registration (D-8).

## D-3: Effective scope enforcement (FR-015 to FR-017, FR-038, FR-039, FR-043)

- **Decision**: One agent guard runs in the REST auth middleware for every request by an agent. The guard maps the route to an entry of the agent tool table. It denies the call when:
  - the request is not an MCP loopback call (D-15),
  - the route has no entry in the table,
  - the tool is not in the declared capabilities,
  - the agent role or the owner lacks a permission that the entry lists,
  - the room that the call targets is not on the room allow list and is not a direct message of the agent,
  - the agent is suspended.
- The guard returns an error that names the tool or the room, and it writes an `agent.call.denied` audit event.
- MCP tool calls pass through the guard, because every tool is a loopback REST call. `tools/list` applies the same table, so an agent sees only its effective scope.
- A pre-check in `canAccessRoom` backs the guard up: an agent reaches a room only when the room is on its allow list or is a direct message that the agent is a member of.
- **Rationale**: One rule serves REST and MCP the same way (FR-039). The guard reads the scope on each call, so a change applies on the next call (FR-016). A route outside the table is denied by default, so FR-043 holds by construction.
- **Alternatives**: A filter only in the MCP server. Rejected: the tool runs as a REST call, and the REST side needs the agent lookup for D-15 anyway. One guard there covers both.

## D-4: Agent tool table

- **Decision**: A static table in `packages/authorization/src/agents/agentTools.ts` lists each tool that an agent may declare. Each entry holds the MCP tool name, the REST method and path, the permissions it needs, the argument that names its room (`roomId`, `rid`, `msgId`, `tmid`, or none), and whether it posts a message. The tool list is in [contracts/mcp-tools.md](contracts/mcp-tools.md).
- The table leaves out the tools that manage users, ban or mute, change room settings, archive rooms, invite members, edit teams, and resolve a room by name.
- **Rationale**: A declared capability is an MCP tool (FR-008). The table gives the guard the permission and room data that the catalog lacks. The table and the scope computation live in `packages/authorization`, because the DDP stream checks in ddp-streamer need them too (D-16).

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
| RP-2 OAuth consent | Ships | The MCP server already accepts an OAuth Bearer token, and the loopback passes it to `agents.register`. The consenting human is the caller, so FR-009 and FR-013 hold with no change. Small size. |
| RP-3 Registration token | Deferred (SH-005) | A new model and two endpoints. It solves the headless case, which RP-1 covers with a one-time call by the developer. |
| RP-4 Pending self-registration | Out of scope this iteration (SH-005) | It needs a public, unauthenticated endpoint with abuse limits. |
| RP-5 Admin form | Out of scope this iteration (SH-005) | An admin holds `register-agents` and can use RP-1 or RP-7. A form conflicts with the "no manual setup" goal. |
| RP-6 Apps Engine | Deferred (SH-005) | The users bridge creates `bot` and `app` users but has no credential flow. |

RP-2 flow:

1. The MCP client registers through `POST /oauth/register` (dynamic client registration), or uses an OAuth app that an admin creates.
2. A human signs in and approves the client on the existing consent page. The client exchanges the code for an access token.
3. The client calls `post_agents_register` with `Authorization: Bearer <token>`. The human is the caller and the owner.
4. After it creates the agent, `agents.register` deletes every access token and refresh token of that client for that human (FR-056). The token has no scope, so the client would otherwise keep full access as the human next to the agent PAT. A refused registration keeps the token, so the client can retry.

The consent page names the client and warns of full access. It does not list the capabilities (SH-005).

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

- **Answer**: Two ways ship.
  - The harness polls `get_agents_messages` with a cursor. A poll every 2 s meets FR-049 with a 3 s margin. The response carries messages and approval decisions, filtered by the reply mode.
  - The harness subscribes over DDP (D-16). It gets each message and each edit in its allowed rooms and direct messages as it happens, with no reply-mode filter. An approval decision reaches it as an edit of the card message.
- FR-054 requires the DDP path, so it adds no work beyond D-16. The poll stays the resync after a broken socket, because DDP has no replay.
- The response may repeat a message near the cursor. The harness removes repeats by `_id`. The server reads from `cursor − 2 s` so that a message with a late `ts` is not lost.
- Load: 10 agents that poll every 2 s make 5 indexed reads per second.
- **Alternatives**:
  - MCP notifications. They need a server-initiated SSE stream, which the transport does not offer. A-1 sizes a long poll instead.
  - Webhooks. They need an outbound HTTP client, retries, and URL validation.
  - A pub/sub channel. It needs a new transport.
- These go to the next iteration (SH-006). A harness that speaks only MCP still polls.

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
  - The OAuth path (RP-2) has no token scope. The registration revokes the OAuth token instead (D-8).

## D-11: Owner loss

- **Decision**: When the owner account no longer exists, the agent stays active. Its effective scope shrinks to `agents.me` until an admin sets a new owner.
- **Rationale**: DC-2 forbids a scope beyond the owner's permissions. With no owner, no permission is proven.

## D-12: Suspension (FR-046, FR-047)

- **Decision**: Suspension sets `agent.status: 'suspended'`. The guard rejects every call by a suspended agent. Suspension does not use `active: false`.
- **Rationale**: `setUserActiveStatus` removes the login tokens of an inactive user (`apps/meteor/server/lib/users/setUserActiveStatus.ts:118-123`). Reactivation must restore the same credential (US6, Independent Test).

## D-13: Agent login (FR-019, FR-054)

- **Decision**: One rule, `canAgentLogIn`, decides every agent login. It accepts a login only when all of these hold:
  - the login type is `resume`, with the agent PAT,
  - the connection is a DDP session,
  - the agent is active and not suspended,
  - the MCP server is enabled and licensed (D-18).
- The monolith runs the rule in `Accounts.validateLoginAttempt`, next to the `app` check (`apps/meteor/server/lib/auth/startup.js:391-395`). It tells a DDP session from the REST `login` route by the connection id, which only a DDP session holds in `server/lib/realtime/sessions.ts`.
- The account service runs the same rule in `loginViaResume` for ddp-streamer.
- **Effect**: The login screen and the REST `login` route refuse an agent, so no session token is ever issued to an agent. A DDP session logs in with the PAT and gets the limits in D-16.
- **Side effects of a DDP login (V-6)**:
  - The PAT never expires. Only rotation or revocation ends it (D-2).
  - In the monolith, each login updates `lastLogin` and records a session for the active-user count (SAU).
  - In both deployments, the login sets the agent presence to online.
  - In the monolith, the login result carries an invalid date as `tokenExpires`.
  - The agent counts in the active-user metrics while its harness holds a socket. The plan accepts this.
- **Alternatives**: Refuse every agent login, as before. Rejected: FR-054 requires DDP subscriptions.

## D-15: MCP server as the only entry point (FR-053)

- **Decision**: The MCP dispatch marks each loopback call with the header `X-RC-MCP-Dispatch`. Its value is a random secret that each process creates at start and keeps in memory. The agent guard accepts an agent request only when the header matches, with a constant-time compare.
- The `/api/v1/mcp` route itself is exempt. Its own checks apply there.
- Any other agent request gets `error-agent-mcp-only` (403), with `details.entryPoint` set to the MCP route. The guard writes the throttled audit entry (D-17).
- **Rationale**: The loopback goes to `127.0.0.1` on the port of the same process, so the secret never leaves the process. An outside client cannot forge it.
- **Alternatives**:
  - A check that the remote address is `127.0.0.1`. Rejected: a reverse proxy on the same host makes every request local.
  - An in-process Hono dispatch with a context flag. Rejected for this iteration: it changes the dispatch path for humans too (DC-2). The `dispatch.ts` comment already names it as a future step.
  - A signed token per call. Rejected: the same process signs and checks, so a shared secret gives the same proof with less code.
- **Verify**: V-5 below.

## D-16: Agent DDP subscriptions (FR-054)

- **Decision**:
  - The DDP `Session` gains a generic `userType`, which the login method sets from the login result before it returns. The account methods of `@rocket.chat/ddp-server` set it in both deployments.
  - A shared call check, `checkAgentDdpCall(session, type, name)` in `packages/streamer`, refuses for a session with `userType === 'agent'`:
    - every method except `login`, with `error-agent-mcp-only`,
    - every subscription except `stream-room-messages` and `stream-notify-room`.
  - The monolith chains the check with the DDP rate limit. ddp-streamer passes it as its first call check.
  - In `NotificationsModule`, the read check of `stream-room-messages` and `stream-notify-room`, and the emit check of `__my_messages__`, call `Authorization.canAgentReadRoomEvents(room, user)` for an agent. That method returns `true` only when the room passes the room check, and the effective scope holds `get_agents_messages`.
  - Any change that can narrow the scope broadcasts `user.forceLogout` for the agent: an update, a suspension, a credential rotation or revocation, a deletion, an owner deletion, and an owner role change. A change to a permission in `AGENT_TOOLS` broadcasts it for every agent. The harness reconnects, and the new subscriptions pass the checks again.
- **Rationale**:
  - The read check of a stream runs once, at the subscription. A forced logout makes a narrower scope apply at once, without a check on each event.
  - `get_agents_messages` is the tool that reads the history of every allowed room. A per-room read tool would let the subscription read more than the tool.
  - The reply mode does not filter DDP events (FR-054). The harness applies the mention rule for messages of other agents (spec edge case).
- **Alternatives**:
  - An emit check on each event for every stream. Rejected: the cost runs on every message for every subscriber.
  - `stream-notify-user`. Left out: an agent learns of a new direct message through `__my_messages__`.
  - A check only in the monolith. Rejected: in microservices mode the sessions live in ddp-streamer.

## D-17: Audit of refused entry calls (FR-055)

- **Decision**: A refusal under D-15 or D-16 writes `agent.entry.refused` with the agent id, the entry point (`rest`, `ddp-method`, `ddp-subscription`), and the route, method, or stream name. Before it writes, the server claims a slot with one atomic update on the agent user, `Users.claimAgentRefusalAuditSlot(id, entryPoint, now)`. The update matches only when the last slot for that entry point is older than 60 s.
- ddp-streamer cannot write the audit trail itself. It broadcasts `agent.entry.refused`, and the monolith claims the slot and writes the entry.
- **Rationale**: The slot lives in MongoDB, so the cap holds across instances. A harness that retries in a loop costs one update per call and one entry per minute.
- **Alternatives**: An in-memory window per instance. Rejected: with N instances the trail would hold N entries per minute.

## D-18: MCP server disabled or unlicensed

- **Decision**:
  - The agent calls stop, because D-15 makes the MCP route their only way in, and that route checks the license and `MCP_Enabled`.
  - `agents.register` refuses with `error-agent-mcp-unavailable` (403) when the MCP server is off or unlicensed. A human could otherwise register over REST (RP-7).
  - `canAgentLogIn` refuses DDP logins in the same state (D-13).
  - When `MCP_Enabled` turns off or the license loses the AI module, the server broadcasts `user.forceLogout` for every agent.
  - The agent users, their messages, and their settings stay. Nothing is deleted.
- **Rationale**: The spec edge case says agents stop and come back with the MCP server, with their data intact.

## Checks for the first tasks

These checks confirm an assumption of D-13 to D-16. Each one is a task with a test, ahead of the step that relies on it.

- **V-5**: The loopback reaches the same process in every supported deployment, including a process manager that shares one port across workers. If not, the secret moves to a shared store with a short life.
- **V-6**: Confirmed by code reading on 2026-11-19. No test proves it yet. Meteor's `resume` login accepts a PAT over DDP, and the account service accepts it too.
  - Meteor finds the token by `hashedToken` only, and it does not check the token type. A PAT has no `when` field, so no expiry applies. The expiry job and the token limit skip PATs too (`packages/models/src/models/Users.ts:1032,1595-1620`). A resume login adds no login token.
  - The two-factor check skips `resume` logins (`apps/meteor/server/lib/2fa/loginHandler.ts:19-21`). The email check runs for `password` logins only (`apps/meteor/server/lib/auth/startup.js:409`).
  - `loginViaResume` checks expiry only for a token with `when` (`ee/apps/account-service/src/lib/loginViaResume.ts:27`). It runs none of the Meteor validators, so `canAgentLogIn` must run there (D-13).
  - The REST `login` route accepts a PAT as `resume` today. D-13 must refuse it for an agent.
  - Proof: an API test logs in with a PAT as `resume` over REST and over DDP, subscribes to a stream, and logs in again with `Accounts_LoginExpiration` set to 1 day. A unit test covers `loginViaResume` with a token that has no `when`.
- **V-7**: A forced logout ends the stream subscriptions of the session at once, in the monolith and in ddp-streamer.

## D-14: Role assignment guard (FR-004)

- **Decision**: The role assignment path rejects the `agent` role for a user whose type is not `agent`. It also rejects the removal of the `agent` role from an agent.
- **Rationale**: `users.create` and `users.update` accept a `roles` array, so the role is the only way a human account could look like an agent.

## Amendments

An amendment adds a decision after the plan. It does not change the entries above unless it says so.

### A-1 (2026-11-19): Long-poll delivery over MCP

**Status**: Proposed. It revisits RQ-1 and sizes the upgrade path of SH-006. F-5 still ships the poll. The revision of 2026-11-19 replaces the doorbell over `subscriptions/listen` with a long poll on `agents.messages`.

#### Findings

- Every saved or updated message reaches `Message.afterSave`. That method broadcasts `watch.messages` (`apps/meteor/server/services/messages/service.ts:286-292`, `apps/meteor/server/lib/notifyListener.ts:496-502`). An edit of the approval card takes the same path, and so does a reaction.
- The broadcast reaches every instance in a multi-instance monolith with the `scalability` module, and every node in microservices mode ([docs/service-brokers.md](../../docs/service-brokers.md#events-across-instances)). A wait on any instance hears every message, so the load balancer needs no sticky routing. Without the module, the instances of a multi-instance monolith do not see each other's events.
- The broadcast is at most once, with no replay.
- The broadcast runs after the URL preview parse. A message with a link reaches a listener later, the same as it reaches a web client.
- The MCP endpoint answers every request with `application/json` (`apps/meteor/ee/server/api/mcp/index.ts:219`). It sends no SSE response, so no byte flows while a call waits.
- The MCP dispatch aborts a loopback REST call after 20 s (`apps/meteor/ee/server/api/mcp/dispatch.ts:14`). A wait must end before that limit.
- The HTTP server closes a socket after 5 s idle. During a request, Meteor's request callback raises the socket timeout to 120 s and restores 5 s on finish (`apps/meteor/server/lib/http/httpServer.ts:36-41`). With `HTTP_SOCKET_TIMEOUT_MS` set, the timeout is that value for the whole socket.
- MCP revision 2026-07-28 removes sessions, the GET stream, `resources/subscribe`, and `Last-Event-ID`. It adds `subscriptions/listen`, whose notifications carry only a resource URI ([changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog), [subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)). A harness that hears that doorbell must still call a read.
- The Events extension (SEP-3415) carries content with cursors and replay. Client support is new, and the team judges it not stable enough to build on.
- A chat host does not start a model turn on its own. A low-latency path helps a harness that drives its MCP client in code.

#### Decision (proposed)

- **Long poll**: `agents.messages` gains a `wait` parameter, from 0 to 15 s. With `wait` above 0 and nothing to return, the route holds the request until a matching event arrives or the wait ends. It then returns the same body as a plain poll. `get_agents_messages` passes `wait` through, so the tool needs no custom handler.
- **Order**: The route registers with the hub first, then reads from the cursor. A non-empty read returns at once. Otherwise the route waits for a ring and reads again. An event between two calls therefore is never lost.
- **Hub**: A local service `AgentEvents` runs on each instance. It listens to `watch.messages` and to the F-7 `agent.approval.decided` event. It indexes room id to the waiting calls, for agents with a waiting call only. Several events in 250 ms merge into one ring.
- **Room set**: The route passes the allowed rooms that `agents.messages` already reads. A room added during a wait counts from the next call.
- **Match**: The hub uses the D-10 reply-mode filter. A refactor moves that filter into a pure predicate that `agents.messages` and the hub share. The predicate drops a message the cursor already passed, so an edit or a reaction on an old message does not end a wait.
- **Transport**: Every MCP revision the server supports, with no change to the transport. Revision 2026-07-28 is not needed.
- **Poll stays**: `wait=0`, the default, keeps the F-5 behavior. The RQ-1 cursor does not change.

#### Rationale

- The response carries the content. A doorbell would cost the harness the same read call, plus a stream to keep open.
- The hub carries no message content. The route reloads the agent and its allowed rooms before the final read, so a scope change or a revocation during the wait leaks nothing (FR-016).
- The read runs from the cursor. At-most-once broadcast therefore loses no message, and the hub needs no replay.
- The route holds a plain request. It needs no SSE, no stream lifecycle, and no MCP revision support.

#### Limits and safeguards

- An agent may hold one waiting call per instance. A second call ends the first with an empty result.
- The 15 s cap stays under the 20 s dispatch timeout and the 120 s request socket timeout. A deployment that sets `HTTP_SOCKET_TIMEOUT_MS` below 16 s must lower the cap to match.
- Each call counts against the MCP rate limiter and the guard's call cap. An idle agent makes 4 calls a minute, against 30 at a 2 s poll.
- Server shutdown ends every wait with an empty result.
- Cost per message: one map lookup per instance. Cost per waiting agent: one held request.
- A multi-instance monolith without the `scalability` module hears only local events. The wait then returns at its cap for messages saved on another instance. The latency floor becomes 15 s, and no message is lost.

#### Alternatives

- **A doorbell over `subscriptions/listen`** (the first A-1 proposal): Rejected. The harness still calls the read, so the doorbell saves no call. It needs revision 2026-07-28 support (R-2), harness SDKs on that revision, an SSE stream with keep-alive and closure, and 11 to 16 engineer-days.
- **The Events extension (SEP-3415)**: Rejected for now. It carries content with replay, but client support is not stable. Revisit when the harness SDKs support it.
- **The older revisions, with sessions**: Rejected. They need a session store across instances, and revision 2026-07-28 removes them.
- **A REST SSE endpoint, `GET agents.events`**: Rejected. FR-053 refuses an agent credential on REST.
- **DDP subscriptions**: They ship in this iteration (D-16). A-1 serves a harness that speaks only MCP.
- **Webhooks**: Unchanged from RQ-1.

#### Effort

Engineer-days for one engineer who knows the code.

| Step | Work | Days |
|------|------|------|
| R-3 | Extract the D-10 filter into a pure predicate. | 0.5 |
| F-9 | The `AgentEvents` hub, the merge window, and the `agent.approval.decided` event. | 1.5 to 2 |
| F-9 | The `wait` parameter on `agents.messages`: the register-then-read order, the reload before the final read, the per-instance cap, and shutdown. | 1 to 1.5 |
| F-9 | Unit tests for the hub, API tests for the wait, and a manual multi-instance run. | 1.5 to 2 |
| F-9 | The subsystem doc and the MCP doc. | 0.5 |
| | **Total** | **5 to 6.5** |

#### To verify before the build

- **V-1**: A request held 15 s survives the socket timeouts, with and without `HTTP_SOCKET_TIMEOUT_MS`, behind the CI proxy as well.
- **V-2**: The loopback dispatch passes a client abort to the REST route, so a closed MCP call releases its wait.
- **V-3**: The MCP SDKs that harnesses use (TypeScript, Python) allow a tool call of 15 s under their default request timeout.
