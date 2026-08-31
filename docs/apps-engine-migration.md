# Apps-Engine migration to microservice

## Goal

Isolate apps execution into a microservice to decouple monolith scaling from apps-engine scaling. However, the current package architecture ends up making this transition quite difficult, so we'll move in phases.

Here is an overview of the action items required to achieve our goal:

- **Migrate app management code from @rocket.chat/apps-engine to private @rocket.chat/apps** - Stop publishing code that handles app management on the server alongside the public surface that apps actually use. Anything living _outside_ the `@rocket.chat/apps-engine/definition/` directory should either move to the internal `@rocket.chat/apps` package or be removed.

- **Consolidate all interaction with the apps internals on the server to the AppsEngineService** - Backend code handling apps business rules has to happen via a single entrypoint: the AppsEngineService class. This will give us the flexibility of serving the functionality either locally or through NATS.

- **Break the file upload flow for async validation step** - Decouple upload validation from the actual file upload request. This allows us to run the Apps-Engine `IPreFileUpload` event asynchronously and gives us a longer window for the execution, which means we're not forced to transfer file contents over NATS.

- **Create Apps-Engine service Docker image**

## Part 1: Migrate app management code from @rocket.chat/apps-engine to private @rocket.chat/apps

The Apps-Engine originally lived in its own repository, so the colocation of domain there made some sense. However, especially after the introduction of the deno-runtime, a large portion of the code published is never used by the apps themselves, reserved only for server usage. As we moved the package into the monorepo, the initial colocation stopped being a requirement.

Besides that, migrating app management code away from a public package enables us to integrate more closely with the private packages available in the monorepo, so we can effectivelly reuse more code and standardize approaches like `@rocket.chat/logger`.

To make this migration easier to understand and review, we're using a stacked PR approach on Github - similar to a feature branch but disallowing sibling PRs. They are:

