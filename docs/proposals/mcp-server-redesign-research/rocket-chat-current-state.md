# Research: Rocket.Chat MCP server, current state

> Raw research notes, kept unedited. Collected on 2026-10-06 from the code at commit `0de406c` for [the MCP server redesign proposal](../mcp-server-redesign.md).
> Scope: the current MCP route, its tool catalog, its dispatch, and the workspace OAuth 2.0 server.

---

## Files

`apps/meteor/ee/server/api/mcp/` — 2037 lines in total, specs included:

| File | Lines |
| --- | --- |
| `catalog.ts` | 420 |
| `catalog.spec.ts` | 235 |
| `dispatch.ts` | 147 |
| `dispatch.spec.ts` | 156 |
| `index.ts` | 256 |
| `index.spec.ts` | 377 |
| `server.ts` | 150 |
| `server.spec.ts` | 174 |
| `transport.ts` | 52 |
| `transport.spec.ts` | 63 |
| `apps/meteor/ee/server/startup/mcp.ts` | 7 |

## Route and gating (`index.ts`)

- `POST /api/v1/mcp` and `GET /api/v1/mcp` on the Hono router. `GET` always returns `405` (`Allow: POST`). No SSE stream.
- Middleware order: `authenticationMiddlewareForHono` → rate limit → `permissionsMiddleware` → `license`.
- Permission `access-mcp`, `hasAll` (line 176). Created on license load with the `admin` role only (`ee/server/startup/mcp.ts`).
- License module `AI_LICENSE_MODULE` from `@rocket.chat/ai-search` (line 178).
- Rate limit: 60 requests per 60 s on route `mcp` (line 45).
- Batch: max 20 messages, concurrency 4, only on protocol version `2025-03-26` (line 41, `transport.ts`).
- Response cap: 5 MiB per HTTP response (line 43) and per tool call (`dispatch.ts`).
- **PAT only:** `hasPersonalAccessToken` (line 62) looks up the hashed `X-Auth-Token` in the user's personal access tokens. Any other credential gets `-32001 Personal Access Token required` (line 47). The user is read from `X-User-Id`; a Bearer token is never considered on this route.
- Settings (`apps/meteor/server/settings/ai.ts`): `MCP_Enabled` (line 193, default `false`, alert `MCP_Alpha_Alert`), `MCP_Expose_Extended_API` (line 206, default `false`, alert `MCP_Extended_API_Alert`).
- Origin check (`transport.ts`): no `Origin` header is accepted; a browser origin must match `Site_Url` or the `API_CORS_Origin` list; `*` is refused.
- Protocol versions: `2025-11-25`, `2025-06-18`, `2025-03-26`.

## Protocol handling (`server.ts`)

- Methods: `initialize`, `notifications/initialized`, `notifications/cancelled`, `ping`, `tools/list`, `tools/call`. Nothing else.
- Capabilities: `{ tools: { listChanged: false } }`. No resources, no prompts, no `instructions`.
- `tools/list` returns the extended set when `MCP_Expose_Extended_API` is on (line 63), the curated set otherwise.
- `tools/call` result: one text block with `JSON.stringify(dispatch.body)` (line 133) — the raw REST response body.

## Tool catalog (`catalog.ts`)

- `CURATED` (line 17), 6 routes:
  - `POST /api/v1/chat.postMessage`
  - `GET /api/v1/chat.getMessage`
  - `POST /api/v1/channels.create`
  - `GET /api/v1/channels.list.joined`
  - `GET /api/v1/rooms.get`
  - `GET /api/v1/users.info`
- `ALLOWED_TOOL_NAMES` (line 47): 93 active route names, plus 6 commented out (`post_chat_delete`, `post_custom_user_status_delete`, `post_dm_delete`, `post_rooms_delete`, `post_teams_delete`, `post_uploads_delete`).
- Groups in the allow-list: chat reads (11), custom user status read (1), DM reads (7), `me` (1), room reads (8), spotlight (1), subscription reads (2), team reads (8), user reads (7), chat writes (11), custom user status writes (2), DM writes (5, including `post_im_blockUser`), room writes (13), subscription writes (2), team writes (10), user writes (4, including `post_users_create` and `post_users_update`).
- Tool name = `<method>_<path slug>`, for example `get_chat_getThreadMessages`.
- A route whose request schema is a `oneOf`/`anyOf` of object branches with distinct `required` keys splits into one tool per branch, named `<base>_by_<required keys>` (`variantsForRoute`, line 279; `fitToolName`, line 305). So the extended tool count is higher than 93. The spec asserts two tools for `get_dm_files` alone (`catalog.spec.ts`, line 206). The exact total was not computed, because that needs a running server with all routes registered.
- Input schema = the route's AJV request schema, rewritten by `mcpSafeSchema` (line 181): `nullable` and `not` removed, `oneOf`/`anyOf`/`allOf` replaced by the first branch.
- Description = the route schema's `description`, else a fallback such as `GET /api/v1/rooms.info (Rooms)`.
- The extended set (`getExtendedTools`, line 410) = curated tools + every allow-listed route that is not tagged `Missing Documentation`.

