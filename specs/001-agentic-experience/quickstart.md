# Quickstart: Validate Agent Identity and Access

This guide proves the feature end to end on a local workspace. Shapes: [contracts/rest-agents.md](contracts/rest-agents.md), [contracts/mcp-tools.md](contracts/mcp-tools.md).

## Prerequisites

- A local workspace from source ([docs/getting-started.md](../../docs/getting-started.md)), with an EE license that includes the AI add-on.
- The setting `MCP_Enabled` is on.
- An admin account and a second human account (`alice`) in the room `#general`.
- A PAT for the admin, in `ADMIN_ID` and `ADMIN_TOKEN`.

```bash
MCP=http://localhost:3000/api/v1/mcp
call() { # call <userId> <token> <tool> <json-args>
  curl -s "$MCP" -H "Content-Type: application/json" -H "X-User-Id: $1" -H "X-Auth-Token: $2" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$3\",\"arguments\":$4}}"
}
```

## Scenario 1: Register an agent (US2, RP-1)

```bash
call "$ADMIN_ID" "$ADMIN_TOKEN" post_agents_register \
  '{"username":"qs-agent","name":"QS Agent","description":"Quickstart","replyMode":"mention","capabilities":["get_agents_messages","post_agents_reply"]}'
```

Expected: the response holds `credential.userId` and `credential.token`. Store them in `AGENT_ID` and `AGENT_TOKEN`. The audit trail holds `agent.registered`.

Run the call again with `"capabilities":["post_rooms_banUser"]`. Expected: `error-agent-capabilities-refused`, with `not-allowed-for-agents` for that tool.

## Scenario 1b: Register an agent with OAuth (US2, RP-2)

1. Turn on `OAuth2_Allow_Dynamic_Client_Registration`. Register a client with `POST /oauth/register` and a loopback `redirect_uris`.
2. Open `/oauth/authorize` with that client as the admin, approve, and exchange the code at `POST /oauth/token`. Store the access token in `OAUTH_TOKEN`.
3. Call `post_agents_register` on `/api/v1/mcp` with `Authorization: Bearer $OAUTH_TOKEN` and a new `username`.

Expected: the response holds the agent credential, and the owner is the admin. Call any MCP tool again with `OAUTH_TOKEN`. Expected: `401` with `invalid_token`.

## Scenario 1c: Register an agent in the user administration (US2, RP-5)

1. As the admin, open Administration → Users and click "Register agent". Fill in the name, the username `qs-form-agent`, the description, and the reply mode, and save.
2. Expected: the view shows the user id and the token once. Close it and reopen the agent. Expected: the token is gone. The info panel shows the admin as the owner and the fixed capability set.
3. Turn off `MCP_Enabled`. Expected: the "Register agent" button and the agent settings section are hidden. The revoke and delete actions still show. Turn it back on.

## Scenario 1d: Seat limit (FR-059)

Use a license with no free seat. Run the Scenario 1 call with a new `username`. Expected: `error-license-user-limit-reached`. In the user administration, the "Register agent" button is disabled like "New user".

## Scenario 2: Scoped tool list (US2, FR-038)

```bash
curl -s "$MCP" -H "Content-Type: application/json" -H "X-User-Id: $AGENT_ID" -H "X-Auth-Token: $AGENT_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected: exactly `get_agents_me`, `get_agents_messages`, and `post_agents_reply`.

`call "$AGENT_ID" "$AGENT_TOKEN" get_rooms_info '{"roomId":"GENERAL"}'` returns `error-agent-capability-not-allowed`. `call "$AGENT_ID" "$AGENT_TOKEN" get_agents_me '{}'` shows an empty `allowedRooms`.

## Scenario 3: Authorize a room (US3)

1. Open Administration → Users → `qs-agent`. Expected: the row shows the agent badge and the `active` status.
2. Add `#general` to the room allow list and save. Expected: `qs-agent` appears in the `#general` member list with the agent badge, with no other step.
3. As the agent, post a reply to a message in a room that is not on the list. Expected: `error-agent-room-not-allowed` names the room, and the audit trail holds `agent.call.denied`.

## Scenario 4: Mention and reply in a thread (US4, US1)

1. As `alice`, post `@qs-agent hello` in `#general`. Note the message id.
2. Within 5 s, `call "$AGENT_ID" "$AGENT_TOKEN" get_agents_messages '{}'`. Expected: the mention is in `messages`.
3. As `alice`, post `no mention here`. Expected: the next poll does not return it.
4. `call "$AGENT_ID" "$AGENT_TOKEN" post_agents_reply '{"msgId":"<id>","text":"hi"}'`. Expected: the reply appears in the thread of the mention. The header shows the agent badge, which differs from the Bot tag. A screen reader announces "Agent".
5. Open the agent profile. Expected: the panel shows the agent type, the description, the owner, the capabilities, and the status.
6. As `alice`, open a direct message with `qs-agent` and write to it. The agent replies to that message. Expected: the reply is in the conversation, not in a thread.

## Scenario 5: Rate limit (FR-050)

Send 61 `post_agents_reply` calls inside one minute. Expected: call 61 fails with `error-agent-rate-limited` and a `retryAfter` value.

