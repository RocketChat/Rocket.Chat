# Deployment & isolation

> Part of the [Apps Engine SDK RFC](README.md).

The stated apps-engine goal is to **isolate app execution into a microservice**
so app scaling is decoupled from the monolith, communicating over NATS via a
single `AppsEngineService` entrypoint.

This API makes that a *packaging* decision rather than an app rewrite, because of
principle #6: **apps touch the platform only through `ctx`.** `ctx` is an
interface; the runtime supplies either

- an **in-process** implementation (calls straight into the monolith — today's
  behavior), or
- a **remote** implementation whose methods are NATS RPC calls to the monolith.

The app bundle is identical either way. This is the same move Mastra makes with
its Deployer/bundler abstraction ("build once, run/deploy anywhere"), adapted to
our multi-tenant, upload-a-bundle model: the "deploy target" is the
**apps-runtime service** that hosts uploaded bundles.

What makes `ctx` remote-friendly:

- Every `ctx` method is **async** already.
- Every payload that crosses the boundary has a **schema** → JSON-Schema
  validation on both sides, and a natural serialization contract.
- Suspend/resume state is **persisted** (durable continuations survive the RPC
  boundary and process restarts) — the same property Mastra relies on.
- Every value an app returns is **plain data**. A class instance would arrive
  stripped of its prototype and methods, so a returned outcome carries a
  reserved marker rather than a type — see
  [the event listeners](15-surface-event-listeners.md#the-outcome-must-survive-the-transport).
  The same property gives the engine a non-exceptional prevention channel,
  so blocking an action does not mean throwing across the transport.

**Packaging is unchanged:** TypeScript → transpile → bundle → zip → upload.

**Helm.** Deploying Rocket.Chat is recommended via the Helm chart; running the
apps runtime as its own deployment is a small, additive amount of chart config:

```yaml
# values.yaml (illustrative)
appsEngine:
  runtime:
    enabled: true          # false → in-process (single-node / dev)
    replicas: 2
    resources:
      requests: { cpu: 250m, memory: 512Mi }
      limits:   { cpu: "1",  memory: 1Gi }
    autoscaling: { enabled: true, minReplicas: 2, maxReplicas: 10, targetCPUUtilizationPercentage: 70 }
  nats:
    # reuses the chart's existing NATS; subject prefix for apps RPC
    subjectPrefix: rocketchat.apps
```

When `runtime.enabled: false`, the same bundles run in-process — no app changes.

