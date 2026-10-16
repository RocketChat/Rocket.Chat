# Published packages declare no Yarn patches

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** the root `package.json` `resolutions`, every workspace published to npm; applied to `packages/ui-kit` and `packages/core-typings`

## Decision

A workspace that is published to npm declares each dependency with a plain npm range, never with the `patch:`
protocol. When the monorepo needs a patched copy of that dependency, the patch is applied from the root
`package.json` `resolutions`, keyed on the exact descriptor the workspace declares:

```json
"resolutions": {
	"typia@npm:9.7.2": "patch:typia@npm%3A9.7.2#~/.yarn/patches/typia-npm-9.7.2-5c5d9c80b4.patch"
}
```

`@rocket.chat/ui-kit` and `@rocket.chat/core-typings` follow this rule: each declares `"typia": "9.7.2"`.

## Why

- **`yarn pack` publishes the `patch:` range unchanged.** Yarn rewrites `workspace:` ranges on pack, but not
  `patch:` ranges. The published `@rocket.chat/ui-kit@1.2.0` declares
  `typia: "patch:typia@npm%3A9.7.2#~/.yarn/patches/…"`, a path into a `.yarn/` folder that only exists in this
  repo.
- **No other package manager can install that range.** npm stops with
  `EUNSUPPORTEDPROTOCOL Unsupported URL Type "patch:"`. pnpm reports success but links `typia` to a folder that
  does not exist. An app author who runs `npm install @rocket.chat/ui-kit` cannot start.
- **The dependency cannot move to `devDependencies`.** typia compiles each `typia.createIs<T>()` into a plain
  validator at build time, but the emitted files keep `import typia from 'typia'`. A bundler fails with
  `Could not resolve "typia"` when the package is absent, so consumers must still receive it.
- **The patch only matters inside the monorepo.** It renames a local binding in `typia/lib/index.mjs` from
  `module` to `_module`, because Meteor's bundler reserves the name `module`. Consumers outside Meteor run the
  unpatched release without a problem, and a bundled test app validates views with it.
- **A root resolution keeps the patch where it is needed.** Resolutions are not part of a workspace's
  `package.json`, so they never reach npm. Inside the repo, `yarn why typia` shows every workspace, ui-kit
  included, on the patched copy.

## Alternatives considered

| Alternative | What it does | Status |
| --- | --- | --- |
| **Fix typia upstream** | A typia release renames the `module` binding, and the patch goes away. | Rejected. It depends on the typia release cycle and our need for the patch falls out of scope/concern of the package |
| **Point Meteor at the CJS build of typia** | A resolve alias or a `mainFields` change in the Meteor build config loads `lib/index.js` in place of `index.mjs`. | Rejected. Nothing ties that config to the typia version, so an upgrade can break the build without a clear signal. |
| **Bundle typia into the ui-kit `dist`** | Consumers do not install typia. | Rejected. The package gets larger, consumers can load two copies of typia, and the bundled copy still contains the `module` binding, so Meteor still needs the patch. |
| **Rewrite `patch:` ranges at pack time** | A Yarn plugin with a `beforeWorkspacePacking` hook changes each `patch:` range back to its npm range in the packed manifest. Yarn's `publishConfig` cannot do this, because it does not override `dependencies`. | Rejected for now. The repo must maintain a custom plugin. Reconsider it if many published workspaces need patches. |
| **Replace typia** | `ajv`, which `@rocket.chat/rest-typings` already uses, or hand-written type guards remove the dependency. | Rejected. The change is much larger than the defect, and the compile-time `createIs<T>()` checks go away. |
| **Publish a patched fork** | A package such as `@rocket.chat/typia` ships the patch to every consumer. | Rejected. Consumers do not need the patch, and the repo must keep the fork in sync with each typia release. |

## Consequences

- To patch a dependency of a published workspace, run `yarn patch` and `yarn patch-commit`, then move the
  resulting `patch:` range into the root `resolutions` and give the workspace the plain range. A workspace with
  `"private": true` can keep the `patch:` range, because it never reaches npm.
- The resolution key must match the workspace's range exactly. If a workspace bumps `typia` to another range
  without a matching key, the monorepo quietly falls back to the unpatched release. Update both lines together.
- This rule only fits a patch that consumers do not need. If consumers depend on the patched behavior, the fix
  has to ship another way: upstream, a fork published under its own name, or code inside the package.
- `@rocket.chat/eslint-config` still breaks this rule and is left for its own change. It declares patched
  `eslint-plugin-react` and `eslint-plugin-storybook`. Before it moves, check whether its consumers need those
  patches.
