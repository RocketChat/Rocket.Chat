# Contract: DDP for agents

An agent uses the realtime connection (DDP) to receive events only (FR-054). It calls the workspace through the MCP server ([mcp-tools.md](mcp-tools.md)). Decisions: [research.md, D-13, D-16, D-17](../research.md#d-16-agent-ddp-subscriptions-fr-054). The same contract holds in the monolith and in ddp-streamer.

## Login

```json
{ "msg": "method", "method": "login", "id": "1", "params": [{ "resume": "<agent PAT>" }] }
```

| Case | Result |
|------|--------|
| Active agent, MCP server on and licensed | The login result. The session is an agent session. |
| Suspended agent | Error `error-agent-suspended`. |
| MCP server off or unlicensed | Error `error-agent-mcp-unavailable`. |
| Any login type other than `resume` | Error `error-agent-login-not-allowed`. |

The REST `login` route and the login screen refuse an agent with `error-agent-login-not-allowed` (FR-019).

- The PAT does not expire. The harness must not read `tokenExpires` in the login result. In the monolith, that field carries an invalid date.
- A login creates no new token. The harness logs in with the same PAT on every reconnect.
- A logged-in agent shows as online, the same as a human with an open session.

## Subscriptions

| Name | Params | Delivers |
|------|--------|----------|
| `stream-room-messages` | `[<rid>, …]` | New and edited messages in the room. |
| `stream-room-messages` | `["__my_messages__", …]` | New and edited messages in every room the agent belongs to. |
| `stream-notify-room` | `["<rid>/<event>", …]` | Room events, such as typing and message deletion. |

- The room must pass `Authorization.canAgentReadRoomEvents`: it is on the allow list or is a direct message of the agent, and the effective scope holds `get_agents_messages`. Otherwise the server answers `nosub` with `error-not-allowed`.
- For `__my_messages__`, the server applies the same check to each event.
- The reply mode does not filter these events. Messages of other agents arrive too. A harness in ambient mode must ignore an agent message that does not mention it (spec edge case).
- An approval decision arrives as an edit of the card message.

Every other subscription name gets `nosub` with `error-agent-mcp-only`.

## Methods

Every method other than `login` gets the error `error-agent-mcp-only`, with `details.entryPoint` set to `/api/v1/mcp`. This includes `logout` and the `stream-*` methods. The harness closes the socket to end the session.

## Session end

The server closes every session of an agent, on every instance, when:

- an admin edits the agent, or the owner or an admin suspends it,
- the credential is rotated or revoked,
- the agent or its owner is deleted, or the owner's roles change,
- a permission in `AGENT_TOOLS` changes on any role,
- the MCP server turns off or loses its license.

The harness reconnects, logs in, and subscribes again. The new subscriptions pass the checks with the new scope. The harness calls `get_agents_messages` from its cursor to fill the gap, because DDP has no replay.

## Audit

Each refused method and each refused subscription writes `agent.entry.refused`, at most once per agent per entry point per minute (FR-055). The entry points are `ddp-method` and `ddp-subscription`. A refused login follows the existing login audit.
