# MCP Server (Model Context Protocol)

> **Status: Alpha.** Off by default. The feature may change or be removed in future releases.

## Overview

The MCP server exposes the Rocket.Chat REST API to [Model Context Protocol](https://modelcontextprotocol.io) clients (Claude Desktop/Code, IDE agents, custom agents). It speaks **JSON-RPC 2.0 over Streamable HTTP** and turns existing REST endpoints into MCP **tools**, so an AI client can drive a workspace (post messages, search, manage rooms, look up users, …) using the user's own credentials and permissions.

It is **enterprise (protected) code** under `apps/meteor/ee/`. The design goal is _native + minimum changes_: it reuses the existing REST middleware chain (auth, rate limiting, remote-address resolution, CORS, logging, metrics) and the API's already-generated typed-route metadata instead of re-implementing any of it. There is **no new runtime dependency** — the JSON-RPC layer is implemented directly.

## Endpoint

| Method | Endpoint | Behavior |
|--------|----------|----------|
| POST | `/api/v1/mcp` | JSON-RPC 2.0 request (single message or batch array). Response is `application/json`. |
| GET | `/api/v1/mcp` | `405` — this transport does not offer a server-initiated SSE stream (spec-compliant "no stream"). |

The endpoint is registered as an ordinary API route via `API.v1.addRoute('mcp', { authRequired: true }, …)`, so it flows through the same middleware as every other REST endpoint. When `MCP_Enabled` is off the action returns `404`.

## Request lifecycle

The MCP handshake is the standard JSON-RPC flow:

1. **`initialize`** — client and server exchange protocol version + capabilities. The server echoes the client's `protocolVersion` (default `2024-11-05`), advertises `{ tools: { listChanged: false } }`, and returns an `Mcp-Session-Id` header.
2. **`tools/list`** — returns the available tools (name, description, `inputSchema`).
3. **`tools/call`** — runs a tool by name with arguments and returns its result as `content`.

Also handled: `ping`, and the `notifications/initialized` / `notifications/cancelled` notifications (acknowledged with `202`, no body).

## Authentication

Authentication is **reused from the REST layer** — no MCP-specific credential type:

- The client sends a **Personal Access Token** as `X-User-Id` + `X-Auth-Token` headers on every request (including `initialize`), because the route is `authRequired: true`.
- The standard auth middleware resolves the user; the action reads `this.user` / `this.userId`. A missing/invalid token yields `401` before any MCP logic runs.
- Every MCP action additionally requires the **`access-mcp`** permission (`permissionsRequired: ['access-mcp']`), enforced by the standard permissions middleware. Without it the request is rejected with `403`. The permission is granted to `admin` by default; admins can grant it to other roles from the Permissions admin page.

> When creating the PAT, tick **"Ignore Two Factor Authentication"**, otherwise header auth is rejected with a 2FA challenge.

## Licensing

The feature is gated behind the **`experimental-enterprise-features` license module** (defined in `packages/core-typings/src/license/LicenseModule.ts`):

- The route is registered with `license: ['experimental-enterprise-features']`, so requests are rejected unless the workspace license includes the module.
- The `MCP_*` settings are registered under `this.with({ enterprise: true, modules: ['experimental-enterprise-features'] }, …)` with `invalidValue: false`, so without the module they fall back to **off** and the feature cannot be enabled.

## Tool catalog

Two **bounded** sets are exposed, selected by the `MCP_Expose_Extended_API` setting. The full unfiltered API is **never** exposed.

| `MCP_Expose_Extended_API` | Exposed tools |
|---|---|
| **off** (default) | **Minimal curated set** — a small hand-picked list (`chat_postMessage`, `chat_getMessage`, `channels_create`, `channels_list_joined`, `rooms_get`, `users_info`). |
| **on** | **Extended set** — the full catalog filtered by the `ALLOWED_TOOL_NAMES` allow-list (~100 routes), still excluding routes tagged `Missing Documentation`. |

Both sets are built by the same walker (`collectTools(isRouteAllowed)`); the curated set additionally covers a few legacy endpoints (e.g. `channels.create`) that have no typed schema.

### Tool naming & variant expansion

A route's base tool name is `toolNameFor(path, method)` — e.g. `GET /api/v1/users.info` → `get_users_info` (the `v1` REST endpoints used by the curated set keep their short names like `users_info`).

When a route's request schema is a `oneOf`/`anyOf` of object sub-schemas with **distinct discriminators** (its `required` keys), each branch becomes its **own tool**, named `<base>_by_<discriminator>`:

- `chat.postMessage` → `chat_postMessage_by_channel`, `chat_postMessage_by_roomId`
- `users.info` → `users_info_by_userId`, `users_info_by_username`, `users_info_by_importId`, …

The allow-list is matched on the **base name**, so a single entry (`get_users_info`) admits all of that route's variants.

### Schema handling

MCP / the Anthropic tools API require each `inputSchema` to be a plain object schema and reject several JSON-Schema constructs. `mcpSafeSchema` normalizes a route's schema for the tool view (the REST validator is untouched):

- strips OpenAPI-only `nullable` and `not`;
- resolves `oneOf`/`anyOf`/`allOf` by adopting the first branch (so a value union like `string | string[]` keeps a concrete type, and a sub-schema union yields a clean object);
- forces a top-level `type: "object"`.

Tool **descriptions** are sourced from the route schema's own `description` (added in `rest-typings`), falling back to a per-route string.

## Dispatch

`tools/call` executes the target endpoint **as the authenticated user** via a loopback HTTP call to the local REST API (`http://127.0.0.1:<PORT>/api/v1/<route>`), forwarding:

- `X-User-Id` + `X-Auth-Token` (the caller's PAT), so all validation and permission checks run exactly as for a real REST client — **zero duplicated business logic**;
- `X-Real-IP` set to the resolved client address (`this.requestIp`), so the target endpoint's per-route rate limiter keys on the real client rather than the loopback address.

The REST JSON body is wrapped as MCP `content` (`type: "text"`); a non-2xx REST response is returned with `isError: true`.

## Rate limiting

The endpoint reuses Rocket.Chat's **built-in per-route rate limiter** (enabled by `API_Enable_Rate_Limiter`, honoring `api-bypass-rate-limit`). Because the route runs through `remoteAddressMiddleware`, the limiter keys on the correctly-resolved client IP; the loopback dispatch propagates that same IP to each target endpoint's limiter.

## Settings

Registered under **Admin → General → MCP** (EE settings, `ee/server/settings/mcp.ts`):

| Setting | Default | Description |
|---------|---------|-------------|
| `MCP_Enabled` | `false` | Enables the `/api/v1/mcp` endpoint. Flagged **alpha** via an admin warning callout (`MCP_Alpha_Alert`). |
| `MCP_Expose_Extended_API` | `false` | When on, exposes the extended allow-listed toolset instead of the minimal curated one. Gated behind `MCP_Enabled`. The full API is never exposed. |

## Connecting a client

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
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"chat_postMessage","arguments":{"channel":"#general","text":"hello from MCP"}}}'
```

> The client **must** send `Content-Type: application/json` on POST — the shared router only parses the body for that content type.

## Limitations

- **Alpha**, off by default.
- Requires the **`experimental-enterprise-features` license module** — both the route and the settings are gated by it.
- Single request/response per POST; no server-initiated SSE stream (`GET` → `405`).
- The official `@modelcontextprotocol/sdk` is intentionally not used; the files are structured so it can be dropped into the transport/server layer later for SSE and richer session handling.

## Key Files

| Layer | File |
|-------|------|
| Route registration (`/api/v1/mcp`) + `MCP_Enabled` gate | `ee/app/api-enterprise/server/mcp/index.ts` |
| JSON-RPC handlers (`initialize`/`tools/list`/`tools/call`/…) | `ee/app/api-enterprise/server/mcp/server.ts` |
| Tool catalog (curated + extended allow-list, variants, schema normalization) | `ee/app/api-enterprise/server/mcp/catalog.ts` |
| Tool dispatch (loopback to REST as the user) | `ee/app/api-enterprise/server/mcp/dispatch.ts` |
| Permission seed (`access-mcp`) | `ee/app/api-enterprise/server/mcp/permissions.ts` |
| EE module load | `ee/app/api-enterprise/server/index.ts` |
| Settings (license-gated) | `ee/server/settings/mcp.ts` (registered via `ee/server/startup/mcp.ts`) |
| License module (`experimental-enterprise-features`) | `packages/core-typings/src/license/LicenseModule.ts` |
| Schema descriptions reused as tool docs | `packages/rest-typings/src/v1/chat.ts`, `packages/rest-typings/src/v1/users/UsersInfoParamsGet.ts` |
| i18n | `packages/i18n/src/locales/en.i18n.json` (`MCP_*` keys) |
