# Implementation Plan: Agent Identity and Access

**Branch**: `001-agentic-experience` | **Date**: 2026-11-18, revised 2026-11-19 for FR-053 to FR-055 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-agentic-experience/spec.md`

## Summary

An agent is a user with `type: 'agent'`, the protected role `agent`, and an `agent` subdocument for the owner, reply mode, capabilities, room allow list, and status.

- **Registration**: a human with `register-agents` calls `agents.register` over REST or as an MCP tool, with a PAT or with an OAuth token from the MCP authorization flow (RP-2). The server returns a PAT on the agent user once, and revokes the OAuth token (FR-056).
- **Entry points**: an agent calls the workspace through the MCP server only. The MCP dispatch marks its loopback REST calls with a per-process secret, and the guard refuses every other agent REST call (FR-053). DDP accepts the agent PAT for room event subscriptions only (FR-054). Each refusal is audited, at most once per agent per entry point per minute (FR-055).
- **Scope**: one agent guard in the REST auth middleware enforces the entry point, the effective scope, the room allow list, the suspension, and the post limit on every agent call. MCP tool calls are loopback REST calls, so the same guard covers them. The MCP tool list applies the same table. The DDP stream checks use the same scope rule from `packages/authorization`.
- **Delivery**: the agent polls `get_agents_messages` every 2 s, or subscribes to its room streams over DDP. It posts through `agents.reply`, which picks the thread or the conversation, and through `agents.post` in autonomous mode.
- **Badge**: a message field `agent: true` and the user type drive the badge in the web client.
- **Approval card**: a core UiKit app runs the approval card with an atomic first-decision lock.

Decisions and alternatives: [research.md](research.md). Shortcuts: [shortcuts.md](shortcuts.md).

## Technical Context

**Language/Version**: TypeScript on Node 22. Meteor server in `apps/meteor`.

**Primary Dependencies**: Hono API router (`API.v1`), the workspace MCP server (`apps/meteor/ee/server/api/mcp/`), `@rocket.chat/ddp-server`, `@rocket.chat/streamer`, the account service (`ee/apps/account-service`), `@rocket.chat/models`, `@rocket.chat/authorization`, UiKit core apps, React and Fuselage, `@rocket.chat/ui-contexts`, `@rocket.chat/cron`. No new runtime dependency.

**Storage**: MongoDB. The `users` collection gains the `agent` subdocument. A new collection `rocketchat_agent_approvals` holds approval cards. Messages gain the `agent` field.

**Testing**: Jest and Mocha unit tests next to the files they test, with `mockModel`. API tests in `apps/meteor/tests/end-to-end/api/`. Playwright E2E tests in `apps/meteor/tests/e2e/`.

**Target Platform**: Rocket.Chat server, single instance and multi-instance. Web client. Mobile and desktop clients wait (SH-001).

**Project Type**: Web service and web client in a monorepo.

**Performance Goals**:
- An agent learns of a message within 5 s (FR-049, SC-009). The DDP path delivers at the speed of a web client.
- An agent posts 60 messages per minute at most (FR-050).
- With 10 agents at the limit, human message delivery slows by 10% at most (SC-010).

**Constraints**:
- DC-1: take the fastest path, and reuse the user model, the roles, the PATs, the user administration, the UiKit surface, and the MCP catalog.
- DC-2: ship the scope requirements in full, and break no bot, PAT, integration, or human MCP use.
- The MCP server stays EE and license-gated. Agents depend on it: with the MCP server off or unlicensed, agents cannot register, call, or log in over DDP, and their data stays (D-18). The guard, the role, and the `agents.*` endpoints are core code.
- DDP rules hold in both deployments: the monolith's DDP server and ddp-streamer with the account service.

**Scale/Scope**: 10 concurrent agents per workspace for the SC-010 test. One credential per agent. 12 tools in the agent tool table.

All research questions are resolved in [research.md](research.md). No NEEDS CLARIFICATION remains. Three assumptions get a check in the first tasks (V-5 to V-7).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-research | Post-design | Evidence |
|-----------|--------------|-------------|----------|
| I. One concern per change | Pass | Pass | The delivery order below gives one pull request per concern. The enabling refactors R-1 and R-4 sit below the features. |
| II. Named model methods | Pass | Pass | Every new query is a named method on `Users`, `Messages`, or `AgentApprovals`, declared in `packages/model-typings` ([data-model.md](data-model.md)). The refusal audit slot is `Users.claimAgentRefusalAuditSlot`. The guard and the endpoints pass only `projection`, `sort`, and `limit`. |
| III. Tests prove the change | Pass | Pass | See [Testing](#testing). R-1 keeps the MCP tests green with no edits. R-4 keeps the `ddp-server` and ddp-streamer tests green with no edits. |
| IV. Views isolated | Pass | Pass | The admin agent section and the info panel reach the server through `useEndpoint` from `@rocket.chat/ui-contexts`. The badge is a presentational component with props only. The new screens compose layout containers. |
| V. Comments state intent | Pass with exception | Pass with exception | `shortcut:` comments state a limit (DC-3). See Complexity Tracking. The subsystem doc goes in `docs/features/agents.md`, and the identity decision goes in an ADR. The DDP rules for agents go in `docs/features/ddp-sessions.md`. |
| VI. Validated contracts | Pass | Pass | Every `agents.*` endpoint uses `API.v1.get()` or `.post()` with schemas in `packages/rest-typings` ([contracts/rest-agents.md](contracts/rest-agents.md)). New text uses keys in `en.i18n.json` only. |
| Workflow: changesets | Pass | Pass | Each feature pull request carries a changeset for `@rocket.chat/meteor` and for each published package it touches (`core-typings`, `model-typings`, `rest-typings`, `models`, `ui-client`, `ddp-server`, `streamer`, `authorization`). |
| Workflow: fixes and refactors listed | Pass | Pass | See [Delivery order](#delivery-order). No fix is needed. |

## Project Structure

### Documentation (this feature)

```text
specs/001-agentic-experience/
├── spec.md
├── plan.md               # This file
├── research.md           # Phase 0
├── data-model.md         # Phase 1
├── quickstart.md         # Phase 1
├── shortcuts.md          # Shortcut ledger (DC-3)
├── contracts/
│   ├── rest-agents.md    # agents.* REST endpoints
│   ├── mcp-tools.md      # MCP catalog evaluation, agent tool table, per-caller filter
│   └── ddp-agents.md     # agent DDP login, subscriptions, refusals
├── checklists/
└── tasks.md              # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/core-typings/src/
├── IUser.ts                              # IAgentSettings on IUser.agent
├── IMessage/IMessage.ts                  # IMessage.agent
├── IAgentApproval.ts                     # new
└── ServerAudit/IAuditAgentEvent.ts       # new; keys added to IServerEvents

