# Experimental REST API endpoints

> Developer guide. For how the mechanism is built, see
> [experimental-api-endpoints-plan.md](experimental-api-endpoints-plan.md).

## What they are

Experimental endpoints live under `/api/experimental/...` and carry an explicit
stability contract:

> Endpoints under `/api/experimental/...` are **unstable**. They may change shape or be
> removed in **any** release — without notice and without a deprecation cycle. No semver
> promise attaches to this namespace.

Compare with `/api/v1/...`, which is the official, stable surface: its endpoints follow
semver, breaking changes require a major-version bump, and removals go through a
deprecation cycle.

## Why they exist

We sometimes need to ship something to production *before* its API shape has settled:

- A new feature whose request/response contract is still being learned from real usage.
- An endpoint built for a specific client (e.g. our own UI) where we are not yet ready
  to commit to it as a public, supported interface.
- Something we want behind a clear "use at your own risk" sign while it matures.

Without an experimental lane, the only choices are bad ones: either freeze a design we
are not confident in onto `/v1` (and then carry it forever, or break it with a major
bump), or keep the feature out of production until the API is perfect. Experimental
endpoints give a third path — ship now, iterate freely, commit later.

## Should I use one? — decision guide

**Use an experimental endpoint when:**

- The request/response shape is likely to change as the feature matures.
- You want production traffic / real feedback before committing to a contract.
- The consumer is internal or opted-in, and can tolerate breaking changes between
  releases.
- You would otherwise be tempted to "just put it on `/v1` for now and fix it later."

**Do NOT use an experimental endpoint when:**

- The endpoint is meant for third-party integrators who expect stability. They should
  not have to track breakage release-to-release.
- The contract is already well understood and unlikely to change — put it on `/v1`.
- You are tempted to use `experimental` as a permanent home to avoid the discipline of
  a stable API. It is a staging area, not a dumping ground (see below).

## Expectations if you publish one

- **It is not forever.** Every experimental endpoint is expected to either be
  **elevated to `/v1`** once its contract stabilizes, or be **removed** if it does not
  pan out. An endpoint that sits in `experimental` indefinitely is a smell — it means a
  decision is overdue.
- **Callers are warned at runtime.** Every experimental response carries
  `x-experimental: true` — that is the supported signal to detect and surface in client
  code. Responses also carry a `Warning: 299 ...` header, kept only for legacy tooling
  that still reads it: RFC 9111 obsoletes the `Warning` header and its warn codes, so do
  not build new client logic on it.
- **Typed clients must opt in.** Experimental endpoints are declared in a separate
  `ExperimentalEndpoints` type, not in the main `Endpoints` union, so the stable SDK
  surface stays honest. Consumers import them deliberately.
- **Use the typed API only.** Register with `.get()` / `.post()` / `.put()` /
  `.delete()` and AJV validators. Do not use `.addRoute()`: it is already deprecated
  across the whole API, and a namespace created to iterate on new contracts is the last
  place that should add to the legacy path.

## Lifecycle: experimental → official

```text
                 stabilizes
   experimental ───────────────▶  v1 (official, semver-stable)
   (/api/experimental/x)           (/api/v1/x)
        │
        │ does not pan out
        ▼
     removed (no deprecation cycle needed)
```

**Elevating to `/v1`:**

1. Confirm the contract is stable and you are ready to support it under semver.
2. Add the endpoint under `/v1`: register it on `API.v1` and declare its types in the
   appropriate `*Endpoints` type that *is* part of the `Endpoints` union.
3. Optionally keep the experimental path forwarding to the new `/v1` path for a
   transition window so existing callers are not broken on the day of promotion.
4. Remove the experimental declaration once the transition window closes.

**Removing an experimental endpoint** needs no deprecation cycle — that freedom is the
whole point of the namespace. Still, log the removal and give a heads-up to any known
consumers as a courtesy.

## Guardrails & tooling

- **No path lives in both unions.** A duplicate key would silently attach a semver
  obligation to a path advertised as unstable, so promotion means *moving* the declaration
  to a stable `*Endpoints` type, not leaving a copy behind. Nothing enforces this — the
  `/experimental/` path prefix keeps the two unions from overlapping in practice.
- **Generated API docs intentionally skip experimental endpoints.** OpenAPI /
  doc generation scans the `Endpoints` union, which experimental paths are
  deliberately kept out of, so they do not appear in public API docs. This is
  by design: an unstable surface should not be advertised as part of the
  documented contract. The runtime `x-experimental` / `Warning` headers and
  this guide are how the namespace is surfaced instead.
- **Metrics are the promotion signal.** Experimental traffic is recorded in the
  REST API Prometheus metrics under `version=experimental`, so real usage can
  inform whether an endpoint is ready to graduate to `/v1` or should be removed.

## TL;DR

Experimental endpoints let you ship an API to production while its shape is still in
flux, without locking yourself into semver. They are a **staging area, not a permanent
home**: every one is expected to graduate to `/v1` or be removed. If you need stability
guarantees, use `/v1`. If a third party will depend on it, use `/v1`.
