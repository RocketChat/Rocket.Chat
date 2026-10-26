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
| GET, HEAD | `/.well-known/oauth-authorization-server` | Authorization server metadata (RFC 8414). Under a path prefix, followed by that path (see below).      |

The consent form posts back to the authorize URL itself, so the parameters the client put in that URL (`state`, `scope`, `code_challenge`, `code_challenge_method`) reach the server with the form.

## Client authentication

Every client is **confidential**: it holds a client secret and must send it to the token endpoint, as HTTP Basic credentials (`client_secret_basic`) or as `client_secret` in the body (`client_secret_post`). This holds for PKCE requests too. The library would otherwise accept a code verifier instead of the secret, which would let anyone holding a client's authorization code redeem it with a verifier of their own. There are no public clients.

## PKCE

An authorization request may carry a PKCE challenge (RFC 7636). Only `S256` is accepted. The challenge is stored with the authorization code, and the token request must then carry the matching `code_verifier`. A wrong verifier consumes the code. Authorization requests without a challenge work as before.

## Metadata

`/.well-known/oauth-authorization-server` describes the server to clients that discover it, such as MCP clients. The issuer is the workspace's full URL (`Site_Url` with the `ROOT_URL_PATH_PREFIX` path, without a trailing slash), and every endpoint is built from it. The document advertises the `code` response type, the `authorization_code` and `refresh_token` grants, the two secret-based client authentication methods, and `S256`.

The document is served where RFC 8414 puts it: the well-known segment goes between the host and the issuer's path. A workspace at `https://example.com/chat` serves it at `https://example.com/.well-known/oauth-authorization-server/chat`, outside its own path, so a reverse proxy in front of it must forward that path to the workspace.

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
| Server instance, `userinfo` and metadata routes, REST Bearer authentication | `apps/meteor/server/lib/auth/oauth2-server/oauth2-server.ts`                                      |
| Consent page                                                  | `apps/meteor/client/views/oauth/`                                                                                          |