packages/model-typings/src/models/
├── IUsersModel.ts                        # agent methods
├── IMessagesModel.ts                     # findVisibleByRoomIdsAfterTimestamp
└── IAgentApprovalsModel.ts               # new

packages/models/src/models/
├── Users.ts, Messages.ts                 # new methods
└── AgentApprovals.ts                     # new

packages/rest-typings/src/v1/agents.ts    # new: request and response schemas
packages/authorization/src/
├── canAccessRoom.ts                      # agent pre-check before the validator chain
└── agents/                               # new
    ├── agentTools.ts                     # AGENT_TOOLS table
    ├── effectiveScope.ts                 # scope computation
    └── canAgentReadRoomEvents.ts         # room check + get_agents_messages in scope

packages/ddp-server/src/
├── Session.ts                            # userType
└── methods/accounts.ts                   # sets userType from the login result

packages/streamer/src/
├── agentDdpPolicy.ts                     # new: checkAgentDdpCall
└── notifications.module.ts               # agent read and emit checks on the room streams

ee/apps/ddp-streamer/src/service.ts       # passes checkAgentDdpCall to Server
ee/apps/account-service/src/lib/loginViaResume.ts   # canAgentLogIn, user type in the result

apps/meteor/server/
├── lib/agents/                           # new
│   ├── agentGuard.ts                     # MCP-only, route → tool → scope, room, suspension, rate
│   ├── mcpDispatchSecret.ts              # per-process secret and its constant-time check
│   ├── canAgentLogIn.ts                  # login rule (D-13)
│   ├── auditAgentRefusal.ts              # slot claim and agent.entry.refused
│   ├── endAgentSessions.ts               # user.forceLogout on scope changes and MCP loss
│   ├── registerAgent.ts, updateAgent.ts, agentCredential.ts, agentLifetime.ts
│   ├── listAgentMessages.ts              # reply-mode filter
│   ├── postAgentReply.ts                 # thread or conversation placement
│   └── approvals/                        # create, decide, expire
├── api/v1/agents.ts                      # new: agents.* endpoints
├── api/v1/middlewares/authentication.ts  # calls agentGuard for agent users
├── lib/authorization/constant/permissions.ts, upsertPermissions.ts   # role and permissions
├── lib/auth/startup.js                   # canAgentLogIn in validateLoginAttempt
├── lib/realtime/ddpServer.ts             # chains checkAgentDdpCall with the DDP rate limit
├── lib/roles/                            # agent role guard
├── modules/core-apps/agentApproval.module.ts   # new UiKit core app
└── startup/cron.ts                        # registers the approval expiry sweep