- [40395](https://github.com/RocketChat/Rocket.Chat/pull/40395) The feature branch itself. It will accumulate the changes of the whole stack (⟶ `develop`)
- [40183](https://github.com/RocketChat/Rocket.Chat/pull/40183) Replaces `AppPackageParser.getEngineVersion()` - which resolved the version by traversing the filesystem relative to `__dirname` - with a direct import of `ENGINE_VERSION`. This will support the migration of the `AppPackageParser` class itself (⟶ #40395)
- [40184](https://github.com/RocketChat/Rocket.Chat/pull/40184) Copies all relevant source files from `packages/apps-engine/src/server`, `packages/apps-engine/src/client`, `packages/apps-engine/deno-runtime`, `packages/apps-engine/tests` and `packages/apps-engine/scripts` into  their corresponding path at `packages/apps` (⟶ #40183)
- [40185](https://github.com/RocketChat/Rocket.Chat/pull/40185) Adapts the path resolution of the apps-engine package for the deno runtime (⟶ #40184)
- [40186](https://github.com/RocketChat/Rocket.Chat/pull/40186) Flips the switch; changes code in `apps/meteor` and `packages/core-services` that pointed to `@rocket.chat/apps-engine` and makes it point to `@rocket.chat/apps`. This is the turning point in what is actually executed (⟶ #40185)
- [40343](https://github.com/RocketChat/Rocket.Chat/pull/40343) Removes old files from the `@rocket.chat/apps-engine` package (⟶ #40186)

### Architecturally Relevant Decisions

#### 1. `@rocket.chat/apps-engine` becomes a definition-only public package

The most consequential decision in this migration is that `@rocket.chat/apps-engine` is narrowed to expose **only** its `definition/` directory. All server-side management code, the client UI host, the deno-runtime, scripts, and tests were removed from the package. The `files` field in `package.json` went from listing `client/**`, `definition/**`, `deno-runtime/**`, `lib/**`, `scripts/**`, and `server/**` down to just `definition/**`. The package description was updated to reflect this: "The public API and type definitions for Rocket.Chat App development."

This preserves the public contract for external app developers while keeping all server-side complexity private and under active control inside the monorepo.

#### 2. `@rocket.chat/apps` becomes the operational package

`@rocket.chat/apps` (already private, `"private": true`) absorbs everything that was removed from `apps-engine`. Its `package.json` gained the runtime dependencies that `apps-engine` shed (`adm-zip`, `debug`, `esbuild`, `jose`, `jsonrpc-lite`, `lodash.clonedeep`, `semver`, `stack-trace`) and its build pipeline was extended to also run `deno-cache` and produce `deno-runtime/` and `.deno-cache/` artifacts alongside the TypeScript `dist/`.

The package also received its own `turbo.json` that declares those additional output directories, ensuring Turborepo cache invalidation covers the deno artefacts.

#### 3. `ENGINE_VERSION` is exported from the definition layer

`AppPackageParser` validated app compatibility by reading the engine's `package.json` via filesystem traversal relative to `__dirname`. That assumption breaks the moment the code moves to a different package. The fix is a dedicated `packages/apps-engine/src/definition/version.ts` that exports a single constant `ENGINE_VERSION`. It uses a `require()` (not a static import) with a path determined at runtime by checking whether `__dirname` ends with `src/definition` (source/ts-node context) or not (compiled context), resolving to `../../package.json` or `../package.json` respectively. Using `require()` prevents TypeScript from resolving the path at compile time, making the two-level distinction safe.

#### 4. Dynamic Deno import map generation at subprocess spawn time

The previous static `deno.jsonc` contained `"@rocket.chat/apps-engine/": "./../src/"` — a relative path that only worked when `deno-runtime/` and `apps-engine/src/` were siblings inside the same package. After the move, `deno-runtime/` lives in `@rocket.chat/apps` while the type definitions it imports live in `@rocket.chat/apps-engine`.

The solution is to drop the static entry and instead generate a temporary `deno_runtime.jsonc` file into the subprocess temp directory before each Deno process spawn. `DenoRuntimeSubprocessController` resolves the apps-engine source directory at runtime via `require.resolve('@rocket.chat/apps-engine/package.json')` and injects it as an absolute `file:` URL into the import map. This strategy works correctly in any environment (monorepo dev, Meteor bundle, CI) without any assumptions about directory layout.

Additionally, `--sloppy-imports` was added to the Deno subprocess flags, allowing the runtime to import `.ts` files from `apps-engine` without requiring explicit `.ts` extensions in every import specifier.

#### 5. Cross-boundary types promoted to the definition layer

Several types that were previously only exported from `server/` were needed by code that must stay in the public API. Rather than giving consumers a path that crosses into `@rocket.chat/apps`, these types were moved into `definition/`:

- `GetMessagesOptions`, `GetRoomsFilters`, `GetRoomsOptions`, and `GetMessagesSortableFields` moved from `server/bridges/RoomBridge.ts` into `definition/rooms/IGetMessagesOptions.ts` and re-exported from `definition/rooms/index.ts`.
- `OAuth2Client` moved from `server/oauth2/OAuth2Client.ts` into `definition/oauth2/OAuth2Client.ts`; the server copy became a re-export pointing to the definition location.
- `IExternalComponentRoomInfo` and `IExternalComponentUserInfo` moved from `client/definition/` into `definition/externalComponent/`, keeping `IExternalComponentState` (which depends on them) coherent within the definition layer.
- `IRoomRead` and other accessors that referenced the moved types had their import paths updated accordingly.

The guiding principle: anything that crosses the public/private boundary must live in `definition/`.

#### 6. Deep `@rocket.chat/apps/dist/` path imports

An attempt to use the modern `exports` field in `@rocket.chat/apps/package.json` (to define clean subpath entry points like `./server/*` and `./client/*`) was reverted because Meteor's bundler does not support the `exports` field, and thus could not resolve import paths as expected. The package fell back to `main` + `types` for the root entry point, and server-only types are imported via deep `dist/` paths (e.g., `@rocket.chat/apps/dist/server/IGetAppsFilter`). `typesVersions` was also removed for the same reason.

#### 7. TypeScript strict mode relaxed for the migrated code

The migrated code from `apps-engine` was written without strict TypeScript checks. Rather than fixing every existing violation upfront, `packages/apps/tsconfig.json` explicitly disables `strict`, `noUnusedParameters`, `noImplicitOverride`, and `noImplicitReturns`. This is intentional technical debt: the migration is a lift-and-shift first; tightening the type-checking can happen incrementally afterwards.

#### 8. CI and Dockerfile changes flow to the new owner

The `esbuild` platform-specific binary cleanup that runs inside Docker builds previously targeted `@rocket.chat/apps-engine/node_modules/@esbuild`; this was updated to `@rocket.chat/apps/node_modules/@esbuild`. Likewise, the microservice Dockerfiles (account-service, authorization-service, ddp-streamer, etc.) that copied `packages/apps-engine/client` into the image dropped that directory, as it no longer exists in the package. The `packages/apps-engine/definition` copy was kept because those types are still consumed by core-services and other packages that run inside those microservices.

#### 9. ESLint rules unified across both packages

The root `eslint.config.mjs` was updated to apply the same rule overrides (permissive `@typescript-eslint` settings, test-file non-null assertion relaxation, and built artefact `ignores`) to both `packages/apps-engine/**/*` and `packages/apps/**/*`, treating the two packages as a coherent unit under the same lint policy.
