# 03 — Metrics shape

**PR 0** · **ADR decision 8** · **Depends on:** [01](01-protocol-project-skeleton.md)

## Goal

Give `protocol/` the metrics payload type. The payload is `{ pid }`, and it rides the IPC channel
as a `metrics` notification.

## Scope

| File | Change |
| --- | --- |
| `packages/apps/protocol/src/framing/metrics.ts` | new — the `AppMetrics` type |
| `packages/apps/base-runtime/src/lib/metricsCollector.ts` | type `collectMetrics()` as `AppMetrics` |
| `packages/apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts` | type the `metrics` notification params |

## Steps

1. Declare `AppMetrics = { pid: number }` in `protocol/src/framing/metrics.ts`.
2. Annotate the return type of `collectMetrics()`.
3. Annotate the `case 'metrics'` branch of `handleIncomingMessage` so the `debug()` call reads a
   typed payload rather than `unknown`.

## Done when

- [ ] `metrics.ts` imports nothing.
- [ ] Both halves reference `AppMetrics`, and neither restates the shape.
- [ ] `metricsCollector.test.ts` passes unchanged.

## Size

~10 lines. No behavior change.
