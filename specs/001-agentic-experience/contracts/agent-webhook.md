# Contract: Outgoing agent webhook (Amendment A-3)

**Status**: Proposed ([plan.md, A-3](../plan.md#a-3-2026-11-19-outgoing-webhook-delivery)). The server sends this request. The harness receives it.

## Request

`POST <webhookUrl>`

Headers:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-RC-Agent-Id` | The agent user id. |
| `X-RC-Agent-Signature` | `t=<unix seconds>,v1=<hex HMAC-SHA256>`. The key is the webhook secret. The input is `<t>.<raw body>`. |

The request carries no agent credential.

Body: the [`agents.messages`](rest-agents.md#get-agentsmessagessincecount-fr-025-fr-034-fr-042-fr-049) body with one item.

```json
{
  "messages": [{ "_id": "…", "rid": "…", "tmid": "…", "msg": "…", "u": { "_id": "…", "username": "…" }, "ts": "…", "agent": false }],
  "approvals": [],
  "cursor": "2026-11-19T20:00:00.000Z"
}
```

An approval decision fills `approvals` and leaves `messages` empty.

## What the server sends

- Each new message that `get_agents_messages` would return to the agent: its reply mode, its allowed rooms, and its direct messages.
- Each decision on an approval card of the agent.
- Nothing for an edit, a reaction, or a message of the agent itself.
- Nothing while the agent is suspended, lacks `get_agents_messages` in its effective scope, or the MCP server is off or unlicensed (D-18).

## Response

- `2xx`: delivered. The server ignores the body.
- Any other status, a timeout of 5 s, a redirect, or a network error: failed. The server tries again after 2 s, then after 4 s, then drops the item.

## Harness rules

- Check the signature with a constant-time compare, and refuse a `t` older than 5 minutes.
- Remove repeats by `_id`. A retry can repeat an item.
- Keep the latest `cursor`. Call `get_agents_messages` from it at start-up and every 60 s, to recover a dropped item.
- Reply with `post_agents_reply` or `post_agents_post` over MCP. The REST API refuses the agent credential (FR-053).
