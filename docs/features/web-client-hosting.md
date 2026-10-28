# Web client hosting

The web client is built by Vite, not by Meteor. By default the Rocket.Chat server serves it: the server renders the
page and the page loads the client. This page explains how that works and how to serve the client from another host.

## How the server serves the client

`yarn build:client` (`apps/meteor/vite/buildForServer.mjs`) builds the client with `RC_CLIENT_TARGET=server` and
copies:

- `vite/dist/bundle` to `public/bundle`, which the server ships as static files;
- `vite/dist/.vite/manifest.json` to `private/vite-manifest.json`.

`yarn build:ci` runs it before `meteor build`, so both end up in the server bundle.

Meteor still builds a `web.browser` program, but its main module (`client/meteorShell.ts`) is empty: Meteor only
renders the page. Everything the server already did for that page keeps working:

- the head and body injections of `server/lib/ui-master` (title, metas, favicons, theme variables, custom CSS and the
  `Custom_Script_*` scripts);
- `__meteor_runtime_config__`, loaded from `/meteor_runtime_config.js` when the Content-Security-Policy is on;
- `public/` assets, the `/assets/*` defaults and the livechat widget files;
- the new-version notice: the client files are in `public/`, so a new build changes the version Meteor publishes.

At startup `server/lib/ui-master/clientEntry.ts` reads the manifest and adds to the page the client's stylesheets, a
`modulepreload` for each chunk it imports up front, and its entry as a `<script type="module">`. No tag is inline, so
the Content-Security-Policy needs no change. The URLs get the same prefix Meteor gave its own bundle:
`CDN_PREFIX` when `CDN_PREFIX_ALL` is on, otherwise `CDN_JSCSS_PREFIX`, otherwise the `ROOT_URL` path prefix.

The client is built with a relative `base`, so its chunks, fonts and images load from wherever the entry loads: the
server root, a path prefix (`ROOT_URL=https://example.com/chat`) or a CDN. Their names carry a content hash, so the
server serves `/bundle/*` with `Cache-Control: public, max-age=31536000, immutable`.

## Source maps

The build the server serves has hidden source maps: every chunk gets a `.map` next to it, but the chunk does not
reference it, so browsers never request one. The Docker images strip the maps; the build tarball keeps them, at
`bundle/programs/web.browser/app/bundle/<chunk>.js.map`. That tarball is the CI artifact `build-production` and, for
releases and `develop` builds, `https://download.rocket.chat/build/rocket.chat-<version>.tgz`.

A chunk name carries its content hash, so a map named after the chunk belongs to that exact build. To debug a
workspace:

1. Download the tarball of the version the workspace runs (`/api/info`) and extract the maps:
   `tar xzf rocket.chat-<version>.tgz --wildcards 'bundle/programs/web.browser/app/bundle/*.map'`.
2. Serve them with CORS, for example `npx http-server bundle/programs/web.browser/app/bundle --cors -p 8080`.
3. In Chrome DevTools, open the chunk under Sources, right-click its code, choose **Add source map…** and enter
   `http://localhost:8080/<chunk>.js.map`. Firefox has the same entry in its debugger.

To map a stack trace without a browser, resolve each `chunk:line:column` against the same files with the
[`source-map`](https://www.npmjs.com/package/source-map) package.

## Serving the client from another host

### Through a CDN

Set `CDN_PREFIX` with `CDN_PREFIX_ALL` on (the default), or turn `CDN_PREFIX_ALL` off and set `CDN_JSCSS_PREFIX`, to a
CDN that pulls from the server. The server still renders the page, and the entry, chunks and stylesheets load from the
CDN. Nothing else changes.

### From your own host

`yarn build:vite` (without `RC_CLIENT_TARGET=server`) builds a standalone client into `apps/meteor/vite/dist`:
`index.html`, `bundle/` and a copy of `public/`. To serve it yourself, in front of a Rocket.Chat server:

1. Serve `vite/dist` as static files. Answer page navigations (`GET` requests that accept `text/html`) with
   `index.html`, since the client routes on the browser side, except under the server's own pages: `/api`, `/oauth`,
   `/_oauth`, `/_saml`, `/_cas`, `/file-upload`, `/file-decrypt`, `/data-export` and `/livechat`. Of those, only
   `/oauth/authorize` and `/oauth/error` are client pages.
2. Proxy every other path to the Rocket.Chat server, and the `/websocket` and `/sockjs` WebSockets. Rewrite the cookie
   domain to your host, so `rc_token` reaches avatars and downloads.
3. Define `window.__meteor_runtime_config__` before the entry runs, with at least `ROOT_URL` (your host) and
   `ROOT_URL_PATH_PREFIX`. Use an external script if your host sends a Content-Security-Policy.

The standalone build builds full URLs from the page's own origin instead of `Site_Url`, so links keep going through
your proxy. What the server-rendered page adds is missing: the title and metas, the theme variables, custom CSS, the
`Custom_Script_*` scripts and the new-version notice. Add what you need to your `index.html`.

`packages/ui-preview` does exactly this, with `vite preview` and a proxy, and is the reference setup.

## Development

`yarn dev` runs Vite in front of a local Meteor server. Vite fetches the page Meteor renders, adds its own entry, and
proxies the server routes, so the page matches production. With `RC_SERVER_URL` set, Vite serves the standalone
`index.html` against that server instead. See [getting-started.md](../getting-started.md).