apps/meteor/ee/server/api/mcp/
├── index.ts                              # pass the user type into McpAuth
├── server.ts                             # listTools(auth) for tools/list and tools/call
├── dispatch.ts                           # X-RC-MCP-Dispatch on each loopback call
└── catalog.ts                            # agents.* tools; agent filter

apps/meteor/lib/roles/getMostImportantRole.ts   # agent role order

apps/meteor/client/
├── components/message/header/            # AgentBadge next to MessageRoles
├── views/room/contextualBar/UserInfo/    # agent info section
├── views/room/contextualBar/RoomMembers/ # badge in the member list
├── views/room/composer/                  # badge in the mention popup
└── views/admin/users/                    # badge, status, and the agent settings section

packages/ui-client/src/components/UserInfo/   # agent fields in UserInfo
packages/i18n/src/locales/en.i18n.json        # Agent_* keys

apps/meteor/tests/end-to-end/api/agents.ts       # MCP scope suite, REST refusal
apps/meteor/tests/end-to-end/api/agents-ddp.ts   # DDP login, subscriptions, refusals
apps/meteor/tests/e2e/agents.spec.ts             # badge, allow list, approval card

docs/features/agents.md                   # new subsystem doc
docs/features/mcp-server.md               # agent callers, new tools, dispatch marker
docs/features/ddp-sessions.md             # agent sessions
docs/adr/NNNN-agent-user-type.md          # identity decision
```

**Structure Decision**: The feature extends the existing Meteor app and its shared packages. Server logic goes in `apps/meteor/server/lib/agents/` under [docs/backend-folder-structure.md](../../docs/backend-folder-structure.md). The scope rule goes in `packages/authorization`, and the DDP policy in `packages/streamer`, because ddp-streamer runs them too. The MCP changes stay in the EE MCP folder. No new app or package is created.

## Delivery order

Each step is one pull request with one concern (constitution I). The order puts the refactors first and keeps every scope check in place before any agent can exist (DC-2). The rows are in delivery order. R-4 and F-10 keep their ids from the 2026-11-19 revision, so A-1 keeps R-3 and F-9. The 2026-11-19 revision of A-1 retires R-2.

| Step | Kind | Title | Stories | Content |
|------|------|-------|---------|---------|
| R-1 | refactor | Pass the MCP caller to the tool listing | none | `McpAuth` carries the user type. `listTools(auth)` serves both `tools/list` and `tools/call`. Behavior for humans stays the same. The existing MCP tests stay green with no edits. |
| R-4 | refactor | Carry the user type on DDP sessions | none | `Session.userType` from the login result. The account service returns the user type. ddp-streamer passes a call check that allows every call. The existing `ddp-server` and ddp-streamer tests stay green with no edits. |
| F-1 | feat | Add the agent user type | US1, US2 | The `IUser.agent` type, the `agent` role, the `register-agents` and `manage-agents` permissions, the role order, the role guard (FR-004), the audit keys, and the ADR. `canAgentLogIn` refuses every agent login in this step, in the monolith and in the account service (FR-019). |
| F-2 | feat | Restrict agents to the MCP server and their effective scope | US2, US3 | The dispatch secret and the MCP-only check (FR-053), `AGENT_TOOLS` and `effectiveScope` in `packages/authorization`, `agentGuard` in the auth middleware, the `canAccessRoom` pre-check, the post counter, the call cap, the denial audit, the throttled refusal audit (FR-055), and the agent filter in the MCP tool list. The guard has no effect until an agent exists. |
| F-3 | feat | Register agents over REST and MCP | US2 | `agents.register`, `agents.info`, `agents.me`, and the catalog tools (RP-1, RP-2, RP-7). A registration with an OAuth token revokes the tokens of that client for the caller (FR-056). `agents.register` refuses while the MCP server is off or unlicensed (D-18). |
| F-4 | feat | Authorize agents in rooms | US3 | `agents.update`, membership sync, cleanup on room deletion, and the agent settings section in the user administration. |
| F-5 | feat | Deliver messages to agents and place their replies | US4 | `agents.messages`, `agents.reply`, `agents.post`, the Messages model method, and the catalog tools. |
| F-10 | feat | Let agents subscribe to room events over DDP | US2, US4 | `canAgentLogIn` accepts a DDP `resume` login. `checkAgentDdpCall` in both deployments, `canAgentReadRoomEvents` in the room streams, the forced logouts on scope changes and on MCP loss, the refusal audit relay from ddp-streamer, and the DDP doc (FR-054, FR-055, D-18). |
| F-6 | feat | Show the agent badge | US1 | The badge on messages, member lists, the mention popup, the info panel, the admin table, and notifications. |
| F-7 | feat | Add approval cards | US5 | The `AgentApprovals` model, `agents.approvals.*`, the core UiKit app, the expiry cron, and the decision events in `agents.messages`. |
| F-8 | feat | Manage the agent lifetime | US6 | Suspend, reactivate, rotate, revoke, delete, the owner tools in the catalog, and the admin actions. Each action that ends access also ends the agent DDP sessions through `endAgentSessions`. |

F-1 to F-6 and F-10 deliver the P1 stories. F-7 and F-8 deliver the P2 stories in this iteration. If time runs short, F-7 and F-8 move to the next iteration with ledger entries. The suspension check ships in F-2 regardless. F-10 cannot move: DC-2 lists FR-054 and FR-055.

F-1 refuses every agent login, and only F-10 opens the DDP login. Between the two, an agent has no DDP session, so no DDP call can skip the checks.

## Testing

| Area | Test | Proves |
|------|------|--------|
| Effective scope | Unit tests for `effectiveScope` and `agentGuard` with `mockModel`. Cases: undeclared tool, role lacks a permission, owner lacks a permission, deleted owner, room off the list, direct message, suspended agent, unmapped route. | FR-014 to FR-017, FR-022, FR-043, FR-047, D-11 |
| Scope over MCP | An API test that calls every route in the agent tool table and a sample of other routes over MCP, once in scope and once out of scope. | SC-003, FR-039 |
| MCP-only entry | Unit tests for the dispatch secret check: missing, wrong, and right header, and the MCP route exemption. An API test that calls every route in the agent tool table directly over REST and expects `error-agent-mcp-only`. A human PAT keeps working on REST. | FR-053, DC-2 |
| Refusal audit | A unit test for the slot claim with `mockModel`. An API test with five refusals in one minute and one audit entry per entry point. | FR-055, SC-005 |
| Agent login | Unit tests for `canAgentLogIn`: password, REST `login`, DDP `resume`, suspended agent, MCP off. The same cases for `loginViaResume` in the account service. | FR-019, FR-054, D-18 |
| DDP subscriptions | Unit tests for `checkAgentDdpCall` and `canAgentReadRoomEvents`. An API test with a DDP client: login, a subscription in and out of the allow list, without `get_agents_messages`, `__my_messages__`, a method refusal, and the socket close after an allow list change. | FR-054, US2 scenarios 8 and 9 |
| MCP off | An API test that turns off `MCP_Enabled`, then checks the MCP call, the registration, the DDP login, and the closed socket. It turns the setting on and checks that the same token works. | D-18, spec edge case |
| Tool list | An API test that compares `tools/list` for an agent with its effective scope, and for a human with the catalog before the change. | FR-038, DC-2 |
| Registration | API tests for the refused capabilities, the owner, the credential shown once, an agent caller, an empty allow list, and an OAuth caller whose token gets `401` after a registration and still works after a refused one. | FR-007 to FR-014, FR-056 |
| Room allow list | An API test that adds and removes a room and checks the membership and the history access. | FR-020 to FR-022 |
| Reply placement | Unit tests for `postAgentReply`: a room, a thread message, a direct message, threads disabled. An API test for each reply mode. | FR-025 to FR-028, SC-007 |
| Post limit | A unit test for the window counter, and an API test with 61 posts. | FR-050 |
| Role guard | Unit tests. | FR-004 |
| Approval card | Unit tests for the decide and expire paths. An E2E test for the card, a non-approver, the decision, and the expiry. | FR-029 to FR-035 |
| Badge | Component tests for the badge and its accessible label. An E2E test that compares an agent message, a bot message, and a human message. | FR-002, FR-003, FR-006 |
| Audit | API tests that read the audit trail after each audited action. | FR-017, FR-035, FR-048, SC-005 |
| Load | A manual run of the SC-010 scenario with 10 agents at the limit, before release. | FR-051, SC-009, SC-010 |
| Regression | The existing bot, PAT, integration, MCP, DDP, and ddp-streamer test suites stay green. | DC-2 |
| Microservices | A manual run of the DDP scenario in the quickstart against ddp-streamer, before release. | FR-054 |

## Post-design Constitution Check

The design passes every gate. The only exception is the `shortcut:` comment, which DC-3 requires. Complexity Tracking justifies it.

The 2026-11-19 revision adds no exception. The refusal audit slot is a named model method. The DDP contract is not a REST endpoint, so principle VI does not apply to it. Its errors reuse the `ClientSafeError` codes, and its rules go in `docs/features/ddp-sessions.md`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle V: `shortcut: <limit>, <when to upgrade> (SH-NNN)` comments state a limit, not an intent, and their ledger lives in `specs/`, not `docs/` | DC-3 requires a marker in code for each shortcut, so the next iteration finds and removes each one. | A ledger alone does not show the limit at the code that carries it. A doc in `docs/` would describe temporary state that the next iteration deletes. |

## Amendments

### A-1 (2026-11-19): Long-poll delivery over MCP

**Status**: Proposed, not scheduled. The steps above do not change, and F-5 still ships the poll. Research, decision, and effort: [research.md, A-1](research.md#a-1-2026-11-19-long-poll-delivery-over-mcp). Contract: [contracts/mcp-tools.md, A-1](contracts/mcp-tools.md#amendment-a-1-long-poll-on-get_agents_messages).

If the team schedules it, two pull requests follow F-8:

| Step | Kind | Title | Stories | Content |
|------|------|-------|---------|---------|
| R-3 | refactor | Share the agent reply-mode filter | none | Move the D-10 filter into a pure predicate. `agents.messages` returns the same results. |
| F-9 | feat | Let agents wait for new messages | US4, US5 | The `AgentEvents` hub and the `wait` parameter on `agents.messages` and `get_agents_messages`. It resolves SH-006 on every MCP revision the server supports. |

- **Effort**: 5 to 6.5 engineer-days. DDP subscriptions (F-10) already give push to a harness that speaks DDP, so A-1 serves MCP-only harnesses.
- **New files**: `apps/meteor/server/lib/agents/agentEvents/` (the hub). The MCP endpoint does not change.
- **Constitution**: The hub reads no model. The route passes the allowed rooms it already reads. No new exception.
- **Testing**: Unit tests for the hub, with `mockModel`. An API test calls `get_agents_messages` with `wait=10`, posts a mention, and expects the result within 1 s. A second test expects an empty result after the wait with no event. A third suspends the agent during a wait and expects no message. A manual run checks two instances.
