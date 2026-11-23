# Feature Specification: Agent Identity and Access

**Feature Branch**: `001-agentic-experience`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Today there is no dedicated agent identity in Rocket.Chat. Developers use regular bot accounts which carry no visual distinction, offer no scoped auth tokens, and require manual room membership setup. As agentic workloads grow — especially with a dedicated and purpose-built ADK or MCP-based integrations such as Mastra — the absence of a first-class agent type creates security gaps (overly permissive tokens), UX confusion (users can't distinguish agents from humans), and operational friction (no approval gate for high-stakes actions). Jobs To Be Done: (1) Room members need to know immediately when they're interacting with an agent, not a human — so they can calibrate trust and act accordingly. (2) Admins and operators need a clear onboarding path with scoped permissions and room-level access control so agents have only the access they need and can be managed like any other platform resource."

## Clarifications

### Session 2026-11-18

- Q: Is the human approval gate for high-stakes agent actions in scope? → A: Yes, as an in-channel approval card that the agent posts, with approve and reject actions. A platform-enforced gate is out of scope. (This answer replaces an earlier "out of scope" answer.)
- Q: Can an admin convert existing bot accounts into agents? → A: No. The agent type is for new accounts only.
- Q: Does this spec deliver an MCP server or an ADK? → A: The workspace MCP server already exists. This spec makes it serve agents and evaluates which new tools agents need. An ADK is out of scope.
- Q: What delivery constraint applies? → A: Take the fastest path to delivery. Record every shortcut so the next iteration resolves it.
- Q: How does an agent account come to exist? → A: The agent registers itself through an MCP tool. The identity that calls the tool becomes the agent owner. No admin creates the account by hand.
- Q: How fast must an agent learn of a message addressed to it? → A: Within 5 seconds. The target is provisional.
- Q: How many messages may an agent post? → A: 60 messages per minute per agent. The target is provisional.
- Q: Must the platform enforce one identity per harness instance in this iteration? → A: No. Each agent has one active credential, and the owner or an admin can revoke it. Detection of a shared credential goes to the next iteration (SH-002).
- Q: What does the product brief exclude? → A: Per-user MCP authorization, tool-loop visibility, the sidebar awareness badge, realtime interactions, agent-to-agent handoff, the dedicated agent dashboard with its audit log, and the Agent Builder UI. See "Out of scope".
- Q: Is the MCP tool the only registration path? → A: No. The registration scope is broader. The plan evaluates the registration paths in "Registration paths to evaluate". The MCP tool is the baseline path.
- Q: What scope does the agent credential carry? → A: The MCP capabilities that the agent declares at registration, and nothing beyond them.
- Q: Who controls the rooms an agent may operate in? → A: An admin, through a room allow list per agent.
- Q: Where do agent replies go? → A: In a room, into the thread of the message that triggered the reply. In a direct message with a human, into the conversation itself.

### Session 2026-11-19

- Q: Where may an agent credential be used? → A: Agent calls go through the workspace MCP server only. The REST API refuses an agent credential. DDP accepts it for subscriptions only (see below).
- Q: When the MCP server is disabled or the workspace lacks its license, what happens to agents? → A: Agents cannot register or call the system. Their messages and settings stay. They work again when the MCP server comes back.
- Q: Over DDP, may an agent only subscribe to events, or may it also call methods? → A: Subscriptions only. DDP accepts an agent credential to deliver events from the agent's allowed rooms and direct messages, and refuses every agent method call.
- Q: Which events may an agent receive over a DDP subscription? → A: Every event in a room or direct message whose history the agent's effective scope lets it read. The reply mode decides what the agent responds to, not what it may read.
- Q: Must the audit trail record each refused agent call on REST or a DDP method? → A: Yes, with at most one entry per agent per entry point per minute.
- Q: How does an MCP client that follows the MCP authorization flow register an agent? → A: RP-2 ships. The client gets an OAuth token through dynamic client registration and a human's consent, and calls the registration tool with that token. The consenting human becomes the owner. The registration revokes the OAuth token, so the client keeps only the agent credential.

## Delivery Constraints *(mandatory for this feature)*

### DC-1: Fastest path to delivery

- The plan MUST pick the option with the shortest delivery time that meets each requirement.
- The plan MUST reuse existing platform parts first: the user model, the roles and permissions, the personal access tokens, the user administration, the bot tag, the UiKit message surface, and the MCP catalog.
- The plan MUST deliver the P1 stories first. P2 stories MAY move to the next iteration as recorded shortcuts.
- A requirement MAY ship in a reduced form, if the reduced form passes its acceptance scenarios and the plan records a shortcut.

### DC-2: No shortcut on access scope

- The following requirements MUST ship in full form: FR-004, FR-009, FR-013, FR-014, FR-015, FR-016, FR-017, FR-022, FR-031, FR-037, FR-038, FR-039, FR-040, FR-043, FR-050, FR-053, FR-054, FR-055, and FR-056.
- A shortcut MUST NOT widen what an agent can read or do beyond its effective scope and room allow list.
- A shortcut MUST NOT break existing bot accounts, personal access tokens, integrations, or MCP use by human users.
- The constitution rules still apply to every shortcut, including tests for the behavior that ships.

### DC-3: Shortcut ledger

- The plan and the implementation MUST record every shortcut in `specs/001-agentic-experience/shortcuts.md`.
- Each entry MUST hold an ID (`SH-NNN`), the requirements it reduces or defers, what ships now, the limit, the risk, and the fix for the next iteration.
- Code that carries a shortcut MUST hold a one-line comment in the form `shortcut: <the limit>, <when to upgrade> (SH-NNN)`.
- A pull request that adds a shortcut MUST add its ledger entry in the same pull request.
- The next iteration starts from the open ledger entries.
- The `shortcut:` comment is an accepted exception to constitution principle V: it states a limit, not an intent, and its ledger lives in `specs/`, not `docs/`. The plan MUST list this exception in its Complexity Tracking table. When the next iteration resolves an entry, it MUST remove the matching comment.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognize an agent in a conversation (Priority: P1)

A room member reads a conversation. Every message, mention, profile, and member-list entry from an agent carries an agent badge. The member tells at a glance that a participant is an agent and not a human. The member opens the agent info panel to see the agent owner and what the agent can do.

**Why this priority**: The first job to be done. It addresses the trust and UX gap for every user, not only admins.

**Independent Test**: Register one agent and post a message from it and from a human into a shared room. A member identifies the agent message without opening any menu, then opens the info panel and reads the owner and the capabilities.

**Acceptance Scenarios**:

1. **Given** an agent posts a message in a room, **When** a member views the room, **Then** the message header shows an agent badge next to the agent name.
2. **Given** an agent and a bot account post in the same room, **When** a member views the room, **Then** the agent badge differs from the bot tag.
3. **Given** a member opens the agent info panel, **When** the panel loads, **Then** it shows the agent type, the description, the owner, the declared capabilities, and the status.
4. **Given** a member views the room member list or a mention autocomplete, **When** the list contains an agent, **Then** the agent entry shows the agent badge.
5. **Given** a member receives a notification for an agent message, **When** the notification appears, **Then** the notification identifies the sender as an agent.
6. **Given** a human account, **When** that user edits a profile name, avatar, or status, **Then** the user cannot add the agent badge to the account.

---

### User Story 2 - Register an agent (Priority: P1)

A developer connects an agent framework, such as Mastra, to the workspace. The agent registers itself through a supported registration path, with its name, description, reply mode, and the MCP capabilities it needs. A human identity authorizes the registration and becomes the owner. The system creates the agent account and gives the agent a scoped credential once. The baseline path is an MCP tool that the developer calls with the developer's own credential. An MCP client that follows the MCP authorization flow calls the same tool with an OAuth token that a human approves (RP-2). The plan evaluates more paths (see "Registration paths to evaluate").

**Why this priority**: The onboarding job to be done. Registration replaces a manual bot setup, and the scoped credential closes the security gap of today's bot tokens.

**Independent Test**: For each registration path that ships, a developer registers an agent that declares only the tools to read and post messages. The agent connects with its credential. The tool list holds only the declared tools, and a call to an undeclared tool fails.

**Acceptance Scenarios**:

1. **Given** a human identity allowed to authorize registrations, **When** an agent registers with a name, a description, a reply mode, and a list of capabilities, **Then** the system creates the agent and records that identity as its owner.
2. **Given** a successful registration, **When** the agent receives its credential, **Then** the system shows the secret once and never again.
3. **Given** a registration that declares a capability beyond the agent role or beyond the owner's own permissions, **When** the agent registers, **Then** the system rejects the registration and names each capability it refused.
4. **Given** a registration that no allowed human identity authorizes, **When** the agent registers, **Then** the system creates no active agent.
5. **Given** an agent credential, **When** the agent tries to register another agent on any path, **Then** the system denies the call.
6. **Given** a new agent, **When** the agent lists the rooms it can reach, **Then** the list is empty until an admin authorizes rooms.
7. **Given** two agents registered through two different paths, **When** a member opens their info panels, **Then** both show the same agent type, owner, and capability information.
8. **Given** an agent credential, **When** the agent calls the REST API directly or calls a DDP method, **Then** the system refuses the call, names the MCP server as the entry point, and records the refusal in the audit trail.
9. **Given** an agent credential, **When** the agent subscribes over DDP to a room on its allow list, **Then** the agent receives the room events only if its effective scope lets it read that room's history.
10. **Given** an OAuth token that a human approved for an agent framework, **When** the framework registers an agent with that token, **Then** the system records that human as the owner, returns the agent credential once, and revokes the OAuth token.

---

### User Story 3 - Authorize agents in rooms (Priority: P1)

An admin opens the agent in the existing user administration, and adds the rooms where the agent may operate. The agent joins those rooms at once. An admin removes a room, and the agent leaves it at once.

**Why this priority**: The room-level access control job to be done. A new agent can do nothing in rooms until an admin authorizes it, so this story gates the value of Story 2.

**Independent Test**: An admin adds one room to a new agent's room allow list. The agent posts in that room and fails to post in a second room.

**Acceptance Scenarios**:

1. **Given** an admin with the agent management permission, **When** the admin adds a room to an agent room allow list, **Then** the agent joins the room without a separate manual membership step.
2. **Given** an agent, **When** the agent tries to read, post in, or join a room outside its room allow list, **Then** the system denies the call, returns an error that names the room, and records the denial in the audit trail.
3. **Given** an admin removes a room from the agent room allow list, **When** the change saves, **Then** the agent leaves the room and loses access to its history.
4. **Given** a user without the agent management permission, **When** that user opens the administration area, **Then** the user cannot see or change agents.

---

### User Story 4 - Receive agent replies in the right place (Priority: P1)

A member mentions an agent in a room. The agent reply appears in the thread of that message, so the room stays readable. A member writes to an agent in a direct message, and the reply appears in the conversation itself. An agent in ambient or autonomous mode follows the same reply rule.

**Why this priority**: It decides how every agent conversation looks to room members. Without a default, agents flood the main room timeline.

**Independent Test**: Mention an agent in a room and send it a direct message. The room reply lands in the thread of the mention. The direct message reply lands in the conversation.

**Acceptance Scenarios**:

1. **Given** an agent in mention mode, **When** a member mentions the agent in an allowed room, **Then** the agent receives the message and its reply appears in the thread of that message.
2. **Given** an agent in mention mode, **When** a member posts in an allowed room without a mention, **Then** the agent does not receive the message.
3. **Given** an agent in ambient mode, **When** a member posts in an allowed room, **Then** the agent receives the message and any reply appears in the thread of that message.
4. **Given** a human opens a direct message with an agent, **When** the agent replies, **Then** the reply appears in the conversation, not in a thread.
5. **Given** an agent in autonomous mode, **When** the agent posts without a triggering message, **Then** the message appears in the main timeline of an allowed room.

---

### User Story 5 - Approve or reject an agent request (Priority: P2)

An agent needs human sign-off before it acts. It posts an approval card in the room or direct message. The card states the request and offers approve and reject actions. An approver picks one. The card shows the decision, and the agent receives it and acts on it.

**Why this priority**: The problem definition names the missing approval step for high-stakes actions. Agents can operate without it, so it follows the P1 stories.

**Independent Test**: An agent posts an approval card that names one approver. A non-approver cannot act on the card. The approver rejects it. The card shows the rejection, and the agent receives it.

**Acceptance Scenarios**:

1. **Given** an agent in an allowed room, **When** the agent posts an approval card with a request text and approvers, **Then** members see the card with approve and reject actions.
2. **Given** an approval card, **When** a member who is not an approver opens it, **Then** the member sees the card but cannot approve or reject.
3. **Given** an approval card, **When** an approver approves or rejects it, **Then** the card locks and shows the decision, the approver, and the time.
4. **Given** a decided card, **When** the agent checks for decisions, **Then** the agent receives the decision and the approver.
5. **Given** an approval card with an expiry, **When** the expiry passes with no decision, **Then** the card shows the expired state and no one can act on it.
6. **Given** an agent posts an approval card that names no approvers, **When** the card appears, **Then** the agent owner is the only approver.

---

### User Story 6 - Manage agents over their lifetime (Priority: P2)

An admin finds an agent in the existing user administration. An admin or the owner revokes a credential or suspends an agent. An admin deletes an agent. Each change takes effect for the next call.

**Why this priority**: Registration without lifetime controls leaves stale or compromised agents active.

**Independent Test**: Suspend an active agent and confirm that its next call fails. Reactivate it and confirm that its next call succeeds.

**Acceptance Scenarios**:

1. **Given** an admin opens the existing user administration, **When** the list contains agents, **Then** each agent entry shows the agent badge and its status.
2. **Given** an admin or the owner revokes an agent credential, **When** the agent next calls the system with that credential, **Then** the system rejects the call.
3. **Given** an admin or the owner rotates an agent credential, **When** the rotation completes, **Then** the new credential works and the old one stops working.
4. **Given** an admin or the owner suspends an agent, **When** the agent next calls the system, **Then** the system rejects the call and the info panel shows the suspended state.
5. **Given** an admin or the owner changes an agent, **When** the change saves, **Then** the audit trail records the actor, the agent, the change, and the time.

---

### Edge Cases

- An agent owner leaves the organization or loses the account: the agent stays active, and the info panel shows no owner until an admin assigns a new owner.
- An owner loses a permission that the agent declared: the agent loses that capability on its next call.
- An agent credential leaks: an admin or the owner revokes it, and every call with it fails from that moment on.
- An admin narrows an agent scope while the agent holds an open MCP session: the next tool list and the next tool call use the new scope.
- An admin deletes a room on the agent room allow list: the system removes the room from the list.
- A human renames an account to the name of an agent: the agent badge still separates the two accounts.
- An agent replies to a message that is already in a thread: the reply goes to that same thread.
- An agent replies in a room where threads are disabled: the reply goes to the main timeline.
- Two approvers act on one approval card at the same time: the first decision wins, and the second approver sees the decision.
- An approver leaves the room before deciding: the approver can no longer act on the card.
- An agent is suspended while its approval card is open: the card still records a decision, and the agent receives it after reactivation.
- An agent calls a tool that creates a room or a discussion: the new room joins the agent room allow list only if the agent scope allows room creation.
- An existing bot account keeps working unchanged, with its current credentials.
- The MCP server is disabled or unlicensed: no agent can register, and every registered agent call fails. DDP refuses agent logins too. The agent messages and settings stay. The agents work again when the MCP server comes back.
- One owner registers the same agent framework twice, or on two paths: the system creates two separate agents, each with its own credential.
- A registration waits for human approval and nobody acts on it: the registration expires and creates no agent.
- Two agents in ambient mode share a room: through the FR-042 tool, an agent message reaches the other agent only through a mention, so the two agents do not reply to each other in a loop. A DDP subscription delivers every message (FR-054), so a harness that reads DDP must apply the same rule itself.
- A federated or external user views an agent message: the message carries the agent badge wherever the client can show it.

## Requirements *(mandatory)*

### Functional Requirements

#### Agent identity and badge

- **FR-001**: The system MUST support an agent user type, separate from human users and from bot accounts, with its own role and its own system flag.
- **FR-002**: The system MUST show an agent badge on agent messages, mentions, profiles, member lists, search results, and notifications.
- **FR-003**: The agent badge MUST differ visibly from the bot tag and from any role tag.
- **FR-004**: Only the system MUST be able to mark an account as an agent. A user MUST NOT add the agent badge to a human account through a name, an avatar, a status, or a role.
- **FR-005**: The agent info panel MUST show the agent type, the description, the owner, the declared capabilities, and the status.
- **FR-006**: The agent badge MUST meet the platform accessibility rules, so a screen reader announces the sender as an agent.

#### Registration and ownership

- **FR-007**: The MCP server MUST offer a registration tool that creates an agent account. This is the baseline registration path. Every other path that ships MUST meet FR-008 to FR-014 the same way.
- **FR-008**: Every registration path MUST collect a name, a description, a reply mode, and a list of declared capabilities. A capability is an MCP tool.
- **FR-009**: The system MUST record the human identity that authorizes the registration as the agent owner. The registrant MUST NOT name another identity as the owner.
- **FR-010**: The system MUST create a new agent with an empty room allow list.
- **FR-011**: The system MUST NOT convert an existing bot or human account into an agent.
- **FR-012**: Every registration path MUST deliver the agent credential once, at registration time.
- **FR-013**: Only a human identity with the agent registration permission MUST be able to authorize a registration. An agent MUST NOT be able to register or authorize another agent.
- **FR-014**: The system MUST reject a registration that declares a capability beyond the agent role or beyond the owner's own permissions, and MUST name each refused capability.
- **FR-056**: A registration that an OAuth token authorizes MUST revoke the OAuth tokens of that client for that human once the agent exists. The registrant keeps only the agent credential.

#### Registration paths to evaluate

The plan's research phase MUST evaluate each path below against FR-008 to FR-014, DC-1, and DC-2, and MUST recommend which paths ship in this iteration. A path that does not ship is recorded in the shortcut ledger or listed as out of scope.

| ID | Path | Who authorizes and owns | Fits | Open questions |
|----|------|-------------------------|------|----------------|
| RP-1 | MCP registration tool (baseline) | The human whose credential opens the MCP session | Developers who already use the MCP server | How a headless agent gets a human session |
| RP-2 | OAuth consent: the agent framework registers as an OAuth client and asks a human to approve the agent and its capabilities on a consent screen | The human who approves the consent | MCP clients that follow the MCP authorization flow | How the consent screen shows capabilities; how a consent creates an agent identity, not a token for the human |
| RP-3 | Registration token: an admin or a permitted user issues a one-time token bound to capabilities, and the agent redeems it | The human who issued the token | Headless and server-side agents with no human at run time | Token lifetime; whether the token can also preset rooms |
| RP-4 | Pending self-registration: the agent registers without a human, and the agent stays pending until a permitted human approves it in a queue | The human who approves it | Open ecosystems with many agents | Abuse and spam limits on unauthenticated registration |
| RP-5 | Admin form: an admin creates the agent in the administration area | The admin, or an owner the admin picks | Operators who prefer manual control | Whether it conflicts with the "no manual admin setup" goal |
| RP-6 | Apps Engine: an installed app declares its agents, and installation registers them | The admin who installs the app | Agents shipped as Marketplace apps | How app permissions map to declared capabilities |
| RP-7 | REST registration: the same contract as RP-1 over the REST API | Same as RP-1 | Humans who register an agent without an MCP client. The agent itself still calls over MCP (FR-053) | Whether it differs from RP-1 at all |

#### Scoped credential

- **FR-015**: The agent credential MUST grant only the effective scope: the declared capabilities that both the agent role and the owner's current permissions allow, inside the room allow list.
- **FR-016**: The system MUST recompute the effective scope on each call, so a change to the role, the owner's permissions, or the room allow list takes effect on the next call.
- **FR-017**: The system MUST deny every call outside the effective scope, with an error that names the missing capability or room, and MUST record each denial in the audit trail.
- **FR-018**: An admin or the owner MUST be able to revoke and rotate an agent credential, and the change MUST take effect for the next call.
- **FR-019**: An agent MUST NOT be able to log in through the interactive login screen.
- **FR-053**: The REST API MUST refuse an agent credential, unless the workspace MCP server makes the call on behalf of the agent. The refusal MUST name the MCP server as the entry point for agents.
- **FR-054**: The realtime connection (DDP) MUST accept an agent credential for subscriptions only. A subscription MUST deliver only events from the allowed rooms and direct messages whose history the agent's effective scope lets it read. The reply mode does not filter DDP events. DDP MUST refuse every agent method call except the login itself.
- **FR-055**: The audit trail MUST record each refusal under FR-053 and FR-054, with at most one entry per agent per entry point per minute.

#### Room-level authorization

- **FR-020**: An admin with the agent management permission MUST be able to add rooms to and remove rooms from an agent room allow list.
- **FR-021**: The system MUST add the agent to a room when an admin adds the room, and remove it when an admin removes the room.
- **FR-022**: An agent MUST NOT read, post in, or join a room outside its room allow list.
- **FR-023**: An agent MUST be able to read and reply in a direct message that a human starts with it. An agent MUST NOT start a direct message unless its effective scope allows it. The agent role does not allow it by default.

#### Reply behavior

- **FR-024**: Each agent MUST have one reply mode: mention, ambient, or autonomous. An admin MUST be able to change it.
- **FR-025**: An agent in mention mode MUST receive only the messages that mention it in allowed rooms, and the messages in its direct messages. An agent in ambient or autonomous mode MUST receive every message in its allowed rooms and direct messages. A message from another agent MUST reach an agent only when it mentions that agent. This rule governs the FR-042 tool. DDP subscriptions follow FR-054.
- **FR-026**: When an agent replies to a message in a room, the reply MUST go to the thread of that message by default.
- **FR-027**: When an agent replies in a direct message with a human, the reply MUST go to the conversation, not to a thread.
- **FR-028**: An agent in autonomous mode MUST be able to post a message without a triggering message in the main timeline of an allowed room.
- **FR-057**: An agent MUST be able to add non-interactive UiKit blocks to each message it posts under FR-026 to FR-028. The system MUST reject a message with an invalid block or an interactive element, with an error that names each rejected block. An interactive element is any element that sends a block action, for example a button, a select, an overflow menu, or an input.

#### Approval card

- **FR-029**: An agent MUST be able to post an approval card in an allowed room or a direct message. The card holds a request text, approve and reject actions, an optional list of approvers, and an optional expiry.
- **FR-030**: When a card names no approvers, the agent owner MUST be the only approver.
- **FR-031**: Only an approver who is a member of the room MUST be able to approve or reject a card.
- **FR-032**: The first decision MUST lock the card. The card MUST then show the decision, the approver, and the time.
- **FR-033**: A card past its expiry with no decision MUST show the expired state and accept no decision.
- **FR-034**: The agent MUST be able to receive the decision and the approver through the MCP server.
- **FR-035**: The audit trail MUST record each approval card, decision, and expiry.

#### MCP server for agents

- **FR-036**: The MCP server MUST evaluate its tool catalog against agent needs and add the tools that the requirements in this spec call for.
- **FR-037**: The workspace MCP server MUST accept an agent credential.
- **FR-038**: The MCP server MUST list to an agent only the tools in its effective scope.
- **FR-039**: Every MCP tool call by an agent MUST obey the effective scope and the room allow list.
- **FR-040**: Search, directory, and autocomplete tools MUST return to an agent only the rooms on its room allow list and the users in those rooms.
- **FR-041**: The MCP server MUST offer a tool that returns the calling agent's owner, declared capabilities, effective scope, reply mode, and room allow list.
- **FR-042**: The MCP server MUST offer a tool that returns the messages for the calling agent since a given point, as its reply mode defines them, across its allowed rooms and direct messages.
- **FR-043**: The agent role MUST NOT allow the MCP tools that manage users, ban or mute users, change room settings, or archive rooms.

#### Delivery and load

- **FR-049**: An agent MUST learn of each message that its reply mode delivers to it within 5 seconds of the post.
- **FR-050**: The system MUST limit each agent to 60 posted messages per minute. A post over the limit MUST fail with an error that states when the agent may post again.
- **FR-051**: Agent load MUST NOT slow message delivery for human users.
- **FR-052**: Each agent MUST have one active credential at a time. The platform does not detect two harness instances that share one credential in this iteration (SH-002).

The 5-second and 60-messages-per-minute targets are provisional, and a spec revision may change them.

#### Lifetime management

- **FR-044**: The existing user administration MUST show the agent badge and status on agent entries. A dedicated agent dashboard is out of scope.
- **FR-045**: An admin MUST be able to edit an agent description, owner, reply mode, and room allow list.
- **FR-046**: An admin or the owner MUST be able to suspend and reactivate an agent. An admin MUST be able to delete an agent.
- **FR-047**: A suspended agent MUST NOT be able to call the system. Its messages MUST stay visible.
- **FR-048**: The audit trail MUST record every registration, edit, credential revoke, credential rotation, suspension, and deletion of an agent, with the actor and the time.

### Research questions for the plan

The plan's research phase MUST answer each question below and record the answer in `research.md`. An answer that does not meet a requirement MUST name the requirement and propose a shortcut or a spec change.

| ID | Question | Requirements it serves | Notes |
|----|----------|------------------------|-------|
| RQ-1 | How does an agent harness learn of events: mentions, room messages, direct messages, and approval decisions? Candidates: MCP notifications or subscriptions, DDP subscriptions (FR-054), a pub/sub channel, webhooks, and polling of the FR-042 tool. | FR-025, FR-034, FR-042, FR-049 | This is message delivery to the agent, not the excluded streaming of agent replies. Polling of FR-042 is the fastest path, if it meets FR-049. |
| RQ-2 | Can the platform detect or block one credential in use by two harness instances, and at what cost? | FR-052, SH-002 | The answer feeds the next iteration. It does not block this iteration. |
| RQ-3 | Do the REST API rate limits that the MCP server inherits meet FR-050 and FR-051? If not, which agent-specific guards are needed, for example per-agent limits or a cap on posts at agent start-up? | FR-050, FR-051 | Agents can post in bursts, for example a mass post at start-up. |
| RQ-4 | Do one agent role and declared capabilities per MCP tool give enough control, or does the agent need finer scope, for example per room or read versus write? | FR-014, FR-015, FR-043 | The spec decides one agent role on the existing permissions. A finer model is a spec change. |
| RQ-5 | How does an agent learn to compose valid UiKit blocks? Candidates: the JSON schema in the MCP tool input, an MCP resource or prompt with the UiKit reference and examples, a published skill for agent frameworks, and validation errors that state the fix. | FR-036, FR-057 | The agent sees only what the MCP server exposes, so the answer must reach the agent through MCP. |

### Key Entities

- **Agent**: A user of the agent type. It holds a name, a description, an avatar, an owner, a reply mode, a status (active, suspended), declared capabilities, and a room allow list.
- **Agent role**: The role that every agent holds. It sets the widest scope that any agent can reach.
- **Declared capabilities**: The MCP tools that an agent asks for at registration.
- **Effective scope**: The declared capabilities that both the agent role and the owner's current permissions allow, inside the room allow list.
- **Room allow list**: The list of rooms where an admin authorizes an agent to operate.
- **Agent credential**: A secret that authenticates one agent on the MCP server, and on DDP for subscriptions only. It holds an issue date and a status (active, revoked).
- **Registration path**: A way for an agent to come to exist, such as the MCP tool, an OAuth consent, or a registration token. Every path produces the same agent entity.
- **Agent owner**: The human identity that authorized the agent registration. The info panel shows the owner, and the MCP server returns it.
- **Reply mode**: How an agent receives messages: mention, ambient, or autonomous.
- **Agent audit entry**: A record in the existing platform audit trail of one change to an agent, one approval decision, or one denied agent call.
- **Approval card**: An in-channel card that an agent posts to ask for human sign-off. It holds the request, the approvers, the expiry, the state (pending, approved, rejected, expired), the approver who decided, and the time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a usability test, 95% of participants identify which participant in a room is an agent within 5 seconds, without opening a menu.
- **SC-002**: A developer registers an agent and posts a first reply in an authorized room in under 10 minutes, with the published documentation only.
- **SC-003**: 100% of agent calls outside the effective scope or room allow list fail, in a test suite that covers every public action and every MCP tool.
- **SC-004**: A revoked or rotated credential fails on the next call, within 5 seconds of the revocation.
- **SC-005**: 100% of agent changes, approval decisions, and denied agent calls appear in the audit trail with an actor and a time. Refusals under FR-053 and FR-054 follow the cap in FR-055.
- **SC-006**: Zero manual room membership steps are needed after an admin sets the room allow list.
- **SC-007**: 100% of agent replies to room messages land in the thread of the triggering message, in a test that covers the three reply modes.
- **SC-008**: An approver decides on an approval card with one click, and the agent can read the decision within 5 seconds.
- **SC-009**: 95% of the messages delivered to an agent reach it within 5 seconds of the post, under the load in SC-010.
- **SC-010**: With 10 agents that each post at the limit, the time for a human message to reach other humans stays within 10% of the time with no agents.

## Assumptions

- Rocket.Chat already shows a "Bot" tag on messages from bot accounts. The agent badge is a new, distinct badge, and the bot tag stays as is.
- The "operator" in the product brief is the agent owner. The spec uses "owner" for both.
- A new "register agents" permission controls who may authorize a registration on any path. The admin role holds it by default, and admins grant it to developers.
- The workspace already runs an OAuth 2 server with dynamic client registration, under the same license as the MCP server. RP-2 builds on it. The dynamic client registration setting is off by default, so an admin turns it on or creates the OAuth app by hand.
- A new "manage agents" permission controls the agent settings in the existing user administration. The admin role holds it by default.
- The agent role reuses the existing platform permissions. The spec adds no new permission model.
- The approval card asks for sign-off. The agent honors the decision. The platform does not block the agent action itself.
- The approval card uses the UiKit message surface. UiKit PR #43485 is merged (commit `42f9f7efa46`), so the dependency is in place.
- The audit trail is the existing platform audit trail.
- Agent workloads run outside Rocket.Chat and call it over the workspace MCP server only. They may receive events over DDP subscriptions.
- The workspace MCP server keeps its current license and enable setting, and its current behavior for human users.
- FR-041 and FR-042 are the tool gaps found so far, besides the registration tool. The plan phase reviews the full MCP tool catalog under FR-036.
- Mobile and desktop clients show the agent badge after the web client (SH-001).
- Existing bot accounts, personal access tokens, and integrations keep working unchanged.

### Out of scope

- An agent SDK or ADK.
- An Agent Builder UI. RP-5 creates an agent identity only, not agent behavior.
- Per-user MCP authorization: a consent card for an agent to access a user's personal resources (Phase 2+). RP-2 is different: its consent authorizes the creation of an agent, not access to the approving user's resources.
- Tool-loop visibility and thinking streams.
- Realtime interactions: streaming replies and live tool progress. An agent posts each reply as a complete message.
- Interactive UiKit elements in agent messages (deferred). FR-057 allows non-interactive blocks only, because no path delivers block actions to an agent yet. The approval card (FR-029) is the exception, since the platform owns its actions.
- A cross-channel awareness badge in the sidebar. The agent badge shows only on the surfaces in FR-002.
- Agent-to-agent handoff. An agent may mention another agent like any user, with no handoff semantics.
- A dedicated agent dashboard to manage agent definitions (prompts, tools), LLM providers, and workflows, with its own admin visibility views and audit log. The agent records in the existing platform audit trail (FR-017, FR-035, FR-048) stay in scope.
- A platform-enforced approval gate that blocks an agent action until a human approves it.
- Room-owner controls over agents. Only admins manage the room allow list.
- Conversion of existing bot accounts into agents.
