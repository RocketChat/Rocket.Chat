# What we studied in Mastra

> Part of the [Apps Engine SDK RFC](README.md).

[Mastra](https://github.com/mastra-ai/mastra) is a TypeScript framework for
AI agents/workflows. Its domain (LLMs) is not ours, but its **developer-facing
API architecture** is exactly the kind of modern, type-first design the apps
engine should adopt. The patterns we took:

1. **A single composition root.** A Mastra project is `src/mastra/index.ts`
   exporting `new Mastra({ agents, workflows, tools, storage, logger, server,
   deployer, bundler, mcpServers, … })`. Everything is registered *by value* in
   one object and retrieved by key (`mastra.getAgent('weatherAgent')`). There is
   no base class to extend.

2. **Factory functions that return typed, self-validating definitions.**
   `createTool({ id, description, inputSchema, outputSchema, execute })`,
   `createWorkflow(...)`, `createStep(...)`, `defineSchedule(...)`. Each takes a
   config object and validates it at author time; authoring mistakes throw on
   import, not on first use.

3. **Schema-first everything.** Inputs/outputs/resume/suspend are described by
   [Standard Schema](https://standardschema.dev) (Zod v4, Valibot, ArkType). The
   runtime validates untrusted input at the boundary; the handler payload type is
   *inferred* from the schema. The platform can also emit JSON Schema for docs
   and cross-process validation.

4. **One injected params object (dependency injection).** A step/tool `execute`
   receives a single object — `{ mastra, requestContext, inputData, state,
   setState, suspend, bail, abort, getStepResult, writer, … }` — never a
   positional accessor list. Registration is the injection seam: registering a
   primitive calls `__registerMastra(this)` and
   `__registerPrimitives({ logger, storage, … })` to push shared deps in.

5. **Suspend / resume for human-in-the-loop.** A step calls `suspend(payload)`;
   the run is persisted to storage and resumed later with `resumeData`. This
   turns multi-turn, wait-for-a-human flows into ordinary straight-line code.

6. **Composable control flow.** Workflows chain `.then()`, `.parallel()`,
   `.branch()`, `.dowhile()`, `.dountil()`, `.foreach()`, `.map()`, `.sleep()`,
   then `.commit()`.

7. **Declarative + imperative scheduling.** A workflow can declare a schedule
   inline (`createWorkflow({ schedule: { cron } })`) or be scheduled at runtime
   (`mastra.schedules.create({ workflowId, cron, inputData })` / `.list` /
   `.pause` / `.delete`).

8. **Custom HTTP routes** via `registerApiRoute(path, { method, handler })`,
   where the handler reaches the instance through `c.get('mastra')`.

9. **A runtime context object** (`RequestContext`) — a typed key/value bag
   threaded through execution, with **reserved keys set by middleware that take
   precedence over client-provided values** (so a caller can't forge the acting
   identity). We reuse this idea for the app's `ctx.actor`.

10. **Deployer / bundler abstraction** — pluggable build + deploy targets.

11. **Processor model for interception** — `processInput` / `processOutput`
    either **return a modified value** or call **`abort(reason)`** to stop. We map
    this directly onto pre-event listeners (modify vs. prevent).

