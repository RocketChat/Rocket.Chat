# ADR 0005 — Screens of a scope live in a feature package

## TL;DR

- The screens of one scope — conference, voice calls, the composer — live in a workspace
  package `packages/ui-<scope>`, with their stories, specs and fixtures beside them.
- The package holds the screens and the contract they render from. The provider that reads
  the application and fills the contract stays in `apps/meteor`.
- Components in a feature package do not read application state. A lint rule says so, with
  a shrinking list of files that still do.
- A scope is extracted when it has several screens, a second UI, or a consumer outside
  `apps/meteor`. A single screen stays in `apps/meteor/client/views/<scope>/`.

How to build one: [docs/frontend/feature-packages.md](../frontend/feature-packages.md).

## Status

**Proposed.**

- **Date:** 2026-10
- **Precedent:** `packages/ui-voip`, `packages/ui-conference`, `packages/ui-composer` already
  have this shape; this ADR writes it down and adds the lint rule.

## Context

Screens in `apps/meteor/client/views` can reach anything: every context, every endpoint, the
router, Meteor. Nothing stops a component from reading a setting three levels down, so many
do, and each read is one more thing a story has to mock and a test has to stand up. Their
stories, where they exist, seed query clients and mock endpoints — they document the
transport rather than the screen.

The scopes that moved to packages — `ui-voip`, then `ui-conference` — came out different.
A package boundary made the dependency visible: whatever the screens needed had to arrive
through a contract, so the contract got designed. Their stories render from fixtures, their
specs assert actions as spies, and most of `ui-conference` renders from a plain object — the
toasts, modals and sounds some of its components still read are the exceptions the lint
baseline lists.

The same split is established practice outside this codebase:

- **Nx** classifies libraries as `feature` (containers with data access), `ui` (presentational,
  data through inputs), `data-access` and `util`, tags them by `scope:` and `type:`, and
  enforces which may depend on which ([library types][nx-types], [module boundaries][nx-boundaries]).
- **Feature-Sliced Design** layers code as app → pages → widgets → features → entities →
  shared, slices each layer by domain, gives each slice a public API, and only allows imports
  downwards ([overview][fsd]).
- **bulletproof-react** does the same at folder level: `features/<x>` with an `index.ts`
  public API and no imports between features ([project structure][bulletproof]).

## Decision

1. A scope with several screens, a second UI, or a consumer outside `apps/meteor` becomes
   `packages/ui-<scope>`.
2. The package exports its views, its contract type and a default value that renders. The
   provider that fills the contract lives in `apps/meteor/client/views/<scope>/providers/`.
3. Components in the package take application state from the contract, never from
   `@rocket.chat/ui-contexts` application hooks. `eslint.config.mjs` enforces it with
   `no-restricted-imports`, error by default, `warn` for a listed set of existing files.
4. Every view ships with stories that state situations from fixtures, and specs that assert
   actions as spies.
5. A feature package does not import another feature package's views, context or hooks.
   What two of them share moves down to a shared package (`ui-client`, `ui-avatar`,
   `ui-video-conf`).

## Consequences

- A screen can be built, reviewed and tested before any wiring exists; wiring becomes a
  separate, small change.
- A second UI for the same scope implements the contract instead of forking the logic.
- Each package costs a build, a Storybook config, a jest config and its own changesets. That
  is why the extraction criteria exclude single screens.
- The lint baseline lists 17 files today across `ui-conference`, `ui-video-conf` and
  `ui-voip`. Each migration removes a file from it; the list is expected to reach zero.
- `ui-video-conf` counts as a shared UI package, not a feature package: `fuselage-ui-kit`
  and `ui-conference` both render its components.

## Alternatives considered

**Feature folders inside `apps/meteor`.** The bulletproof-react shape:
`client/views/<scope>/{components,views,providers}` with a lint rule on the folder. Cheaper —
no package, no build — but the boundary is a path pattern, so an import of anything in the
app still resolves, and the folder's Storybook is the application's, which mounts every
provider. Kept as the default for scopes that do not meet the extraction criteria.

**Nx-style `type:` and `scope:` tags across all packages.** The rule would cover every
package in the monorepo, not only feature packages. The repo does not use Nx, and the tag
matrix grows with every dimension; one `no-restricted-imports` block covers the boundary that
matters today. Revisit if more than one boundary needs enforcing.

**Package holds the provider too.** Simpler to mount, but the package then depends on the
application's contexts, endpoints and router, which is the coupling the split exists to
remove — and a second UI could not reuse the logic without inheriting the shipped screen.

[nx-types]: https://nx.dev/concepts/more-concepts/library-types
[nx-boundaries]: https://nx.dev/docs/features/enforce-module-boundaries.md
[fsd]: https://feature-sliced.design/docs/get-started/overview
[bulletproof]: https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
