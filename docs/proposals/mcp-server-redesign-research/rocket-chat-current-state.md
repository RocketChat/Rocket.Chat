# Research: Rocket.Chat MCP server, current state

> Raw research notes. Collected on 2026-10-06 from the code at commit `0de406c` for [the MCP server redesign proposal](../mcp-server-redesign.md). The original text is kept. A *(changed, see update)* marker flags each claim that develop changed, and the [update of 2026-11-03](#update-2026-11-03) at the end gives the new state.
> Scope: the current MCP route, its tool catalog, its dispatch, and the workspace OAuth 2.0 server.

---

## Files

`apps/meteor/ee/server/api/mcp/` — 2037 lines in total, specs included *(changed, see update: `metadata.ts` is new, line counts not re-measured)*:

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
- Middleware order: `authenticationMiddlewareForHono` → rate limit → `permissionsMiddleware` → `license`. *(changed, see update)*
- Permission `access-mcp`, `hasAll` (line 176). Created on license load with the `admin` role only (`ee/server/startup/mcp.ts`).
- License module `AI_LICENSE_MODULE` from `@rocket.chat/ai-search` (line 178).
- Rate limit: 60 requests per 60 s on route `mcp` (line 45).
- Batch: max 20 messages, concurrency 4, only on protocol version `2025-03-26` (line 41, `transport.ts`).
- Response cap: 5 MiB per HTTP response (line 43) and per tool call (`dispatch.ts`).
- **PAT only:** `hasPersonalAccessToken` (line 62) looks up the hashed `X-Auth-Token` in the user's personal access tokens. Any other credential gets `-32001 Personal Access Token required` (line 47). The user is read from `X-User-Id`; a Bearer token is never considered on this route. *(changed, see update: OAuth Bearer tokens work since #43152)*
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
- Headers: `X-User-Id`, `X-Auth-Token` (the raw PAT), and `X-Real-IP` with the MCP client's address (line 108), so the REST rate limiter does not key every MCP call on `127.0.0.1`. *(changed, see update: an OAuth caller's Bearer token is forwarded instead of the PAT headers)*
- `GET`/`DELETE`: arguments become query-string values; non-string values are `JSON.stringify`-ed. `POST`/`PUT`: arguments become the JSON body.
- Timeout 20 s (line 14), `redirect: 'error'`, streamed body with the 5 MiB cap.
- Consequence: each tool call authenticates twice, passes the rate limiter twice (MCP route and REST route), and opens a local socket.

## In-process dispatch options (`packages/http-router`, `apps/meteor/server/api`)