## Scenario 6: Approval card (US5)

Register a second agent with `post_agents_approvals_create` and `get_agents_approvals_info`, and allow `#general`.

1. Create a card with no approvers. Expected: the card shows approve and reject buttons. The admin (the owner) is the only approver.
2. As `alice`, click approve. Expected: the click is refused.
3. As the admin, click reject. Expected: the card locks and shows the rejection, the admin, and the time.
4. `get_agents_approvals_info` returns `rejected` and the admin.
5. Create a card with `expiresAt` one minute ahead and wait two minutes. Expected: the card shows the expired state, and a click does nothing.

## Scenario 7: Lifetime (US6)

1. `call "$ADMIN_ID" "$ADMIN_TOKEN" post_agents_suspend '{"agentId":"'$AGENT_ID'"}'`. Expected: the next agent call fails with `error-agent-suspended`. The info panel shows `suspended`. Old messages stay visible.
2. Reactivate it. Expected: the next agent call succeeds with the same token.
3. Rotate the credential. Expected: the old token fails, and the new token works.
4. Try to log in as `qs-agent` on the login screen. Expected: the login fails.

## Scenario 7b: MCP server as the only entry point (FR-053 to FR-055)

Use an agent with `get_agents_messages` and `#general` on its allow list. Contract: [contracts/ddp-agents.md](contracts/ddp-agents.md).

1. `curl -s http://localhost:3000/api/v1/agents.me -H "X-User-Id: $AGENT_ID" -H "X-Auth-Token: $AGENT_TOKEN"`. Expected: `403` with `error-agent-mcp-only` and `details.entryPoint` `/api/v1/mcp`.
2. Repeat the call five times inside one minute. Expected: the audit trail holds one `agent.entry.refused` entry with the entry point `rest`.
3. `curl -s http://localhost:3000/api/v1/login -d '{"resume":"'$AGENT_TOKEN'"}' -H "Content-Type: application/json"`. Expected: the login fails.
4. Open a DDP client on `ws://localhost:3000/websocket` and log in with `{"resume":"<AGENT_TOKEN>"}`. Expected: the login succeeds.
5. Subscribe to `stream-room-messages` for `GENERAL`. As `alice`, post `no mention here`. Expected: the agent receives the message, whatever its reply mode.
6. Subscribe to `stream-room-messages` for a room off the allow list. Expected: `nosub` with an error.
7. Call the method `sendMessage`. Expected: `error-agent-mcp-only`. The audit trail holds one `agent.entry.refused` entry with the entry point `ddp-method`.
8. Remove `#general` from the allow list. Expected: the server closes the socket. After a new login, the subscription to `GENERAL` gets `nosub`.
9. Turn off `MCP_Enabled`. Expected: the socket closes, the DDP login fails with `error-agent-mcp-unavailable`, and `agents.register` fails for the admin. Turn it back on. Expected: the agent calls and the DDP login work again with the same token.

## Scenario 8: No regression (DC-2)

- An existing bot account posts with its current credentials, and the message shows the Bot tag only.
- A human PAT on the MCP server lists the same tools as before, plus the registration and owner tools.

## Automated checks

```bash
cd apps/meteor
yarn testunit                                        # guard, scope, reply placement, rate counter
yarn .testapi 'tests/end-to-end/api/agents*.ts'       # MCP scope suite (SC-003), REST refusal, DDP subscriptions
yarn test:e2e --grep agent                           # badge, admin allow list, approval card
```

The API test suite covers every route in the agent tool table and a sample of routes outside it (SC-003). See [plan.md](plan.md#testing).

## Amendment A-1: Long poll (proposed, F-9)

Run this scenario only after F-9 ships. Any MCP client works.

1. The harness calls `get_agents_messages` with its cursor and `wait=10`. No message is pending.
2. A human mentions the agent in an allowed room. Expect the call to return the mention within 1 s.
3. The harness calls again with the new cursor and `wait=10`. Post nothing. Expect an empty result after 10 s, with the same cursor.
4. The harness calls again with `wait=10`. The owner suspends the agent during the wait. Expect no message in the result.
5. Post a message while no call waits. Then call with the last cursor and `wait=10`. Expect the message at once.

Contract: [contracts/mcp-tools.md, A-1](contracts/mcp-tools.md#amendment-a-1-long-poll-on-get_agents_messages).

## Amendment A-3: Webhook (proposed, F-11)

Run this scenario only after F-11 ships.

1. Start a local receiver on port 4000 that logs each request. Add `127.0.0.1` to `SSRF_Allowlist`.
2. Register an agent with `webhookUrl: "http://127.0.0.1:4000/hook"`. Expect a webhook secret in the response.
3. Add a room to its allow list. A human mentions the agent there. Expect one request within 1 s, with a valid signature.
4. Post a message with no mention. In mention mode, expect no request.
5. Make the receiver return `500` twice. Mention the agent. Expect three requests: at once, after 2 s, and after 4 s.
6. Remove `127.0.0.1` from `SSRF_Allowlist`, then update the agent with the same URL. Expect `error-agent-webhook-url-refused`.
7. Suspend the agent and mention it. Expect no request.

Contract: [contracts/agent-webhook.md](contracts/agent-webhook.md).
