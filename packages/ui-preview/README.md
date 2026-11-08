# `@rocket.chat/ui-preview`

> A command-line tool that runs the web client built for a Rocket.Chat pull request against any Rocket.Chat server.

[![npm](https://img.shields.io/npm/v/@rocket.chat/ui-preview?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/ui-preview) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/ui-preview?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/ui-preview)

Use it to try a pull request's UI changes without cloning or building Rocket.Chat. It downloads the prebuilt web client for the pull request, serves it locally, and proxies everything else (the API, websockets, file uploads, OAuth, Livechat) to the server you choose.

Builds come from the UI Preview workflow in the Rocket.Chat repository. It publishes them to `ghcr.io/rocketchat/rocket.chat-web`:

- for pull requests labeled `preview`, on each push. They are removed when the label is removed or the pull request is closed. Only pull requests from branches in the Rocket.Chat repository get one; pull requests from forks and from Dependabot are never built, even when labeled;
- for `develop`, on each push that changes the client.

## Installation

No installation is needed. Run it with `npx`:

```sh
npx @rocket.chat/ui-preview 42665
```

Requires Node.js 22.12 or later and a `tar` command on your `PATH`.

## Usage

```sh
npx @rocket.chat/ui-preview <pull request number or URL> [options]
```

The tool prints a local URL (`http://localhost:3000` by default). Open it in a browser and log in to the server as usual.

### Choosing a build

```sh
# Latest build of a pull request, by number or URL
npx @rocket.chat/ui-preview 42665
npx @rocket.chat/ui-preview https://github.com/RocketChat/Rocket.Chat/pull/42665

# The build of one commit of a pull request
npx @rocket.chat/ui-preview --pr 42665 --sha <40-character commit hash>

# Latest build of develop
npx @rocket.chat/ui-preview --develop
```

### Choosing a server

The default server is `https://open.rocket.chat`. Use `--server` to run against another one:

```sh
npx @rocket.chat/ui-preview 42665 --server https://your.server
```

### Options

| Option           | Description                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `--pr <number>`  | Latest build of a pull request. Same as the positional argument.                                    |
| `--sha <sha>`    | Exact build of a commit, as a full 40-character hash. With `--pr`, that pull request's build of it. |
| `--develop`      | Latest build of `develop`.                                                                          |
| `--server <url>` | Rocket.Chat server to run against. Default: `https://open.rocket.chat`.                             |
| `--port <port>`  | Local port. Default: `3000`. The tool exits if the port is in use.                                  |
| `-h`, `--help`   | Shows the help.                                                                                     |

If a pull request number, URL or `--sha` is given, `--develop` is ignored.

### Caching

Downloaded builds are cached in `~/.cache/rocketchat-ui-preview`, one folder per build. A build is never downloaded twice. Delete the folder to free disk space.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/ui-preview). From the repository root:

```sh
yarn workspace @rocket.chat/ui-preview lint
```

To run the CLI from your checkout:

```sh
node packages/ui-preview/bin/ui-preview.mjs 42665
```

The builds it downloads are produced by [`.github/workflows/ui-preview.yml`](https://github.com/RocketChat/Rocket.Chat/blob/develop/.github/workflows/ui-preview.yml).

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
