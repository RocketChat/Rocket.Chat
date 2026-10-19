# Published packages declare no Yarn patches

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** the root `package.json` `resolutions`, every workspace published to npm; applied to `packages/eslint-config`

## Decision

A workspace that is published to npm declares each dependency with a plain npm range, never with the `patch:`
protocol. When the monorepo needs a patched copy of that dependency, the patch is applied from the root
`package.json` `resolutions`, keyed on the exact descriptor the workspace declares:

```json
"resolutions": {
	"eslint-plugin-react@npm:7.37.5": "patch:eslint-plugin-react@npm%3A7.37.5#~/.yarn/patches/eslint-plugin-react-npm-7.37.5-d03f6b6543.patch"
}
```

`@rocket.chat/eslint-config` follows this rule: it declares `"eslint-plugin-react": "7.37.5"`.

## Why

- **`yarn pack` publishes the `patch:` range unchanged.** Yarn rewrites `workspace:` ranges on pack, but not
  `patch:` ranges. The published `@rocket.chat/eslint-config@0.9.0` declares
  `eslint-plugin-react: "patch:eslint-plugin-react@npm%3A7.37.5#~/.yarn/patches/…"`, a path into a `.yarn/`
  folder that only exists in this repo. `@rocket.chat/ui-kit@1.2.0` has the same defect for `typia`.
- **No package manager can install that range outside this repo.** npm stops with
  `EUNSUPPORTEDPROTOCOL Unsupported URL Type "patch:"`. Yarn 1 stops with `Couldn't find any versions` for the
  range. Yarn 4 understands `patch:`, but it reads `~/` as the consumer's project root and stops with `ENOENT`
  on the missing patch file. pnpm reports success but links the dependency to a folder that does not exist.
- **A root resolution keeps the patch where it is needed.** Resolutions are not part of a workspace's
  `package.json`, so they never reach npm. Inside the repo, `yarn why eslint-plugin-react` shows every
  workspace on the patched copy.

## Alternatives considered

| Alternative | What it does | Status |
| --- | --- | --- |
| **Fix the dependency upstream** | A release of the dependency includes the fix, and the patch goes away. | Preferred when a release exists: `eslint-plugin-storybook` 10 removed one patch this way. Not a general rule, because it depends on the release cycle of each dependency. |
| **Rewrite `patch:` ranges at pack time** | A Yarn plugin with a `beforeWorkspacePacking` hook changes each `patch:` range back to its npm range in the packed manifest. Yarn's `publishConfig` cannot do this, because it does not override `dependencies`. | Rejected for now. The repo must maintain a custom plugin. Reconsider it if many published workspaces need patches. |
| **Publish a patched fork** | A package such as `@rocket.chat/eslint-plugin-react` ships the patch to every consumer. | Rejected. The repo must keep the fork in sync with each upstream release. |

## Consequences

- To patch a dependency of a published workspace, run `yarn patch` and `yarn patch-commit`, then move the
  resulting `patch:` range into the root `resolutions` and give the workspace the plain range. A workspace with
  `"private": true` can keep the `patch:` range, because it never reaches npm. `apps/meteor` does this for
  `typia` 9.7.2.
- The resolution key must match the workspace's range exactly. If a workspace bumps the dependency to another
  range without a matching key, the monorepo quietly falls back to the unpatched release. Update both lines
  together.
- Consumers get the unpatched release. If they depend on the patched behavior, the fix has to ship another way:
  upstream, a fork published under its own name, or code inside the package.
- `@rocket.chat/eslint-config` shows how to apply the rule when consumers need the patch. Both of its
  patches added ESLint 10 fallbacks for `context.getFilename()` and `context.getSourceCode()`.
  `eslint-plugin-storybook` 10 no longer calls those APIs, so the upgrade removed that patch. No
  `eslint-plugin-react` release fixes them, so the config pins `settings.react.version`: the `'detect'` path
  is the only patched code that its enabled rules reach. The patch stays in the root `resolutions` for the
  monorepo. Restore `'detect'` when an `eslint-plugin-react` release fixes the calls.
- `@rocket.chat/ui-kit` and `@rocket.chat/core-typings` declared a patched `typia` 9.7.2 for the same reason.
  The TypeScript 7 migration (#41932) moved them to a plain `typia` 13.0.2, which needs no patch.
