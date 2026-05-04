# Apps-Engine migration to microservice

## Goal

Isolate apps execution into a microservice to decouple monolith scaling from apps-engine scaling. However, the current package architecture ends up making this transition quite difficult, so we'll move in phases.

Here is an overview of the action items required to achieve our goal:

- **Migrate app management code from @rocket.chat/apps-engine to private @rocket.chat/apps** - Stop publishing code that handles app management on the server alongside the public surface that apps actually use. Anything living _outside_ the `@rocket.chat/apps-engine/definition/` directory should either move to the internal `@rocket.chat/apps` package or be removed.

- **Consolidate all interaction with the apps internals on the server to the AppsEngineService** - backend code handling apps business rules has to happen via a single entrypoint: the AppsEngineService class. This will give us the flexibility of serving the functionality either locally or through NATS.

- **Break the file upload flow for async validation step**

- **Create Apps-Engine service Docker image**

## Part 1: Migrate app management code from @rocket.chat/apps-engine to private @rocket.chat/apps

The Apps-Engine originally lived in its own repository, so the colocation of domain there made some sense. However, especially after the introduction of the deno-runtime, a large portion of the code published is never used by the apps themselves, reserved only for server usage. As we moved the package into the monorepo, the initial colocation stopped being a requirement.

Besides that, migrating app management code away from a public package enables us to integrate more closely with the private packages available in the monorepo, so we can effectivelly reuse more code and standardize approaches like `@rocket.chat/logger`.

To make this migration easier to understand and review, we're using a stacked PR approach on Github - similar to a feature branch but disallowing sibling PRs. They are:

- [40395](https://github.com/RocketChat/Rocket.Chat/pull/40395) The feature branch itself. It will accumulate the changes of the whole stack.
- [40183](https://github.com/RocketChat/Rocket.Chat/pull/40183) Replaces `AppPackageParser.getEngineVersion()` - which resolved the version by traversing the filesystem relative to `__dirname` - with a direct import of `ENGINE_VERSION`. This will support the migration of the `AppPackageParser` class itself.
- [40184](https://github.com/RocketChat/Rocket.Chat/pull/40184) Copies all relevant source files from `packages/apps-engine/src/server`, `packages/apps-engine/src/client`, `packages/apps-engine/deno-runtime`, `packages/apps-engine/tests` and `packages/apps-engine/scripts` into  their corresponding path at `packages/apps`.
- [40185](https://github.com/RocketChat/Rocket.Chat/pull/40185) Adapts the path resolution of the apps-engine package for the deno runtime
- [40186](https://github.com/RocketChat/Rocket.Chat/pull/40186) Flips the switch; changes code in `apps/meteor` and `packages/core-services` that pointed to `@rocket.chat/apps-engine` and makes it point to `@rocket.chat/apps`. This is the turning point in what is actually executed.
- [40343](https://github.com/RocketChat/Rocket.Chat/pull/40343) Removes old files from the `@rocket.chat/apps-engine` package
