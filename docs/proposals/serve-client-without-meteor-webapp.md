# Proposal: serve the web client without Meteor's `web.browser` program

Status: proposed, not implemented.

## Context

The web client is built by Vite and the server serves it from `public/bundle`
([features/web-client-hosting.md](../features/web-client-hosting.md)). Meteor still builds an empty `web.browser`
program, only so that its page, its runtime config and its static file handling keep working. That program still
ships about 60 KB of Meteor runtime (`meteor`, `modules-runtime`, `ecmascript-runtime-client`, `ejson`, `logging`,
`base64`) that the page loads and never uses.

## Proposal

Stop building `web.browser` and make the server own what hangs off it today:

- **The page.** `packages/meteor-inject-initial` rewrites Meteor's page when it starts with `<!DOCTYPE html>`. Replace
  it with a template rendered from `vite/dist/index.html`, plus the `server/lib/ui-master` head and body injections.
- **The runtime config.** Serve `__meteor_runtime_config__` (`ROOT_URL`, `ROOT_URL_PATH_PREFIX`, the client version)
  from a server route, external when the Content-Security-Policy is on, with the hash check
  `server/lib/cors/cors.ts` does for `/meteor_runtime_config.js`. Keep updating `ROOT_URL` from `Site_Url`
  (`server/configuration/configureBoilerplate.ts`).
- **Static files.** Serve `public/` with the headers `cors.ts` adds today (`Access-Control-Allow-Origin`, the cache
  version cookie and `Clear-Site-Data`), and move the `/assets/*` default fallback
  (`server/lib/media/assets/assets.ts`) off `WebAppInternals.staticFilesByArch`.
- **Livechat.** Serve the widget files and `/packages/rocketchat_livechat/assets/demo.html`, whose script hash is
  allowed in the Content-Security-Policy.
- **New-version notice.** Publish `meteor_autoupdate_clientVersions` with a version computed from the Vite manifest,
  in the monolith and through `server/services/meteor/service.ts` and `ee/apps/ddp-streamer` for microservices.
- **CDN.** Prefix the bundle without `WebAppInternals.setBundledJsCssPrefix`.
- **`/_timesync`** registers before the path prefix is stripped, so it must learn about the prefix.

## Risks

Each item replaces Meteor behavior that production relies on today, so each needs a side-by-side check against the
current page and headers. The livechat widget and the path prefix are the least covered by e2e tests.
