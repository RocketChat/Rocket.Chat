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

## Scenario 8: No regression (DC-2)

- An existing bot account posts with its current credentials, and the message shows the Bot tag only.
- A human PAT on the MCP server lists the same tools as before, plus the registration and owner tools.

## Automated checks

```bash
cd apps/meteor
yarn testunit                                        # guard, scope, reply placement, rate counter
yarn .testapi 'tests/end-to-end/api/agents*.ts'       # REST and MCP scope suite (SC-003)
yarn test:e2e --grep agent                           # badge, admin allow list, approval card
```

The API test suite covers every route in the agent tool table and a sample of routes outside it (SC-003). See [plan.md](plan.md#testing).
