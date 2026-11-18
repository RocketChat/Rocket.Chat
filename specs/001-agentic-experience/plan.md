# Implementation Plan: Agent Identity and Access

**Branch**: `001-agentic-experience` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-agentic-experience/spec.md`

## Summary

An agent is a user with `type: 'agent'`, the protected role `agent`, and an `agent` subdocument for the owner, reply mode, capabilities, room allow list, and status.

- **Registration**: a human with `register-agents` calls `agents.register` over REST or as an MCP tool. The server returns a PAT on the agent user once.
- **Scope**: one agent guard in the REST auth middleware enforces the effective scope, the room allow list, the suspension, and the post limit on every agent call. MCP tool calls are loopback REST calls, so the same guard covers them. The MCP tool list applies the same table.
- **Delivery**: the agent polls `agents.messages` every 2 s. It posts through `agents.reply`, which picks the thread or the conversation, and through `agents.post` in autonomous mode.
- **Badge**: a message field `agent: true` and the user type drive the badge in the web client.
- **Approval card**: a core UiKit app runs the approval card with an atomic first-decision lock.

Decisions and alternatives: [research.md](research.md). Shortcuts: [shortcuts.md](shortcuts.md).

## Technical Context

**Language/Version**: TypeScript on Node 22. Meteor server in `apps/meteor`.

**Primary Dependencies**: Hono API router (`API.v1`), the workspace MCP server (`apps/meteor/ee/server/api/mcp/`), `@rocket.chat/models`, `@rocket.chat/authorization`, UiKit core apps, React and Fuselage, `@rocket.chat/ui-contexts`, `@rocket.chat/cron`. No new runtime dependency.

**Storage**: MongoDB. The `users` collection gains the `agent` subdocument. A new collection `rocketchat_agent_approvals` holds approval cards. Messages gain the `agent` field.

**Testing**: Jest and Mocha unit tests next to the files they test, with `mockModel`. API tests in `apps/meteor/tests/end-to-end/api/`. Playwright E2E tests in `apps/meteor/tests/e2e/`.

**Target Platform**: Rocket.Chat server, single instance and multi-instance. Web client. Mobile and desktop clients wait (SH-001).

**Project Type**: Web service and web client in a monorepo.

**Performance Goals**:
- An agent learns of a message within 5 s (FR-049, SC-009).
- An agent posts 60 messages per minute at most (FR-050).
- With 10 agents at the limit, human message delivery slows by 10% at most (SC-010).

**Constraints**:
- DC-1: take the fastest path, and reuse the user model, the roles, the PATs, the user administration, the UiKit surface, and the MCP catalog.
- DC-2: ship the scope requirements in full, and break no bot, PAT, integration, or human MCP use.
- The MCP server stays EE and license-gated. The guard, the role, and the `agents.*` endpoints are core, so the scope rules hold over REST without the license.

**Scale/Scope**: 10 concurrent agents per workspace for the SC-010 test. One credential per agent. 12 tools in the agent tool table.

All research questions are resolved in [research.md](research.md). No NEEDS CLARIFICATION remains.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-research | Post-design | Evidence |
|-----------|--------------|-------------|----------|
| I. One concern per change | Pass | Pass | The delivery order below gives one pull request per concern. The enabling refactor R-1 sits below the features. |
| II. Named model methods | Pass | Pass | Every new query is a named method on `Users`, `Messages`, or `AgentApprovals`, declared in `packages/model-typings` ([data-model.md](data-model.md)). The guard and the endpoints pass only `projection`, `sort`, and `limit`. |
| III. Tests prove the change | Pass | Pass | See [Testing](#testing). R-1 keeps the MCP tests green with no edits. |
| IV. Views isolated | Pass | Pass | The admin agent section and the info panel reach the server through `useEndpoint` from `@rocket.chat/ui-contexts`. The badge is a presentational component with props only. The new screens compose layout containers. |
| V. Comments state intent | Pass with exception | Pass with exception | `shortcut:` comments state a limit (DC-3). See Complexity Tracking. The subsystem doc goes in `docs/features/agents.md`, and the identity decision goes in an ADR. |
| VI. Validated contracts | Pass | Pass | Every `agents.*` endpoint uses `API.v1.get()` or `.post()` with schemas in `packages/rest-typings` ([contracts/rest-agents.md](contracts/rest-agents.md)). New text uses keys in `en.i18n.json` only. |
| Workflow: changesets | Pass | Pass | Each feature pull request carries a changeset for `@rocket.chat/meteor` and for each published package it touches (`core-typings`, `model-typings`, `rest-typings`, `models`, `ui-client`). |
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
│   └── mcp-tools.md      # MCP catalog evaluation, agent tool table, per-caller filter
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
packages/authorization/src/canAccessRoom.ts   # agent pre-check before the validator chain

apps/meteor/server/
├── lib/agents/                           # new
│   ├── agentTools.ts                     # AGENT_TOOLS table
│   ├── effectiveScope.ts                 # scope computation
│   ├── agentGuard.ts                     # route → tool → scope, room, suspension, rate
│   ├── registerAgent.ts, updateAgent.ts, agentCredential.ts, agentLifetime.ts
│   ├── listAgentMessages.ts              # reply-mode filter
│   ├── postAgentReply.ts                 # thread or conversation placement
│   └── approvals/                        # create, decide, expire
├── api/v1/agents.ts                      # new: agents.* endpoints
├── api/v1/middlewares/authentication.ts  # calls agentGuard for agent users
├── lib/authorization/constant/permissions.ts, upsertPermissions.ts   # role and permissions
├── lib/auth/startup.js                   # login block for type agent
├── lib/roles/                            # agent role guard
├── modules/core-apps/agentApproval.module.ts   # new UiKit core app
└── startup/cron.ts                        # registers the approval expiry sweep

apps/meteor/ee/server/api/mcp/
├── index.ts                              # pass the user type into McpAuth
├── server.ts                             # listTools(auth) for tools/list and tools/call
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

apps/meteor/tests/end-to-end/api/agents.ts       # REST and MCP scope suite
apps/meteor/tests/e2e/agents.spec.ts             # badge, allow list, approval card

docs/features/agents.md                   # new subsystem doc
docs/features/mcp-server.md               # agent callers and new tools
docs/adr/NNNN-agent-user-type.md          # identity decision
```

