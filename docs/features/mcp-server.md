# MCP Server (Model Context Protocol)

> **Status: Alpha.** Off by default. Its capabilities and configuration may evolve as we gather feedback.

## Overview

The MCP server exposes the Rocket.Chat REST API to [Model Context Protocol](https://modelcontextprotocol.io) clients (Claude Desktop/Code, IDE agents, custom agents). It speaks **JSON-RPC 2.0 over Streamable HTTP** and turns existing REST endpoints into MCP **tools**, so an AI client can drive a workspace (post messages, search, manage rooms, look up users, …) using the user's own credentials and permissions.

It is **enterprise (protected) code** under `apps/meteor/ee/`. The design goal is _native + minimum changes_: it mounts on the existing Hono API router and reuses its authentication, permissions, license checks, remote-address resolution, logging, metrics, tracing, CORS, and generated typed-route metadata. Tool execution goes through the REST API, including each target endpoint's validation, authorization, and rate limiting. The endpoint adds MCP-specific Origin validation for DNS-rebinding protection. There is **no new runtime dependency** — the JSON-RPC layer is implemented directly.

## Endpoint

| Method | Endpoint                                               | Behavior                                                                                                   |
| ------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| POST   | `/api/v1/mcp`                                          | JSON-RPC 2.0 message. The `2025-03-26` revision also accepts batch arrays. Response is `application/json`. |
| GET    | `/api/v1/mcp`                                          | `405` with `Allow: POST` — this transport does not offer a server-initiated SSE stream.                    |
| GET, HEAD | `/.well-known/oauth-protected-resource/api/v1/mcp`  | Protected resource metadata (RFC 9728): names the workspace as the authorization server of the endpoint. Under a path prefix, the prefix goes after `oauth-protected-resource`. |
| GET, HEAD | `/.well-known/oauth-protected-resource`             | The same document, for clients that look it up at the bare path.                                          |

The endpoint is attached directly to the existing `/api/v1` Hono router because its JSON-RPC envelopes are defined by the MCP specification rather than Rocket.Chat's REST response contract. It still uses the standard authentication, `access-mcp` permission, and AI license middleware. When `MCP_Enabled` is off the endpoint and the metadata return `404` before MCP checks credentials or sends a challenge, so a disabled endpoint does not advertise OAuth.

## Request lifecycle

The MCP handshake is the standard JSON-RPC flow:

1. **`initialize`** — client and server exchange protocol version + capabilities. The server negotiates the handshake-based Streamable HTTP revisions it supports (`2025-03-26`, `2025-06-18`, and `2025-11-25`) and advertises `{ tools: { listChanged: false } }`. The transport is stateless and does not issue a session id.
2. **`tools/list`** — returns the available tools (name, description, `inputSchema`).
3. **`tools/call`** — runs a tool by name with arguments and returns its result as `content`.

Also handled: `ping`, and the `notifications/initialized` / `notifications/cancelled` notifications (acknowledged with `202`, no body).

After initialization, clients should send the negotiated version in the `MCP-Protocol-Version` header. Requests with an unsupported version are rejected with `400`; when the header is omitted, the transport follows the specification's `2025-03-26` compatibility default. JSON-RPC batching is accepted only for that revision because later Streamable HTTP revisions require one message per POST.
The shared CORS middleware advertises this request header only while MCP is enabled.

## Authentication

Authentication is **reused from the REST layer** — no MCP-specific credential type. A request without a credential, usually a client's first `initialize`, gets the challenge described below; every other request carries one of:

- a **Personal Access Token**, as `X-User-Id` + `X-Auth-Token` headers;
- an **OAuth access token** issued by the workspace's own [OAuth2 server](oauth2-server.md), as `Authorization: Bearer <token>`.

The standard auth middleware resolves the user, and the MCP middleware then checks which credential it came from:

- Without either credential, the request gets `401` with `WWW-Authenticate: Bearer resource_metadata="https://<host>/.well-known/oauth-protected-resource<path>/api/v1/mcp"`, where `<path>` is the workspace's path prefix, if any. That challenge is how MCP clients discover that the endpoint uses OAuth and where to get a token (MCP authorization, RFC 9728). For a workspace under a prefix, that location is outside the prefix, so a reverse proxy in front of it must forward it to the workspace.
- A credential that does not resolve to a user gets the same challenge with `error="invalid_token"`.
- On POST, the only method that runs tools, `X-Auth-Token` must belong to a Personal Access Token: a login session token is refused with `401`. GET answers `405` without that lookup.
- An access token passed as an `access_token` query parameter, which the REST API accepts, is ignored: MCP only reads it from the `Authorization` header.

Every MCP request additionally requires the **`access-mcp`** permission (`permissionsRequired: ['access-mcp']`), enforced by the standard permissions middleware. Without it the request is rejected with `403`. The permission is granted to `admin` by default; admins can grant it to other roles from the Permissions admin page. OAuth does not change who may use MCP.

> When creating the PAT, tick **"Ignore Two Factor Authentication"**, otherwise header auth is rejected with a 2FA challenge.

### OAuth flow

1. The client sends `initialize` without credentials and gets the `401` challenge.
2. It reads the protected resource metadata, which names the workspace (`Site_Url`) as the authorization server, then the [authorization server metadata](oauth2-server.md#metadata).
3. It registers itself at `/oauth/register` (Dynamic Client Registration, off by default — see [the OAuth2 server](oauth2-server.md#dynamic-client-registration)), or uses the client ID and secret of an OAuth app an administrator created for it.
4. It sends the user to `/oauth/authorize` with a PKCE challenge, exchanges the code at `/oauth/token`, and retries with the access token. It refreshes the token with the refresh token when it expires.

An OAuth access token is not bound to MCP: one issued to any OAuth app of the workspace works here, and one issued for MCP works on the whole REST API. This matches what a Personal Access Token can already do.

## Transport security

The endpoint validates the `Origin` header to protect browser-accessible deployments from DNS-rebinding attacks. Requests without `Origin` are accepted for native MCP clients. Browser requests are accepted only when their normalized origin matches `Site_Url` or an explicit entry in `API_CORS_Origin` while CORS is enabled. The wildcard (`*`) does not authorize a browser origin for MCP.

Tool dispatch is restricted to server-generated, allow-listed REST paths on `127.0.0.1`; client input cannot select a URL. Redirects are rejected, calls time out after 20 seconds, and each REST response and final encoded MCP response is capped at 5 MiB. Batches run at most four calls concurrently and share the same 5 MiB streaming response budget.

## Licensing

The feature is gated behind the **Rocket.Chat AI add-on** (`chat.rocket.rc-ai`):

- The route is registered with `license: [AI_LICENSE_MODULE]`, so requests are rejected unless the workspace license includes the module.
- The `MCP_*` settings and `OAuth2_Allow_Dynamic_Client_Registration` use the same module and an `invalidValue` of `false`, so without the add-on they fall back to **off** and the feature cannot be enabled.

## Tool catalog

Two **bounded** sets are exposed, selected by the `MCP_Expose_Extended_API` setting. The full unfiltered API is **never** exposed.

| `MCP_Expose_Extended_API` | Exposed tools                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **off** (default)         | **Minimal curated set** — a small hand-picked list (`post_chat_postMessage`, `get_chat_getMessage`, `post_channels_create`, `get_channels_list_joined`, `get_rooms_get`, `get_users_info`). |
| **on**                    | **Extended set** — the full catalog filtered by the `ALLOWED_TOOL_NAMES` allow-list (~100 routes), still excluding routes tagged `Missing Documentation`.         |

Both sets are built from registered typed-route metadata. The extended set filters generated base names through the allow-list, while the curated set filters routes through its smaller explicit list and supplies fallback descriptions where metadata is incomplete.

### Tool naming & variant expansion

A route's base tool name is `toolNameFor(path, method)` — e.g. `GET /api/v1/users.info` → `get_users_info`. Curated and extended catalogs use the same names, so enabling the extended catalog only adds tools.

When a route's request schema is a `oneOf`/`anyOf` of object sub-schemas with **distinct discriminators** (its `required` keys), each branch becomes its **own tool**, named `<base>_by_<discriminator>`:

- `chat.postMessage` → `post_chat_postMessage_by_channel`, `post_chat_postMessage_by_roomId`
- `users.info` → `get_users_info_by_userId`, `get_users_info_by_username`, `get_users_info_by_importId`, …

The allow-list is matched on the **base name**, so a single entry (`get_users_info`) admits all of that route's variants.

### Schema handling

MCP / the Anthropic tools API require each `inputSchema` to be a plain object schema and reject several JSON-Schema constructs. `mcpSafeSchema` normalizes a route's schema for the tool view (the REST validator is untouched):

- strips OpenAPI-only `nullable` and `not`;
- resolves `oneOf`/`anyOf`/`allOf` by adopting the first branch (so a value union like `string | string[]` keeps a concrete type, and a sub-schema union yields a clean object);
- forces a top-level `type: "object"`.

Tool **descriptions** are sourced from the route schema's own `description` (added in `rest-typings`), falling back to a per-route string.

## Dispatch

`tools/call` executes the target endpoint **as the authenticated user** via a loopback HTTP call to the local REST API (`http://127.0.0.1:<PORT><ROOT_URL_PATH_PREFIX>/api/v1/<route>`), forwarding:

- the caller's credential — `X-User-Id` + `X-Auth-Token` for a PAT, `Authorization: Bearer` for an OAuth access token — so all validation and permission checks run exactly as for a real REST client — **zero duplicated business logic**;
- `X-Real-IP` set to the resolved client address (`this.requestIp`), so the target endpoint's per-route rate limiter keys on the real client rather than the loopback address.

The REST response is wrapped as MCP `content` (`type: "text"`); a non-2xx REST response is returned with `isError: true`. Internal calls time out after 20 seconds. REST bodies and final encoded MCP responses are capped at 5 MiB; batched calls use bounded concurrency and share a single streaming body budget to limit retained response data.

## Rate limiting

The MCP endpoint uses Rocket.Chat's **built-in per-route rate limiter** with a limit of 60 requests per minute (enabled by `API_Enable_Rate_Limiter`, honoring `api-bypass-rate-limit`). Every tool call is also subject to its target REST endpoint's rate limit. The resolved client address is propagated to that endpoint rather than being counted as loopback traffic. MCP protocol requests are additionally bounded to 20 batch entries, four concurrent dispatches, 20-second calls, and a shared 5 MiB response budget. As with every Rocket.Chat API route, deployments behind a proxy must configure `HTTP_FORWARDED_COUNT` and trusted forwarding headers correctly.

## Settings

Registered under **Admin → AI Center → MCP** (`server/settings/ai.ts`):

| Setting                   | Default | Description                                                                                                                                       |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MCP_Enabled`             | `false` | Enables the `/api/v1/mcp` endpoint. Flagged **alpha** via an admin warning callout (`MCP_Alpha_Alert`).                                           |
| `MCP_Expose_Extended_API` | `false` | When on, exposes the extended allow-listed toolset instead of the minimal curated one. Gated behind `MCP_Enabled`. The full API is never exposed. |
| `OAuth2_Allow_Dynamic_Client_Registration` | `false` | Lets MCP clients register themselves as OAuth clients at `/oauth/register` ([Dynamic Client Registration](oauth2-server.md#dynamic-client-registration)). Requires the AI add-on and is gated behind `MCP_Enabled`. |

## Connecting a client

With OAuth, a client needs only the endpoint URL, `https://<host>/api/v1/mcp`. Either enable `OAuth2_Allow_Dynamic_Client_Registration` so the client registers itself, or create an OAuth app (Administration → Third-party login) with the client's redirect URI and enter its client ID and secret in the client. `Site_Url` must be the address the client uses to reach the workspace, since every discovery URL is built from it.

With a Personal Access Token:

```bash
claude mcp add --transport http rocketchat http://<host>/api/v1/mcp \
  --header "X-User-Id: <userId>" \
  --header "X-Auth-Token: <personalAccessToken>"
```

Raw smoke test:

```bash
H=(-H "Content-Type: application/json" -H "X-User-Id: <uid>" -H "X-Auth-Token: <token>")
curl -s "${H[@]}" http://localhost:3000/api/v1/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
curl -s "${H[@]}" http://localhost:3000/api/v1/mcp \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"post_chat_postMessage_by_channel","arguments":{"channel":"#general","text":"hello from MCP"}}}'
```

> The client **must** send `Content-Type: application/json` on POST — the shared router only parses the body for that content type.

## Limitations

- **Alpha**, off by default.
- Implements the handshake-based Streamable HTTP lifecycle through protocol version `2025-11-25`; newer lifecycle methods are not yet supported.
- Requires the **Rocket.Chat AI add-on** — both the route and the settings are gated by it.
- One HTTP response per POST. The `2025-03-26` compatibility revision accepts a bounded batch of up to 20 messages; later revisions accept one message per POST. There is no server-initiated SSE stream (`GET` → `405`).
- OAuth tokens carry no scopes, so there is no read-only OAuth access and no scope challenge.
- The official `@modelcontextprotocol/sdk` is intentionally not used; the files are structured so it can be dropped into the transport/server layer later for SSE and richer session handling.

## Key Files

| Layer                                                                        | File                                                                                               |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Hono route registration (`/api/v1/mcp`), `MCP_Enabled` gate, credential check | `apps/meteor/ee/server/api/mcp/index.ts`                                                           |
| Protected resource metadata (RFC 9728)                                       | `apps/meteor/ee/server/api/mcp/metadata.ts`                                                        |
| JSON-RPC handlers (`initialize`/`tools/list`/`tools/call`/…)                 | `apps/meteor/ee/server/api/mcp/server.ts`                                                          |
| Tool catalog (curated + extended allow-list, variants, schema normalization) | `apps/meteor/ee/server/api/mcp/catalog.ts`                                                         |
| Tool dispatch (loopback to REST as the user)                                 | `apps/meteor/ee/server/api/mcp/dispatch.ts`                                                        |
| License-gated permission seed (`access-mcp`)                                | `apps/meteor/ee/server/startup/mcp.ts`                                                             |
| EE module load                                                               | `apps/meteor/ee/server/api/index.ts`                                                               |
| Settings (license-gated)                                                     | `apps/meteor/server/settings/ai.ts`                                                                |
| License module                                                               | `packages/ai-search/src/constants.ts` (`AI_LICENSE_MODULE`)                                        |
| Schema descriptions reused as tool docs                                      | `packages/rest-typings/src/v1/chat.ts`, `packages/rest-typings/src/v1/users/UsersInfoParamsGet.ts` |
| i18n                                                                         | `packages/i18n/src/locales/en.i18n.json` (`MCP_*` keys)                                            |
