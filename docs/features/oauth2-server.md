# OAuth2 authorization server

## Overview

A workspace is an OAuth 2.0 authorization server for third-party applications. An application is registered as an **OAuth app** (Administration → Third-party login), a user signs in to the workspace and approves it, and the application exchanges the resulting authorization code for an access token. The access token is a Bearer credential for the REST API (`Authorization: Bearer <token>`).

The protocol work is done by `@node-oauth/oauth2-server`; the workspace supplies its storage model and the HTTP routes around it.

## Endpoints

| Method | Path                                      | Purpose                                                                                                   |
| ------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| GET    | `/oauth/authorize`                        | Checks the client and redirect URI, then shows the consent page.                                          |
| POST   | `/oauth/authorize`                        | The consent page's form. Issues an authorization code and redirects to the client.                       |
| POST   | `/oauth/token`                            | `authorization_code` and `refresh_token` grants.                                                          |
| GET    | `/oauth/userinfo`                         | Profile of the token's user.                                                                              |
| POST   | `/oauth/register`                         | Dynamic Client Registration (RFC 7591), when the workspace allows it.                                     |
| GET, HEAD | `/.well-known/oauth-authorization-server` | Authorization server metadata (RFC 8414). Under a path prefix, followed by that path (see below).      |

The consent form posts back to the authorize URL itself, so the parameters the client put in that URL (`state`, `scope`, `code_challenge`, `code_challenge_method`) reach the server with the form.

## Client authentication

Every client is **confidential**: it holds a client secret and must send it to the token endpoint, as HTTP Basic credentials (`client_secret_basic`) or as `client_secret` in the body (`client_secret_post`). This holds for PKCE requests too. The library would otherwise accept a code verifier instead of the secret, which would let anyone holding a client's authorization code redeem it with a verifier of their own. There are no public clients.

## PKCE

An authorization request may carry a PKCE challenge (RFC 7636). Only `S256` is accepted. The challenge is stored with the authorization code, and the token request must then carry the matching `code_verifier`. A wrong verifier consumes the code. Authorization requests without a challenge work as before.

## Metadata

`/.well-known/oauth-authorization-server` describes the server to clients that discover it, such as MCP clients. The issuer is the workspace's full URL (`Site_Url` with the `ROOT_URL_PATH_PREFIX` path, without a trailing slash), and every endpoint is built from it. The document advertises the `code` response type, the `authorization_code` and `refresh_token` grants, the two secret-based client authentication methods, and `S256`.

The document is served where RFC 8414 puts it: the well-known segment goes between the host and the issuer's path. A workspace at `https://example.com/chat` serves it at `https://example.com/.well-known/oauth-authorization-server/chat`, outside its own path, so a reverse proxy in front of it must forward that path to the workspace.

`registration_endpoint` is advertised whether or not registration is allowed. A client that finds no registration endpoint guesses one (MCP clients fall back to `POST /register`, which the workspace answers with an empty `405`); pointing it at `/oauth/register` gets it an explanation instead.

## Dynamic Client Registration

`POST /oauth/register` lets an application register itself (RFC 7591) without an administrator. It exists for MCP clients, so it is controlled by the **`OAuth2_Allow_Dynamic_Client_Registration`** setting on the MCP settings page (Administration → Settings → AI Center → MCP), **off by default**, and it needs what MCP needs: the Rocket.Chat AI add-on (`chat.rocket.rc-ai`) and `MCP_Enabled`. Without the add-on the setting falls back to off.

- **Off** (the setting, MCP, or the AI add-on): the endpoint answers `403` with `access_denied` and a description of what registration needs, and that an administrator can instead create an OAuth app and hand its client ID and secret to the client.
- **On:** the request is validated and an active OAuth app is created. The response carries the new `client_id` and `client_secret` (which does not expire) and the registered metadata.

What a registration may ask for:

| Field                        | Accepted                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `redirect_uris`              | 1 to 10 absolute URIs of up to 2048 characters, without whitespace, a comma or a fragment: `https`, `http` on a loopback host, or the private-use scheme of a native app. Schemes the browser or system handles itself (`ftp:`, `file:`, `ws:`, `mailto:`, `javascript:`, `data:` and the like) are refused. |
| `grant_types`                | A subset of `authorization_code`, `refresh_token`.                                                                                                           |
| `response_types`             | `code`.                                                                                                                                                        |
| `token_endpoint_auth_method` | `client_secret_basic` (default) or `client_secret_post`. A client asking for `none` is registered with `client_secret_basic` and gets a secret anyway.          |
| `client_name`                | Up to 100 characters. Without one, the app is named after the host of its first redirect URI, or after the URI itself when it has no host (a native app's scheme), cut to 100 characters. |

Registered apps appear in Administration → Third-party login with the creator `oauth-dynamic-client-registration`, where an administrator can deactivate or delete them.

When enabled, anyone who can reach the workspace can create OAuth apps. Each user still signs in and approves an app before it gets a token, but the app's name on the consent page is whatever the client registered. Registrations are rate limited like the rest of the API (`API_Enable_Rate_Limiter`), at `API_Enable_Rate_Limiter_Limit_Calls_Default` per minute for each client address. The client address is resolved with `HTTP_FORWARDED_COUNT`, as for the REST API. It defaults to `1`, one reverse proxy; set it to the actual number of proxies, and to `0` when clients reach the workspace directly, since otherwise each client can pick its own address with `X-Forwarded-For` and get a fresh limit.

## Limitations

- Tokens carry no scope and no audience: any access token gives full REST access as its user, whichever app it was issued to. The consent page says so.
- There is no revocation endpoint. Deactivating an OAuth app does not revoke the tokens already issued to it.
- Redirect URIs match exactly, including the port of a loopback redirect.

## Key files

| Layer                                                         | File                                                                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Routes on top of the library (authorize, token)               | `apps/meteor/server/oauth2-server/oauth.ts`                                                                                |
| Storage model (clients, codes, tokens, PKCE challenge)        | `apps/meteor/server/oauth2-server/model.ts`                                                                                |
| Metadata document, issuer and its well-known route            | `apps/meteor/server/oauth2-server/metadata.ts`                                                                             |
| Server instance, `userinfo` and registration routes, REST Bearer authentication | `apps/meteor/server/lib/auth/oauth2-server/oauth2-server.ts`                                  |
| Dynamic Client Registration                                   | `apps/meteor/server/lib/auth/oauth2-server/registerOAuthClient.ts`                                                         |
| Registration setting (MCP page, AI add-on)                    | `apps/meteor/server/settings/ai.ts`                                                                                        |
| Consent page                                                  | `apps/meteor/client/views/oauth/`                                                                                          |