**Structure Decision**: The feature extends the existing Meteor app and its shared packages. Server logic goes in `apps/meteor/server/lib/agents/` under [docs/backend-folder-structure.md](../../docs/backend-folder-structure.md). The MCP changes stay in the EE MCP folder. No new app or package is created.

## Delivery order

Each step is one pull request with one concern (constitution I). The order puts the refactor first and keeps every scope check in place before any agent can exist (DC-2).

| Step | Kind | Title | Stories | Content |
|------|------|-------|---------|---------|
| R-1 | refactor | Pass the MCP caller to the tool listing | none | `McpAuth` carries the user type. `listTools(auth)` serves both `tools/list` and `tools/call`. Behavior for humans stays the same. The existing MCP tests stay green with no edits. |
| F-1 | feat | Add the agent user type | US1, US2 | The `IUser.agent` type, the `agent` role, the `register-agents` and `manage-agents` permissions, the role order, the login block (FR-019), the role guard (FR-004), the audit keys, and the ADR. |
| F-2 | feat | Restrict agents to their effective scope | US2, US3 | `AGENT_TOOLS`, `effectiveScope`, `agentGuard` in the auth middleware, the `canAccessRoom` pre-check, the post counter, the call cap, the denial audit, and the agent filter in the MCP tool list. The guard has no effect until an agent exists. |
| F-3 | feat | Register agents over REST and MCP | US2 | `agents.register`, `agents.info`, `agents.me`, and the catalog tools (RP-1, RP-7). |
| F-4 | feat | Authorize agents in rooms | US3 | `agents.update`, membership sync, cleanup on room deletion, and the agent settings section in the user administration. |
| F-5 | feat | Deliver messages to agents and place their replies | US4 | `agents.messages`, `agents.reply`, `agents.post`, the Messages model method, and the catalog tools. |
| F-6 | feat | Show the agent badge | US1 | The badge on messages, member lists, the mention popup, the info panel, the admin table, and notifications. |
| F-7 | feat | Add approval cards | US5 | The `AgentApprovals` model, `agents.approvals.*`, the core UiKit app, the expiry cron, and the decision events in `agents.messages`. |
| F-8 | feat | Manage the agent lifetime | US6 | Suspend, reactivate, rotate, revoke, delete, the owner tools in the catalog, and the admin actions. |

F-1 to F-6 deliver the P1 stories. F-7 and F-8 deliver the P2 stories in this iteration. If time runs short, F-7 and F-8 move to the next iteration with ledger entries. The suspension check ships in F-2 regardless.

## Testing

| Area | Test | Proves |
|------|------|--------|
| Effective scope | Unit tests for `effectiveScope` and `agentGuard` with `mockModel`. Cases: undeclared tool, role lacks a permission, owner lacks a permission, deleted owner, room off the list, direct message, suspended agent, unmapped route. | FR-014 to FR-017, FR-022, FR-043, FR-047, D-11 |
| Scope over REST and MCP | An API test that calls every route in the agent tool table and a sample of other routes, once in scope and once out of scope, over REST and over MCP. | SC-003, FR-039 |
| Tool list | An API test that compares `tools/list` for an agent with its effective scope, and for a human with the catalog before the change. | FR-038, DC-2 |
| Registration | API tests for the refused capabilities, the owner, the credential shown once, an agent caller, and an empty allow list. | FR-007 to FR-014 |
| Room allow list | An API test that adds and removes a room and checks the membership and the history access. | FR-020 to FR-022 |
| Reply placement | Unit tests for `postAgentReply`: a room, a thread message, a direct message, threads disabled. An API test for each reply mode. | FR-025 to FR-028, SC-007 |
| Post limit | A unit test for the window counter, and an API test with 61 posts. | FR-050 |
| Login block and role guard | Unit tests. | FR-004, FR-019 |
| Approval card | Unit tests for the decide and expire paths. An E2E test for the card, a non-approver, the decision, and the expiry. | FR-029 to FR-035 |
| Badge | Component tests for the badge and its accessible label. An E2E test that compares an agent message, a bot message, and a human message. | FR-002, FR-003, FR-006 |
| Audit | API tests that read the audit trail after each audited action. | FR-017, FR-035, FR-048, SC-005 |
| Load | A manual run of the SC-010 scenario with 10 agents at the limit, before release. | FR-051, SC-009, SC-010 |
| Regression | The existing bot, PAT, integration, and MCP test suites stay green. | DC-2 |

## Post-design Constitution Check

The design passes every gate. The only exception is the `shortcut:` comment, which DC-3 requires. Complexity Tracking justifies it.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle V: `shortcut: <limit>, <when to upgrade> (SH-NNN)` comments state a limit, not an intent, and their ledger lives in `specs/`, not `docs/` | DC-3 requires a marker in code for each shortcut, so the next iteration finds and removes each one. | A ledger alone does not show the limit at the code that carries it. A doc in `docs/` would describe temporary state that the next iteration deletes. |
