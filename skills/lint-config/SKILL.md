---
name: rocketchat-lint-config
description: Locates the lint, formatting, stylesheet and TypeScript configuration that governs a file in the Rocket.Chat monorepo, and how to run each check. Use when writing, editing, or reviewing code in any package, or when the user asks about code style, lint errors, import ordering, Prettier settings, oxlint rules, Stylelint rules, or TypeScript config.
---

# Rocket.Chat Lint & Code Style Configuration

The configuration files below are the source of truth. Read the one that applies to the file at hand instead of relying on memory, and run the check rather than guessing whether code passes.

## Formatting — all files

- [`.prettierrc`](../../.prettierrc): tabs, LF line endings, print width 140, single quotes (JSX attributes too), trailing commas everywhere, parentheses around every arrow parameter.
- [`.editorconfig`](../../.editorconfig): indentation exceptions, such as `*.i18n.json` with 2 spaces.

Prettier is not run on its own: oxlint reports formatting through the `prettier/prettier` rule, and `--fix` applies it.

## Lint rules — JavaScript, TypeScript, React

The monorepo lints with [oxlint](https://oxc.rs), not ESLint. `@rocket.chat/eslint-config` is retired.

| File | What it holds |
|------|---------------|
| [`packages/lint-config/oxlint.json`](../../packages/lint-config/oxlint.json) | Shared rule set (import order, type-only imports, React and hooks rules, Prettier) |
| [`packages/lint-config/README.md`](../../packages/lint-config/README.md) | How the shared rules differ from the old ESLint config |
| [`.oxlintrc.json`](../../.oxlintrc.json) | Root config: extends the shared one, ignore patterns, and per-path `overrides` for `apps/meteor`, its e2e tests, `packages/livechat`, `packages/apps-engine`, `packages/fuselage`, stories, and more |
| `<package>/.oxlintrc.json` | Nested config for a few packages (e.g. `packages/models`, `ee/packages/xmpp-server`); it applies to files under that folder |

To find the rules for a file, start from the shared set, then apply each root `overrides` entry whose `files` glob matches the path, then any nested `.oxlintrc.json` above it.

Type-aware rules (such as `no-floating-promises`) are on (`options.typeAware`), so oxlint needs the package's `tsconfig.json`.

## Stylesheets

Stylelint runs only where a package has its own config:

- [`apps/meteor/.stylelintrc`](../../apps/meteor/.stylelintrc) (ignores in `apps/meteor/.stylelintignore`)
- [`packages/livechat/.stylelintrc.json`](../../packages/livechat/.stylelintrc.json): SCSS syntax and a strict property order
- [`packages/fuselage/.stylelintrc`](../../packages/fuselage/.stylelintrc) (ignores in `packages/fuselage/.stylelintignore`)

## TypeScript

Packages extend a preset from [`packages/tsconfig/`](../../packages/tsconfig/): `client.json` for browser and UI code, `server.json` for server code, both built on `base.json`. Each package's `tsconfig.json` may relax or extend the preset, and `apps/meteor/tsconfig.json` is notably less strict, so read the package's own file.

## Running the checks

From the package folder:

```sh
yarn lint                               # the package's lint script (oxlint, plus stylelint where configured)
yarn run -T oxlint path/to/file.tsx     # a single file
yarn run -T oxlint --fix path/to/file   # fix, including formatting
yarn typecheck                          # where the package defines it
```

From the repository root, `yarn lint` runs every package's lint through Turbo.

## Conventions that no linter enforces

Comment, database-access, React, i18n and change-organization rules live in `docs/` and are indexed from [`CLAUDE.md`](../../CLAUDE.md). Read the doc that matches the task.