## Dispatch (`dispatch.ts`)

- Loopback HTTP: `fetch` (line 135) to `http://127.0.0.1:${process.env.PORT || '3000'}${ROOT_URL_PATH_PREFIX}` (lines 96–102).
- Headers: `X-User-Id`, `X-Auth-Token` (the raw PAT), and `X-Real-IP` with the MCP client's address (line 108), so the REST rate limiter does not key every MCP call on `127.0.0.1`.
- `GET`/`DELETE`: arguments become query-string values; non-string values are `JSON.stringify`-ed. `POST`/`PUT`: arguments become the JSON body.
- Timeout 20 s (line 14), `redirect: 'error'`, streamed body with the 5 MiB cap.
- Consequence: each tool call authenticates twice, passes the rate limiter twice (MCP route and REST route), and opens a local socket.

## In-process dispatch options (`packages/http-router`, `apps/meteor/server/api`)

- `Router.getHonoRouter()` (`packages/http-router/src/Router.ts`, line 439) returns the inner Hono app, so a synthetic `Request` can go to its `fetch` without a socket.
- The Hono context type declares `remoteAddress` (line 83). `remoteAddressMiddleware` sets it (registered in `apps/meteor/server/api/api.ts`, line 152).
- `remoteAddressMiddleware` (`server/api/v1/middlewares/remoteAddressMiddleware.ts`) reads `c.env.incoming.socket.remoteAddress` (or `c.env.server.incoming…`) without a guard. A synthetic request passed to `fetch` without that binding throws. The caller must supply an `incoming` binding or bypass the middleware and set `remoteAddress` itself.
- The same middleware prefers an `X-Real-IP` header over the socket address whenever the header is present. This is why the loopback dispatch can forward the client IP in `X-Real-IP`.
- Candidate lib functions for direct calls: `messageSearch` (`server/meteor-methods/messages/messageSearch.ts`), `executeSendMessage` (`server/meteor-methods/messages/sendMessage.ts`), `spotlightMethod` (`server/publications/spotlight.ts`), `findChannelAndPrivateAutocomplete` (`server/api/lib/rooms.ts`), and the AI search endpoint (`server/api/v1/ai-search.ts`, through `AISearch` in `@rocket.chat/core-services`).

## Workspace OAuth 2.0 server

- Library: `@node-oauth/oauth2-server` `~5.3.0` (`apps/meteor/package.json`).
- Routes (`apps/meteor/server/oauth2-server/oauth.ts`): `GET`/`POST /oauth/authorize`, `ALL /oauth/token`, plus `GET /oauth/userinfo` (`server/lib/auth/oauth2-server/oauth2-server.ts`). Mounted on `WebApp.connectHandlers` through Express.
- `POST /oauth/authorize` identifies the user with a Meteor login token sent in the form body (`access_token` or `token`) and needs `allow=yes`.
- Clients: `OAuthApps`, created by an admin. `redirectUri` is a comma-separated list. No dynamic client registration.
- REST integration: `API.v1.addAuthMethod` (line 74) calls `oAuth2ServerAuth` (line 22), which accepts `Authorization: Bearer <token>` or `?access_token=`. So every REST route already accepts OAuth access tokens; only the MCP route refuses them.
- Model gaps (`apps/meteor/server/oauth2-server/model.ts`):
  - `saveAuthorizationCode` (line 129) stores `authCode`, `clientId`, `userId`, `expires`, `redirectUri` (line 157). It does not store `scope`, `codeChallenge` or `codeChallengeMethod`.
  - `getAuthorizationCode` (line 97) returns no `scope` and no PKCE fields (line 123), so the library has no challenge to verify.
  - `verifyScope` (line 26) compares the requested scope with the client's grant types, not with a granted scope.
  - Tokens (`saveToken`) store no scope and no audience/resource.
- No `/.well-known/oauth-authorization-server` and no `/.well-known/oauth-protected-resource` anywhere in `apps/meteor/server` (grep for `well-known` returned nothing).

## Internal sources consulted (not reproduced here)

Searched through the Atlassian connector. Their content is internal, so this public repository keeps only the titles:

- Confluence (RnD): "Rocket.Chat MCP Setup Guide: Enabling and Configuring Access"; "MCP Tool Catalog, Limits, and Understanding REST Operations in Rocket.Chat"; "The Sovereign Agentic Governance" (its System Console screenshot shows 12 tools on Mattermost's embedded MCP server); "R&D Roadmap Overview".
- Jira: PI-125 "[POC] Rocket.Chat as MCP Server"; CORE-2624, AI-56 and DOCS-1554 (the native MCP server); PI-168 "Agentic Runtime Hardening".
