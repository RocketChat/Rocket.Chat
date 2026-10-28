# The web client is built by Vite and served by the Rocket.Chat server

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** `apps/meteor/vite`, `apps/meteor/server/lib/ui-master`, `apps/meteor/server/lib/cors`, the `build:ci`
  pipeline and the Docker images

## Decision

Vite (Rolldown) builds the web client, and Meteor no longer compiles it. `yarn build:client` writes the client to
`public/bundle` and its manifest to `private/vite-manifest.json`. The Rocket.Chat server keeps rendering the page and
adds the client's entry, stylesheets and preloads from the manifest
([features/web-client-hosting.md](../features/web-client-hosting.md)). `yarn dev` runs Vite in front of the local
server.

The server stays the host, and Meteor builds only the server. The server renders the page with everything it already
injects into it (title, metas, theme variables, custom CSS and scripts, `<base>`), sends the Content-Security-Policy,
publishes the new-version notice, and serves the bundle under the same CDN or path prefix it used for Meteor's.

The server build of the client:

- uses a relative `base`, so chunks, fonts and images resolve from wherever the entry loads;
- emits hidden source maps. The maps are generated and kept in the build tarball, but no chunk references them, and
  the Docker images ship without them;
- serves `/bundle/*` as immutable, and answers a file missing from the build with an uncached 404 instead of the page.

## Why

- Since #42979 the client uses no Meteor client package at runtime. Meteor's bundler cost build time and, through
  `dynamic-import`, a request protocol of its own, for a client that no longer needed either.
- Vite gives the client a dev server with HMR, code splitting the client controls, and one build that the server
  serves and that can also be hosted elsewhere.
- Keeping the server as the host leaves production behavior unchanged. Every per-workspace setting that shapes the
  page keeps working: theme, custom scripts and CSS, CSP, CDN, path prefix and the reload notice.

Rejected alternatives:

- **Keep Meteor's bundler.** It ties the client to Meteor's release cycle and module runtime, which the client no
  longer uses.
- **rspack through Meteor's bundler integration.** Tried in #42862 and abandoned; the client still went through
  Meteor's build.
- **Serve the client as a static site in front of the server.** It loses the per-workspace page the server renders,
  so every deployment would need its own reverse proxy and page template. The standalone build remains possible for
  hosts that want it ([features/web-client-hosting.md](../features/web-client-hosting.md)).

## Consequences

- `yarn dev` is the way to run the app. `yarn start` runs the server alone.
- To debug a production workspace, load the source maps by hand from the build tarball of its version.
- Pull requests build and test the coverage-instrumented bundle. The plain production bundle is first built on
  `develop`, so a bug that shows only without instrumentation is found there.
- Under a `ROOT_URL` path prefix the REST API still answers at `/api`, and the E2EE service worker registers at the
  root. Neither changed with this decision.
- Meteor builds no client program (`METEOR_FORCE_EXCLUDE_ARCHS` in `build:ci`). The server renders the page itself,
  serves the runtime config as an external script and `public/` from `bundle/public`, and publishes a hash of the
  manifest as the client version (#43236).
- The client ships in a few hundred chunks rather than one per module. Startup loads a handful of grouped chunks
  (libraries, app code, and the startup routes with the layout every page renders), so the login page requests six
  scripts plus one per highlight.js language the workspace enables. Common chunks under 20 kB are copied into the lazy
  screens that use them (Rolldown's experimental `experimentalInlineCommonChunks`). Merging screens into fewer files
  was rejected: opening any screen then downloads several megabytes.
