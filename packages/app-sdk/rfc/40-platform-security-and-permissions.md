# Security & permissions

> Part of the [Apps Engine SDK RFC](README.md).

- **Non-forgeable actor.** `ctx.actor` is set by the platform from the
  authenticated trigger, following Mastra's reserved-request-context-key pattern
  (middleware-set values beat client-provided ones). Apps cannot claim to be
  another user; acting on someone's behalf is the explicit, permission-gated
  `asUser` option.
- **Declared permissions.** The manifest lists `permissions` from the same
  catalog as today (`message.write`, `scheduler`, `networking`, …). Because
  capabilities are declared in code, the **bundler can cross-check** that every
  used capability's permission is present — a lint the legacy runtime-registration
  model cannot do.
- **Validated boundaries.** Every schema is a trust boundary; untrusted input is
  validated before your handler runs.
- **Host-stamped result metadata.** When a listener blocks an action, the
  message the user sees names the app that blocked it. The runtime reads that
  name and the app's translations off the app record and stamps them onto the
  outcome; metadata an app sends itself is overwritten, never merged. This is the
  `ctx.actor` rule applied to a return value — see
  [the event listeners](15-surface-event-listeners.md#prevent-carries-a-reason-the-host-can-translate).
