# Feature packages

A feature package holds the screens of one scope — conference, voice calls, the composer — as
a workspace package under `packages/ui-<scope>`, with their stories and specs beside them. The
application keeps the provider that feeds them. The decision and its alternatives are in
[ADR 0005](../adr/0005-screens-live-in-scope-packages.md); the rules for what a component
inside one may read are in
[building-components.md](building-components.md#where-a-component-gets-its-data).

## The patterns this follows

The same split appears under different names across the industry:

| Here | [Nx library types][nx-types] | [Feature-Sliced Design][fsd] |
| --- | --- | --- |
| `apps/meteor` — routes, providers, wiring | app + `feature` (containers with data access) | `app` |
| `packages/ui-<scope>` — screens and their contract | `ui` scoped to one domain (`scope:<x>`) | a slice of `pages` / `widgets` |
| `ui-video-conf`, `ui-avatar`, `ui-client`, Fuselage | `ui` shared across domains | `shared` |
| `ui-contexts`, `rest-typings` | `data-access` | `shared/api` |
| `core-typings` | `util` | `shared/lib` |

All three — Nx, Feature-Sliced Design and [bulletproof-react][bulletproof] at folder level —
agree on four rules: group by scope, layer by role, expose a public API, and let dependencies
point only downwards, with a linter enforcing it ([Nx module boundaries][nx-boundaries]).

## When to extract a scope

Extract when one of these holds:

- the scope has several screens that share a situation (a call, a session, a draft);
- a second UI is wanted for the same logic;
- something outside `apps/meteor` will render it — Desktop, an embedded client, another app.

Otherwise keep the screen in `apps/meteor/client/views/<scope>/`. A package costs a build,
a Storybook, a jest config and a changeset trail; a single screen does not repay that. Nx
warns that tag dimensions multiply quickly — the same holds for packages.

## Shape of a package

`packages/ui-conference` is the reference:

```text
packages/ui-<scope>/
  .storybook/
  src/
    context/       contract type, default value, the hooks that read it
    views/         screens — what the application mounts on a route or a surface
    components/    the pieces those screens are built from
    hooks/         UI-only hooks (local state, derived values, no application reads)
    fixtures/      the plain objects stories and specs render from
    index.ts       public API: views, contract types, default value
  jest.config.ts
  package.json
```

The provider that fills the contract lives in the application, e.g.
`apps/meteor/client/views/conference/providers/ConferenceProvider.tsx`. A package may keep a
`providers/` folder for state that is its own (device selection, local timers), never for
reading the application's.

## What it may depend on

| May depend on | Never |
| --- | --- |
| Fuselage, `ui-client`, `ui-avatar`, shared UI packages such as `ui-video-conf` | `apps/meteor` |
| `core-typings`, types from `rest-typings` and `ui-contexts` | another feature package's views, context or hooks |
| `useTranslation` and the other reads [building-components.md](building-components.md#what-a-component-may-read) allows | application reads: settings, permissions, user, route, endpoints, toasts, modals |

What two feature packages both need moves down to a shared package, not sideways into one of
them.

### Enforcement

`eslint.config.mjs` applies `no-restricted-imports` to `packages/@(ui-composer|ui-conference|ui-video-conf|ui-voip)/src`,
outside `providers/`, specs and stories: the application hooks of `@rocket.chat/ui-contexts`
are an error there. Files that still read them sit in a `warn` list right below it, and leave
the list as they are migrated. A new feature package is added to the glob when it is created.

## Stories and specs

Each view and each component with more than one state ships with:

- **stories that state situations** — args or a fixture describing the call, the session, the
  viewer — never mocked endpoints ([Component-Driven Development][cdd]);
- **specs that assert actions as spies** — `onForward` was called with `{ department }`, not
  "the endpoint received a POST".

Both render from `fixtures/`, through the contract's default value. If a story needs a
`QueryClient` or a mocked endpoint, an application read has leaked into the package.

## Public API

`index.ts` exports the views, the contract types and the default value. The application
imports from the package root only. Meteor's bundler does not tree-shake (see
[bundle-optimization-react-aria.md](../bundle-optimization-react-aria.md)), so keep the barrel
to what the application mounts; internal folders get no barrels of their own.

[nx-types]: https://nx.dev/concepts/more-concepts/library-types
[nx-boundaries]: https://nx.dev/docs/features/enforce-module-boundaries.md
[fsd]: https://feature-sliced.design/docs/get-started/overview
[bulletproof]: https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md
[cdd]: https://www.componentdriven.org/
