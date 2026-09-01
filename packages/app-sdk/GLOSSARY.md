# Glossary

The nomenclature the [app-facing RFC](rfc/README.md) and the
[host RFC](rfc-host/README.md) have established so far. A reference, not a
scope: it decides nothing and states no design.

**The rule it exists to enforce:** a term defined here means *this* and nothing
else. Several of them are ordinary English words with a narrow meaning in these
documents — `gateway`, `client`, `command`, `surface`, `scope`, `view`. Reaching
for one loosely is how a document ends up describing a component that does not
exist. [Collisions](#collisions) lists the pairs that have actually caused that.

Each row names where the term is **decided**. That document is the authority; if
this file disagrees with it, this file is wrong.

---

## The RFC itself

| Term | Means | Decided in |
|---|---|---|
| **scope document** | one problem, one design, its own open questions; 30–80 lines | [CLAUDE.md](CLAUDE.md) |
| **research report** | working notes against the codebase; no length limit; lives in `rfc/assets/` unless it is numbered inline | [CLAUDE.md](CLAUDE.md) |
| **the sketch** | the illustrative types under [`src/`](src) — compiles, does not ship | [00](rfc/00-overview.md) |
| **worked example** | an app under [`examples/`](examples) that type-checks against the sketch | [52](rfc/52-trying-it.md) |

## Composition and the app-facing surface

| Term | Means | Decided in |
|---|---|---|
| **the app-facing surface** | what an app author writes: `defineApp`, `ctx`, the schemas. Not the host | [00](rfc/00-overview.md) |
| **composition root** | the one place an app registers everything, by value | [10](rfc/10-surface-composition-root.md) |
| **the kit** | what `createApp({ manifest, settings, store })` returns: `define*` factories pre-bound to the app's env | [10](rfc/10-surface-composition-root.md) |
| **`define*` factory** | returns a typed, self-validating **definition**; authoring mistakes throw on import | [01](rfc/01-prior-art-mastra.md) |
| **definition** | the inert value a `define*` factory returns. Carries no platform access until the runtime binds a `ctx` | [10](rfc/10-surface-composition-root.md) |
| **registration** | putting definitions into the registry; also the dependency-injection seam | [10](rfc/10-surface-composition-root.md) |
| **`ctx`** | the single injected context. **The only way an app reaches the platform** | [11](rfc/11-surface-context.md) |
| **capability client** | one property of `ctx` covering one domain, read and write unified: `ctx.rooms`, `ctx.messages`, `ctx.store` | [11](rfc/11-surface-context.md) |
| **executable** | anything the runtime invokes with a `ctx`: command, job, endpoint, listener, lifecycle hook, provider method | [11](rfc/11-surface-context.md) |
| **env** | an app's typed `{ settings, store }` pair, inferred from its declarations and threaded through every handler | [10](rfc/10-surface-composition-root.md) |
| **store** | app-private persistence — `ctx.store`, typed collections. **Not** platform data | [17](rfc/17-surface-settings-persistence-lifecycle.md) |
| **association** | an optional per-record relation tag on a store write. Unsettled: A drop / B keep / C declare per collection | [18](rfc/18-surface-store-associations.md) |
| **store collection** | one named, schema-declared collection inside a store. Maps to one MongoDB collection, `rocketchat_app_<appId>_<name>` | [host 31](rfc-host/31-store-persistence.md) |
| **the index contract** | the declared index set *is* the query surface: `find` accepts only a key set a declared index serves as a prefix | [host 31](rfc-host/31-store-persistence.md) |
| **interactive surface** | a modal or contextual bar opened by `ctx.ui.open` and awaited | [16](rfc/16-surface-interactive-ui.md) |
| **suspend / resume** | `await ctx.ui.open` suspends the handler; a later, separate interaction resumes that same `await` | [16](rfc/16-surface-interactive-ui.md) |
| **surface instance** | one opened modal or contextual bar. Its id is ui-kit's `view.id` on the wire, and it is the resume key | [host 40](rfc-host/40-runtime-continuations.md) |
| **continuation** | the host record that lets a suspended handler be re-entered: entry point, input, journal, descriptor, app version | [host 40](rfc-host/40-runtime-continuations.md) |
| **the journal** | the ordered record of one execution's `ctx` calls and their results. Answers a replayed call instead of re-issuing it | [host 40](rfc-host/40-runtime-continuations.md) |

## Event listeners

| Term | Means | Decided in |
|---|---|---|
| **the outcome vocabulary** | the four intents a pre-event listener may return: `pass`, `patch`, `prevent`, `prompt` | [15](rfc/15-surface-event-listeners.md) |
| **subject** | the thing an event is about and a `patch` modifies — the message, the room, the upload | [15](rfc/15-surface-event-listeners.md) |
| **outcome** | the plain-data value a listener returns, marked `'@kind': 'EventResult'` so it survives the transport | [15](rfc/15-surface-event-listeners.md) |
| **`when`** | the host-side delivery filter on a listener, written in the app-facing vocabulary (`roomTypes: ['channel']`, never `t: ['c']`) | [15](rfc/15-surface-event-listeners.md) |
| **the filter index** | host state mapping `event → (appId, filter)[]`, built at install. Lets the host skip an event before talking to the runtime | [15](rfc/15-surface-event-listeners.md) |

## The data layer

| Term | Means | Decided in |
|---|---|---|
| **entity** | an app-facing concept in the data layer: Message, Room, Thread, Discussion, Team, User | [21](rfc/21-data-entities.md) |
| **record** | an entity with its own collection and its own id. Gets a repository | [21](rfc/21-data-entities.md) |
| **view** | a predicate plus extra fields over a record — Discussion, Thread, Direct message. Owns no record. Gets a guard and a lens | [21](rfc/21-data-entities.md), [28](rfc/28-data-views.md) |
| **relation** | a declared edge between records. Gets a traversal | [21](rfc/21-data-entities.md) |
| **client** | the **app-side** half of a record's data access: `ctx.rooms`. Builds envelopes, runs in the app process | [27](rfc/27-data-host-gateways.md) |
| **gateway** | the **host-side** repository for one record — `RoomGateway`, `MessageGateway`. Owns policy, projection, loader, codec. One per record, data layer only | [27](rfc/27-data-host-gateways.md) |
| **selection** | `select` (fields) and `with` (relations) on a read. The return type is inferred from it; hydration is an argument, never a property of the type | [24](rfc/24-data-read-surface.md) |
| **named command** | a write mapped to a domain operation that owns the invariants — `rooms.archive`, `rooms.createDiscussion`. Never `save` | [25](rfc/25-data-write-surface.md) |
| **envelope** | the serializable value one read or write compiles to; what crosses NATS. Also `DataRequest` | [26](rfc/26-data-wire-contract.md) |
| **closed filter DSL** | `where`, accepting only the keys the entity declares. Never a Mongo filter | [24](rfc/24-data-read-surface.md) |
| **the declaration** | `defineEntity({ fields, relations, filters, commands, policy })` — the host mirror of `createApp`. Projection, loader plan, JSON Schema and gate all derive from it | [27](rfc/27-data-host-gateways.md) |
| **projection** | the database field set a selection compiles to, after the field-scope check removes what the grant does not cover | [27](rfc/27-data-host-gateways.md), [43](rfc/43-platform-field-permissions.md) |
| **loader** | per-execution batching and dedupe. Kills N+1; discarded when the handler returns, so there is no staleness contract | [27](rfc/27-data-host-gateways.md) |
| **codec** | the schema-driven encoder/decoder per entity, shared with the client types so they cannot drift | [26](rfc/26-data-wire-contract.md) |

## Permissions, identity, authority

| Term | Means | Decided in |
|---|---|---|
| **scope** | one permission name, optionally parameterized: `'message.read'`, `{ scope: 'networking', domains: [...] }` | [42](rfc/42-platform-permissions.md) |
| **grant** | the set of scopes an admin approved for an installed app. The authority — `permissionsGranted` on the storage item, never the manifest | [42](rfc/42-platform-permissions.md), [43](rfc/43-platform-field-permissions.md) |
| **the catalog** | the closed set of scope names (`AppPermissions`), generated host-side | [42](rfc/42-platform-permissions.md) |
| **gate 1** | does the app's **grant** cover this scope? Runs per envelope or at the client boundary. Default closed | [42](rfc/42-platform-permissions.md) |
| **gate 2** | may this **principal** touch this resource? The workspace's own `hasPermission` / `canAccessRoom` | [host 10](rfc-host/10-identity-app-user.md) |
| **principal** | the identity a host call runs under. The envelope carries a discriminator (`{ kind: 'app' }` / `{ kind: 'actor' }`), never an identity | [host 10](rfc-host/10-identity-app-user.md) |
| **app user** | the user created at install (`<nameSlug>.bot`, `roles: ['app']`). The app's default principal | [host 10](rfc-host/10-identity-app-user.md) |
| **actor** | `ctx.actor` — the authenticated triggering user, stamped by the platform, **not forgeable by the app** | [40](rfc/40-platform-security-and-permissions.md) |
| **the intersection rule** | a call as the actor needs the app's grant **and** the user's own permissions. Never union | [42](rfc/42-platform-permissions.md) |
| **consent** | per-scope admin approval at install; the diff, not the full list, on update | [42](rfc/42-platform-permissions.md) |
| **field-level permission** | `policy.field` — a scope or a principal permission required before a field enters the projection at all | [43](rfc/43-platform-field-permissions.md) |

## Deployment and runtime

| Term | Means | Decided in |
|---|---|---|
| **the monolith** | the Rocket.Chat server process. Answers `ctx` RPCs when the runtime is split out | [41](rfc/41-platform-deployment-and-isolation.md) |
| **apps-runtime service** | the separately-scaled service that hosts uploaded bundles. The "deploy target" | [41](rfc/41-platform-deployment-and-isolation.md) |
| **in-process / remote `ctx`** | the two `ctx` implementations — direct calls, or NATS RPC. **The app bundle is identical either way** | [41](rfc/41-platform-deployment-and-isolation.md) |
| **transport** | the only thing that differs between the two: a local call or a NATS RPC | [27](rfc/27-data-host-gateways.md) |
| **the bundler cross-check** | build-time verification that every used capability's scope is declared. Error for registered capabilities, warning for `ctx` method calls | [42](rfc/42-platform-permissions.md) |
| **the module boundary** | the one `require` an app bundle can reach — `sandboxRequire`. Every builtin, and every bundled npm dependency, passes through it | [host 41](rfc-host/41-runtime-module-boundary.md) |
| **the load record** | one entry per builtin specifier a bundle requires. An inventory, not a counter | [host 41](rfc-host/41-runtime-module-boundary.md) |
| **the traffic record** | per-socket telemetry off `net.client.socket` — host asked for, address resolved, duration, bytes, and the handler call that caused it | [host 41](rfc-host/41-runtime-module-boundary.md) |

---

## Collisions

Each row is a pair of distinct concepts that share a word. Reaching for the
wrong one describes a component that does not exist.

| Word | This | Not this |
|---|---|---|
| **gateway** | the host-side repository for one data entity — policy, projection, loader, codec ([27](rfc/27-data-host-gateways.md)) | any host-side ingress. `ui.open`, `http.*` and `scheduler.*` are gated at the **client boundary** and never reach a gateway ([42](rfc/42-platform-permissions.md)). For the host end of a split runtime, say **the monolith** |
| **client** | the app-side half of a data entity — `ctx.rooms` ([27](rfc/27-data-host-gateways.md)) | the browser. When the distinction matters, "the client boundary" means the `ctx` client, not the UI |
| **command** | a **slash command** — `app.slashCommand`, registered under `commands:` ([12](rfc/12-surface-slash-commands.md)) | a **named write command** — `rooms.archive`, listed under `commands:` in `defineEntity` ([25](rfc/25-data-write-surface.md)). Both spell the key `commands` |
| **surface** | *the app-facing surface* — the API an author writes ([00](rfc/00-overview.md)) | an *interactive surface* — one modal or contextual bar ([16](rfc/16-surface-interactive-ui.md)); or a **ui-kit render surface** — message, modal, banner, attachment, contextual bar, each with its own legal block set |
| **scope** | one permission name ([42](rfc/42-platform-permissions.md)) | the subject of a document ("one scope per document", [CLAUDE.md](CLAUDE.md)) |
| **view** | a data-layer lens over a record — Discussion, Thread ([28](rfc/28-data-views.md)) | ui-kit's `View` / `ModalView` — an instance of a rendered surface. Say **surface instance** ([host 40](rfc-host/40-runtime-continuations.md)) |
| **store** | app-private persistence, `ctx.store` ([17](rfc/17-surface-settings-persistence-lifecycle.md)) | platform data, reached through `ctx.rooms` / `ctx.messages` ([20](rfc/20-data-overview.md)); or Mongo, which is **storage**. One declared collection inside a store is a **store collection** ([host 31](rfc-host/31-store-persistence.md)) |
| **definition** | the inert value a `define*` factory returns, app-side ([10](rfc/10-surface-composition-root.md)) | *the declaration* — `defineEntity`, host-side ([27](rfc/27-data-host-gateways.md)) |
| **selection** | what the app asks for — `select` / `with` ([24](rfc/24-data-read-surface.md)) | the **projection** it compiles to, after the grant removes ungranted fields ([43](rfc/43-platform-field-permissions.md)) |
| **patch** | a listener outcome that modifies the subject ([15](rfc/15-surface-event-listeners.md)) | any host-side field filtering; that is projection. A **monkey patch** — replacing a builtin's export or prototype — is a third thing, and one [host 41](rfc-host/41-runtime-module-boundary.md) rejects |
| **gate** | **gate 1** — the app's grant covers the scope ([42](rfc/42-platform-permissions.md)) | **gate 2** — the principal may touch the resource ([host 10](rfc-host/10-identity-app-user.md)). Both are "the gate" only where one is unambiguous |

## Terms deliberately not used

| Not used | Say instead | Why |
|---|---|---|
| repository, app-side | **client** | the repository is a host structure; the app never sees one |
| `ctx.threads`, `ctx.discussions` | `ctx.messages.replies()`, `ctx.rooms` | they own no record; a peer client would be a lie ([28](rfc/28-data-views.md)) |
| room type `'discussion'` / `'team'` | a **flag** on a channel or private room | four domain room types only ([28](rfc/28-data-views.md)) |
| accessor, builder | **client**, plain object | the legacy shapes the redesign removes ([02](rfc/02-legacy-api-problems.md)) |
| permission (as a bare name) | **scope**, or **grant** for the approved set | "permission" hides whether it is declared or granted ([42](rfc/42-platform-permissions.md)) |