- `Router.getHonoRouter()` (`packages/http-router/src/Router.ts`, line 439) returns the inner Hono app, so a synthetic `Request` can go to its `fetch` without a socket. *(changed, see update: the routers now mount on the root Hono app of the workspace's own HTTP server; this line was not re-checked)*
- The Hono context type declares `remoteAddress` (line 83). `remoteAddressMiddleware` sets it (registered in `apps/meteor/server/api/api.ts`, line 152).
- `remoteAddressMiddleware` (`server/api/v1/middlewares/remoteAddressMiddleware.ts`) reads `c.env.incoming.socket.remoteAddress` (or `c.env.server.incoming…`) without a guard. A synthetic request passed to `fetch` without that binding throws. The caller must supply an `incoming` binding or bypass the middleware and set `remoteAddress` itself.
- The same middleware prefers an `X-Real-IP` header over the socket address whenever the header is present. This is why the loopback dispatch can forward the client IP in `X-Real-IP`.
- Candidate lib functions for direct calls: `messageSearch` (`server/meteor-methods/messages/messageSearch.ts`), `executeSendMessage` (`server/meteor-methods/messages/sendMessage.ts`), `spotlightMethod` (`server/publications/spotlight.ts`), `findChannelAndPrivateAutocomplete` (`server/api/lib/rooms.ts`), and the AI search endpoint (`server/api/v1/ai-search.ts`, through `AISearch` in `@rocket.chat/core-services`).

## Workspace OAuth 2.0 server

- Library: `@node-oauth/oauth2-server` `~5.3.0` (`apps/meteor/package.json`).
- Routes (`apps/meteor/server/oauth2-server/oauth.ts`): `GET`/`POST /oauth/authorize`, `ALL /oauth/token`, plus `GET /oauth/userinfo` (`server/lib/auth/oauth2-server/oauth2-server.ts`). Mounted on `WebApp.connectHandlers` through Express.
- `POST /oauth/authorize` identifies the user with a Meteor login token sent in the form body (`access_token` or `token`) and needs `allow=yes`.
- Clients: `OAuthApps`, created by an admin. `redirectUri` is a comma-separated list. No dynamic client registration. *(changed, see update: DCR exists since #43151)*
- REST integration: `API.v1.addAuthMethod` (line 74) calls `oAuth2ServerAuth` (line 22), which accepts `Authorization: Bearer <token>` or `?access_token=`. So every REST route already accepts OAuth access tokens; only the MCP route refuses them. *(changed, see update: `oAuth2ServerAuth` is now at line 27, and the MCP route accepts Bearer tokens)*
- Model gaps (`apps/meteor/server/oauth2-server/model.ts`):
  - `saveAuthorizationCode` (line 129) stores `authCode`, `clientId`, `userId`, `expires`, `redirectUri` (line 157). It does not store `scope`, `codeChallenge` or `codeChallengeMethod`. *(changed, see update: PKCE fields are stored since #43149)*
  - `getAuthorizationCode` (line 97) returns no `scope` and no PKCE fields (line 123), so the library has no challenge to verify. *(changed, see update)*
  - `verifyScope` (line 26) compares the requested scope with the client's grant types, not with a granted scope.
  - Tokens (`saveToken`) store no scope and no audience/resource.
- No `/.well-known/oauth-authorization-server` and no `/.well-known/oauth-protected-resource` anywhere in `apps/meteor/server` (grep for `well-known` returned nothing). *(changed, see update: both documents exist since #43150 and #43152)*

## Internal sources consulted (not reproduced here)

Searched through the Atlassian connector. Their content is internal, so this public repository keeps only the titles:

- Confluence (RnD): "Rocket.Chat MCP Setup Guide: Enabling and Configuring Access"; "MCP Tool Catalog, Limits, and Understanding REST Operations in Rocket.Chat"; "The Sovereign Agentic Governance" (its System Console screenshot shows 12 tools on Mattermost's embedded MCP server); "R&D Roadmap Overview".
- Jira: PI-125 "[POC] Rocket.Chat as MCP Server"; CORE-2624, AI-56 and DOCS-1554 (the native MCP server); PI-168 "Agentic Runtime Hardening".

---

## Update 2026-11-03

Checked against develop at commit `2d02da8aad`. Paths are relative to `apps/meteor/` unless they say otherwise.

### Commits since the first collection

| Commit | Pull request | Change |
| --- | --- | --- |
| `863ba92f3c` | #43148 | `OAuthAuthCodes.upsertByAuthCode` replaces the inline code upsert. |
| `6b3ec3e667` | #43149 | PKCE: the model stores and returns `codeChallenge` and `codeChallengeMethod`. |
| `1232717dc3` | #43150 | RFC 8414 authorization-server metadata. |
| `0c244a62b0` | #43151 | Dynamic Client Registration at `POST /oauth/register`, behind a setting. |
| `4aa6d29b29` | #43152 | The MCP route accepts OAuth access tokens, sends the `401` challenge and serves RFC 9728 metadata. |
| `a299b0d3a0` | #43138 | REST answers `401` for a missing session and `403` for a missing permission. |
| `9d61165016` | #43281 | The workspace's own HTTP server serves HTTP and DDP instead of Meteor's. |
| `80223cb35a` | #42720 | AI Search experience: `ai.search` returns status flags and typed errors. |

### MCP route

- New file: `ee/server/api/mcp/metadata.ts` serves the RFC 9728 document at `/.well-known/oauth-protected-resource/api/v1/mcp` and at the bare path. Fields: `resource`, `authorization_servers`, `bearer_methods_supported: ['header']`. No `scopes_supported`.
- Middleware order (`index.ts:266-273`): REST authentication with `authRequired: false` → `mcpAuthenticationMiddleware` → rate limit → permissions → license.
- `unauthorizedResponse` (`index.ts:51-58`) returns `401` with `WWW-Authenticate: Bearer resource_metadata="<url>"`. It adds `error="invalid_token"` when the credential does not resolve.
- `readCredentials` (`index.ts:76-84`) prefers `X-User-Id` + `X-Auth-Token`, then `Authorization: Bearer`. `checkMcpCredentials` (`index.ts:94-106`) accepts a PAT or an OAuth token. A session token on `POST` gets `401` "Personal Access Token required". The route ignores an `?access_token=` query value.
- A missing `access-mcp` permission still gives `403`, and a missing AI license still gives `400`.
- The route counts the rate limit with `enforceRateLimitForRoute` and `registerRateLimiterForRoute` (`server/api/ApiClass.ts:470-502`).
- `access-mcp` still goes to `admin` only (`ee/server/startup/mcp.ts:6`).
- No `@modelcontextprotocol/*` package is a dependency. `catalog.ts`, `server.ts` and `transport.ts` still exist.

### Dispatch

- `dispatch.ts:96-102` still fetches `http://127.0.0.1:${PORT}${ROOT_URL_PATH_PREFIX}`.
- `dispatch.ts:104-110` forwards the PAT headers, or `Authorization: Bearer` for an OAuth caller, and still sets `X-Real-IP`.
- `remoteAddressMiddleware` still prefers `X-Real-IP` over the socket address (`remoteAddressMiddleware.ts:14`), and still throws without an `incoming` binding.
- `authenticationHono.ts:24` still authenticates every request again.
- The REST rate limit runs in the action wrapper at `server/api/ApiClass.ts:809`.
- Since #43281 the REST routers mount on the root Hono app (`server/api/api.ts:113-160`), and `env.incoming` comes from the workspace's own Node server (`server/api/router.ts`). A synthetic `Request` still has no `incoming` binding.

### Workspace OAuth 2.0 server

- `oAuth2ServerAuth` is at `server/lib/auth/oauth2-server/oauth2-server.ts:27`. It still ignores scope, audience, client and the `active` state of the app.
- PKCE: `getAuthorizationCode` returns the challenge (`model.ts:124`), and `saveAuthorizationCode` stores it through `OAuthAuthCodes.upsertByAuthCode` (`model.ts:150-156`). A request without a challenge still works. `code_challenge_methods_supported` is `['S256']`. The code path that rejects `plain` was not located.
- RFC 8414 (`server/oauth2-server/metadata.ts:17-27`): `issuer`, the authorize, token and registration endpoints, the supported response types, grant types and token endpoint auth methods, and `code_challenge_methods_supported`. No `revocation_endpoint`, no `authorization_response_iss_parameter_supported`, no `scopes_supported`. `registration_endpoint` is advertised also when registration is off.
- Dynamic Client Registration (`oauth2-server.ts:96`, `registerOAuthClient.ts`):
  - Setting `OAuth2_Allow_Dynamic_Client_Registration` (`server/settings/ai.ts:220`), default `false`. Needs the AI add-on and `MCP_Enabled`. When off, it answers `403 access_denied`.
  - It creates an active confidential app, created by `oauth-dynamic-client-registration`, with a non-expiring `client_secret`.
  - Input: 1 to 10 `redirect_uris`, the `authorization_code` and `refresh_token` grants, the `code` response type. It registers `token_endpoint_auth_method: none` as `client_secret_basic`. It accepts `http` on a loopback host, with the exact port.
  - A rate limit for each IP, with `trust proxy` = `HTTP_FORWARDED_COUNT || 0` (`oauth2-server.ts:79-94`). `docs/features/oauth2-server.md` says the default is `1`; the two disagree.
- `requireClientSecret` (`oauth.ts:109`) rejects a token request without a secret, for every client. `getClient` (`model.ts:72`) still returns an active client when no secret is sent.
- Still open: no `clientType`, `addOAuthApp` always creates a secret, exact redirect URI match, no scope or `resource` on codes and tokens (`saveToken`, `model.ts:187-195`), no `iss`, no revocation endpoint, no CIMD.
- Still open bugs: `revokeToken` and `revokeAuthorizationCode` (`model.ts:254-279`) always return `true`. `getAuthorizationCode` throws on an unknown code (`model.ts:104`), and `getClient` and `getRefreshToken` throw the same way. `/oauth/token` has no rate limit and a 50 MB body limit (`oauth.ts:36`).
- The consent text still says "full, unrestricted access" (`OAuth_Full_Access_Warning`).

### Agent bot foundations

- `validateUserRoles.ts:17-22` (`ee/server/lib/authorization/`) still exempts `bot` and `app` users from the seat count.
- `server/lib/auth/startup.js:410-414` still blocks the login of an `app` user.

### AI search

- `server/api/v1/ai-search.ts:290-320`: when an enabled and configured search fails, `ai.search` throws a typed `error-ai-search-*` error (`isIntelligentSearchErrorCode`). Before, it returned `[]`. When search is not licensed, enabled or configured, it returns empty results with `meta.intelligentSearchEnabled` and `meta.intelligentSearchConfigured`.

### Jira

- PI-125 "[POC] Rocket.Chat as MCP Server": Done. The first server shipped in PR #41082.
- CORE-2624 "feat(api): native MCP server": Cancelled, resolution "Won't Do", on 2026-09-01.
- PI-168: the Atlassian connector returns "does not exist or no permission" for this account. Not verified.

### Not re-checked

The file line counts, `catalog.ts` and its route counts, `server.ts`, the origin check in `transport.ts`, `Router.getHonoRouter()`, where the Express OAuth routes mount after #43281, and the 2FA path in the action wrapper.
