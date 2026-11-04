# Agent response streams: exploration plan

## 0. How to use this plan

Run Phase 0 first, with one subagent. It builds the shared harness and measures the current approach.
Then run task 9 of Phase 0, the observability stack. Then run H1, H2 and H3, one subagent each.
Run one subagent at a time. Each hypothesis starts from the Phase 0 branch and has two stages:

1. **Implementation.** Build the prototype and prove that it works with the functional checks of section 5. Then stop and report.
2. **Measurement.** Run the matrix of section 5. Run this stage only when the user asks for it.

The prompts for each subagent are in section 13.

Every subagent reads sections 0 to 5, its own section, and section 11.

## 1. Goal

Find the mechanism that delivers agent response deltas to clients at the lowest server cost.
Each exploration produces a prototype, measurements under one shared protocol, and a report.
The reports must let us compare the options with the same numbers.

## 2. What a message update costs today

One update to a message runs this chain. The current approach runs it for every delta.

| Step                                                                                                                                                                        | Where                                                                                                        | Cost                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Read the message, run 3 Apps-Engine pre-events, clone to history if `Message_KeepHistory`, read the room                                                                    | `apps/meteor/server/lib/messages/updateMessage.ts:22-57`                                                     | 2 DB reads, 1 optional insert, 3 Apps-Engine round trips                                                            |
| `Message.beforeSave`: markdown parse, mentions, URL parse, Spotify, quote attachments                                                                                       | `apps/meteor/server/services/messages/service.ts:256-270`                                                    | CPU that grows with the text length                                                                                 |
| `Messages.updateOne`, then `IPostMessageUpdated`                                                                                                                            | `updateMessage.ts:79-93`                                                                                     | 1 DB write, 1 Apps-Engine event                                                                                     |
| Read the message again, run `afterSaveMessage` callbacks, then `Message.afterSave` runs OEmbed and `notifyOnMessageChange`                                                  | `updateMessage.ts:95-106`, `apps/meteor/server/hooks/messages/afterSaveMessage.ts:34`, `service.ts:286-292`  | 2 more DB reads (`notifyOnMessageChange` gets no `data` here), callbacks                                            |
| `api.broadcast('watch.messages')` with the full message                                                                                                                     | `apps/meteor/server/lib/notifyListener.ts:493-499`                                                           | 1 broker event to every instance                                                                                    |
| On every instance: emit to `__my_messages__` with a room read, `canAccessRoom` and a subscription count for each subscriber; emit to the room's `room-messages` subscribers | `packages/streamer/src/listeners.module.ts:256-269`, `packages/streamer/src/notifications.module.ts:148-177` | DB reads per subscriber, per instance. The web client has no `__my_messages__` consumer; other clients can have one |
| On every client in the room: `upsertMessage`, the `streamMessage` callbacks, the `new-message` global event                                                                 | `apps/meteor/client/lib/LegacyRoomManager.ts:171-207`                                                        | a re-render of the full message                                                                                     |

Each update carries the full `IMessage`, with the `md` AST. The total bytes of one reply grow with the square of its length.

## 3. Ground rules for every subagent

- Work in your own git worktree. Start your branch from `poc/agent-stream-harness`. Name it `poc/agent-stream-<id>`, for example `poc/agent-stream-h2`.
- Do not push. Do not open a pull request. Do not post anywhere outside this machine.
- Put all POC code behind the environment variable `AGENT_STREAM_POC=1`. Without it, the server must behave as `develop` does.
- Keep the POC small. Skip production polish, but write each skipped item in the report under "Production gaps".
- Commit your report and your raw results to your branch, at the paths of section 11. Do not leave an artifact that the user or the next subagent needs only in a scratchpad.
- Use your own ports and database. Phase 0: 3000 and 3002. H1: 3110 and 3111. H2: 3210 and 3211. H3: 3300 and 3301. Mongo database name: `agentstream_<id>`.
- Do not use the `mastra-observability-*` Docker containers or their ports: 3001, 3100, 3200, 4317, 4318 and 9090. Use the observability stack of Phase 0, task 9.
- Give the license to the run scripts with `ROCKETCHAT_LICENSE_FILE=/private/tmp/claude-501/-Users-dgubert-dev-RocketChat-worktrees-main/db4740ae-bf22-4d3a-8a01-f77e259cc97b/scratchpad/agent-stream/license.txt`. Do not commit the license, and do not write its value in a report.
- Do not commit the seed file. It holds the login tokens of the viewers.
- Take the measurement lock before each load run. Parallel load runs share the CPU and spoil each other's numbers.
  - Take it with `mkdir /private/tmp/claude-501/-Users-dgubert-dev-RocketChat-worktrees-main/db4740ae-bf22-4d3a-8a01-f77e259cc97b/scratchpad/agent-stream/bench.lock`.
  - If `mkdir` fails, wait 60 seconds and try again.
  - Release it with `rmdir` on the same path after the run, also when the run fails.
  - Builds and functional checks need no lock.
- Use the Phase 0 harness. Do not change the scenario definitions. If a scenario cannot run for your mechanism, write the reason in the report.
- Record the machine: CPU model, core count, RAM, Node version, and the server mode (production build or `yarn dev`).
- If a design point blocks you for a long time, write it as an open question and continue.
- Follow `docs/database-access.md` for any new database operation, also in the POC.

## 4. Shared contract

All mechanisms implement the same behavior, so the numbers compare.

**Persistence.** At the start, the producer sends one normal message, the placeholder. It carries the first `blocks` of "Agent message flow" and the marker `streaming: { id, state: 'active' }`.
At the end of the LLM response, one `updateMessage` writes the full message. Its `blocks` are the placeholder `blocks` with all the accumulated deltas applied.
The same write sets `state` to `'done'`, `'stopped'` or `'error'`.
No other database write happens between the placeholder and this final write. H3 is the only exception, because it tests that write.

**Delta shape.** A delta changes the `blocks` of the message (`IMessage.blocks`, a UiKit `MessageSurfaceLayout`). Blocks are the visual elements that the UI renders.

```ts
// A path into IMessage.blocks: array indexes and object keys, in order. [] is the blocks array itself.
type BlockPath = readonly (string | number)[];

type BlockOp =
	// On an array, push the value. On a string, concatenate the value.
	{ op: 'append'; path: BlockPath; value: unknown } | { op: 'set'; path: BlockPath; value: unknown };

type AgentDelta =
	| { t: 'patch'; streamId: string; seq: number; ops: BlockOp[]; ts: number }
	| { t: 'end'; streamId: string; seq: number; reason: 'done' | 'stopped' | 'error'; ts: number };
```

- `seq` starts at 1 and increases by 1 for each delta. A coalesced delta has one `seq`.
- `ts` is the producer clock in milliseconds. The harness uses it for latency.
- The client applies the `ops` of a delta in order. A path uses explicit indexes. The producer always knows them, because blocks are only appended at the end.
- One shared function, `applyBlockOps(blocks, ops)`, applies the operations. The producer's snapshot, the client overlay, the harness check and the final `updateMessage` all use it.
- On `end`, the producer sets the status of the last open task itself (`complete`, or `error` for `'error'`), before the final `updateMessage`. The `end` delta carries no `ops`.

**Coalescing.** Within the window W, the producer merges the operations of a delta:

- Consecutive `append` operations on the same string path merge into one.
- An `append` that creates an item, followed by text appends into that item, folds into the initial text of the item.

**Agent message flow.** The blocks of an agent reply change in three ways. A later revision covers more LLM turns after the output.

1. The placeholder carries two blocks: an `alert` block, and a `plan` block with one task in `in_progress`.

   ```json
   {
   	"blocks": [
   		{
   			"type": "alert",
   			"level": "info",
   			"text": { "type": "plain_text", "text": "The agent is working on your request." }
   		},
   		{
   			"type": "plan",
   			"title": "Fix the login bug",
   			"tasks": [{ "task_id": "step-0", "title": "Read the issue", "status": "in_progress" }]
   		}
   	]
   }
   ```

2. Each LLM turn adds one task to the `tasks` array of the `plan` block. The task describes the current step: thinking or a tool call.
   The new task has the status `in_progress`. The previous task changes to `complete`.
   - The thinking text streams into the `details` of the task, a `rich_text` block with one `rich_text_section` and one `text` element.
   - The title of a tool call task is the call description, or the arguments as JSON when the call has no description.
3. When the model writes text for the user, the producer appends a new `section` block at the end of `blocks`, with the text as `mrkdwn`.
   Each later output delta appends its text to the `text.text` of that block.

   ```json
   {
   	"actionId": "eee7fc17",
   	"type": "section",
   	"text": {
   		"type": "mrkdwn",
   		"text": "This is a mrkdwn section block :ghost: *this is bold*, and ~this is crossed out~, and <https://google.com|this is a link>"
   	}
   }
   ```

The operations for each step, from the placeholder above (`plan` at index 1, task 0 in progress):

| Step                               | `ops`                                                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A new thinking task                | `set [1,'tasks',0,'status'] 'complete'`, then `append [1,'tasks'] { task_id, title: 'Thinking', status: 'in_progress', details: { type: 'rich_text', elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: '' }] }] } }` |
| A thinking text delta for task `n` | `append [1,'tasks',n,'details','elements',0,'elements',0,'text'] '<text>'`                                                                                                                                                                  |
| A tool call                        | `set [1,'tasks',n,'status'] 'complete'`, then `append [1,'tasks'] { task_id, title: '<description or arguments>', status: 'in_progress' }`                                                                                                  |
| The first output delta             | `set [1,'tasks',n,'status'] 'complete'`, then `append [] { type: 'section', text: { type: 'mrkdwn', text: '<text>' } }`                                                                                                                     |
| A later output delta               | `append [2,'text','text'] '<text>'`                                                                                                                                                                                                         |

**Snapshot.** The producer's process holds `{ blocks, seq }` for each active stream.
`blocks` is the current `MessageSurfaceLayout`: the `alert` block, the `plan` block with the status of each task, and every `section` block with the text received so far.
`seq` is the `seq` of the last delta that changed `blocks`.
A late viewer, or a viewer after a reconnect, gets the snapshot, then applies only the deltas with `seq > snapshot.seq`.
The viewer drops duplicates and detects gaps. Each hypothesis decides how the viewer gets the snapshot.

**Display.** Until the end, the client shows the snapshot plus the deltas. After the end, it shows the persisted message.
The `blocks` that the client shows at the end must equal the persisted `blocks`. This includes a stop in the middle of a reply.

**Producer.** A fake producer runs inside a Rocket.Chat server process. In D2 it runs on instance A only.

**Out of scope.** The issue of the session id, a real LLM or agent runtime, ingestion from a process outside Rocket.Chat, UI design, and the mobile and desktop implementations. Give an effort estimate for the other clients only.

## 5. Measurement protocol

**Fake producer.** A fixed reply of 1,000 tokens at 40 tokens per second (25 seconds per reply), in the order of "Agent message flow":
150 thinking tokens, one tool call, 150 thinking tokens, then 700 output tokens (about 3 KB of markdown, with a code block and a list).
The coalescing window W is 0, 50 or 250 ms. With W = 0 the producer sends each token as one delta.

**Deployments.**

- D1: one monolith instance.
- D2: two monolith instances on one Mongo, with the instance broker active. This needs `ROCKETCHAT_LICENSE` with the `scalability` module (see `docs/service-brokers.md`, "The cluster transport"). The producer runs on A. Half of the viewers connect to A, half to B.
- D3 (optional): microservices with ddp-streamer and NATS, as in `docker-compose-ci.yml`. Run it only if D2 does not separate the options.

**Scenarios.**

| ID  | Streams              | Viewers for each stream                           | Purpose                         |
| --- | -------------------- | ------------------------------------------------- | ------------------------------- |
| S1  | 1                    | 1                                                 | latency floor                   |
| S2  | 1                    | 500, in one channel                               | fan-out to a large room         |
| S3  | 100 at the same time | 2                                                 | many small rooms, as in DMs     |
| S4  | 0                    | 1,000 idle viewers with the room open             | standing cost of the mechanism  |
| S5  | 100 at the same time | 2; every 10 seconds, 10% of the viewers reconnect | resume and snapshot correctness |

- Each viewer is a distinct user, a member of the room, with the room open as the web client opens it.
- Run each cell 3 times and report the median.
- The matrix is S1 to S5, times D1 and D2, times W = 0, 50 and 250. S4 has no W.
- Only stage 2 runs the matrix.

**Functional checks (stage 1).** They prove that the mechanism works. Their numbers are not results.
Run each check once, at W = 50, with `--tokens 200` (see `HARNESS.md`).

| Check                                        | Deployment | What it proves                                                                |
| -------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| S1                                           | D1 and D2  | A viewer gets every delta, also from the other instance                       |
| S2                                           | D2         | The fan-out to 500 viewers works                                              |
| S5                                           | D2         | Resume and snapshot work                                                      |
| `failures.mjs`: `stop`, `kill` and `restart` | D2         | The failure modes of section 11, item 7                                       |
| The web client                               | D1         | The overlay shows the stream, and the final blocks equal the persisted blocks |
| The proxy of `docker-compose-ci.yml`         | D1         | The mechanism works behind the proxy                                          |

A check passes when the delta channel has no gap, no duplicate, no wrong order and no blocks mismatch.
Fix the prototype until every check passes. If a check cannot pass, write the reason in the report.

**Metrics.**

| Metric                                                                                 | Source                                                                                    |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Server CPU ms per delivered delta, and CPU %                                           | `process.cpuUsage()` in each server, through the harness metrics endpoint                 |
| Event loop delay p99                                                                   | `monitorEventLoopDelay` (the health route uses it: `apps/meteor/server/routes/health.ts`) |
| RSS and heap; memory for each open connection in S4                                    | `process.memoryUsage()`                                                                   |
| Mongo reads and writes per reply                                                       | `db.serverStatus().opcounters`, before and after the run                                  |
| Broker events per reply, and bytes on the cluster transport                            | a counter in the `InstanceService` send path (D2)                                         |
| Bytes on the wire for each viewer per reply                                            | load generator                                                                            |
| Latency from producer to viewer: p50, p95, p99                                         | `ts` against the receive time. One host, so one clock                                     |
| Correctness: gaps, duplicates, wrong order, final blocks not equal to persisted blocks | load generator                                                                            |
| Web client main-thread time per delta (S1 only, secondary)                             | Playwright with the Performance API long-task entries                                     |

**Observability stack.** Use it in stage 1 and to find the cause of a result. Phase 0 measured the baseline without it.
So a stage 2 run keeps its instrumentation off: no `TRACING_ENABLED` and no `Prometheus_Enabled` on the servers.
The numbers of the report come from the harness results only.

## 6. Phase 0: harness and baseline

**Goal.** Build one harness for all hypotheses. Measure the current approach (one `updateMessage` per delta) as the baseline.

**Build these parts:**

1. A worktree branch `poc/agent-stream-harness` from `develop`.
2. The fake producer: a server module behind `AGENT_STREAM_POC=1`, with a sink interface: `start(placeholder)`, `delta(delta)`, `end(delta)`. The baseline sink calls `updateMessage` with the accumulated text for each delta. A dev-only route or method starts N streams in given rooms.
3. A dev-only metrics endpoint that returns the counters from section 5 and resets them.
4. The broker counter in the cluster transport (`apps/meteor/ee/server/local-services/instance/service.ts`).
5. A seed script: N users, the rooms, the memberships, and a login token for each user.
6. A load generator in Node, outside the Meteor bundle. It starts the viewers through a transport adapter interface: `connect`, `open(rid | streamId)`, an async iterator of deltas or message updates, `close`. It ships the DDP `room-messages` adapter for the baseline. It writes one JSON result per run. A summary script turns the results into the report tables.
7. Run scripts for D1 and D2 that take the ports and the database name as arguments.
8. The baseline run: the full matrix with the `updateMessage` sink.
9. The observability stack of the experiments: `agent-stream/docker-compose-observability.yml`. Do not reuse the `mastra-observability-*` containers.
   - Start from `development/docker-compose-monitoring.yml` and its config files: Tempo, the OpenTelemetry collector, Prometheus and Grafana.
   - Give it its own compose project name and its own volumes. Bind each port to `127.0.0.1`. Choose host ports that collide with none of the ports of section 3.
   - Prometheus scrapes the exporter of each instance. Two instances share one host, so give each one its own `PROMETHEUS_PORT`.
   - Do not scrape the harness metrics endpoint. A read resets its counters.
   - The servers send traces with `TRACING_ENABLED=yes`. The exporter sends to `localhost:4317` by default, which is the `mastra` collector. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to the collector of this stack.
   - Add one switch to `start-instance.sh` that turns the exporter and the traces on. Keep it off by default (section 5, "Observability stack").
   - Provision the Grafana data sources. A dashboard is optional.
   - Prove it: in D2, Prometheus scrapes both instances, and Tempo shows the traces of both.

**Decide and record** the server mode. Prefer a production build if you can make one work. Otherwise use `yarn dev` and read the CPU from inside the server process only. All hypotheses then use the same mode.

**Deliverables.**

- The branch `poc/agent-stream-harness`, committed.
- `HARNESS.md` at the root of the branch: how to run each deployment and scenario, how to add a sink, how to add an adapter, and how to start and stop the observability stack.
- The report `docs/experiments/agent_streams/reports/H0-baseline.md` (path in section 11).

## 7. H1: an SSE endpoint

**Hypothesis.** An HTTP stream for each viewer, for example `GET /api/v1/agent.stream/{streamId}`, carries deltas at a lower server cost than the update path, and at a cost lower than or equal to DDP.

Answer each design point in the report.

1. **Route.** Use a Hono route on `httpApp` or a REST v1 route (`docs/features/http-server.md`, "Adding a route"). Hono's `streamSSE` comes from `hono/streaming`, a subpath export. That doc says Meteor's bundler cannot load such exports from app code. Expose it from `@rocket.chat/http-router`, or write the SSE frames on the Node response.
2. **Auth.** `EventSource` cannot send the `X-User-Id` and `X-Auth-Token` headers. Compare `fetch` with a `ReadableStream` (headers work; reconnect and `Last-Event-ID` are manual) against `EventSource` with a short-lived, single-use stream token. Choose one and give the reason.
3. **Long-lived response.** The server sets a 5-second idle socket timeout unless `HTTP_SOCKET_TIMEOUT_MS` is set (`apps/meteor/server/lib/http/httpServer.ts:34-40`). Find what keeps an SSE response open. Choose a heartbeat interval. Check the Traefik proxy in `docker-compose-ci.yml` for response buffers. List what nginx needs, for example `X-Accel-Buffering: no`.
4. **Connections per origin.** Browsers allow 6 HTTP/1.1 connections per origin. Test the REST calls of a tab with 3 or more open streams, and with 2 or more tabs. Say whether HTTP/2 at the proxy becomes a requirement.
5. **Cross-instance delivery. This is the main question.** The SSE request lands on any instance, and the producer runs on A. Evaluate these in D2:
   - a. Relay each delta as a broker event to every instance, as the `stream` relay does (`packages/streamer/src/notifications.module.ts:60`). Measure it.
   - b. Targeted delivery: a registry of streamId to the instances that have viewers, and a send to those instances only. Measure it if a POC fits in a reasonable effort; otherwise estimate it.
   - c. Serve the stream from the producer's instance, with sticky routes by stream id. Assess the feasibility with the standard proxies. Build nothing if it is not feasible.
6. **Resume.** Use `seq` as the SSE `id:`. On a reconnect, the server sends the snapshot, then the next deltas.
7. **Microservices.** The proxy sends `/api` to the monolith, not to ddp-streamer. State the consequence for where SSE connections end and for the instance count.
8. **Web client.** Add a hook that opens the stream for a message with `streaming.state === 'active'`. It keeps an overlay of the text and changes to the persisted message at the end.
9. **Other clients.** List what mobile (React Native has no native `EventSource`), desktop and the livechat widget need. Estimate only.

**Harness additions.** An SSE viewer adapter and an SSE sink.

## 8. H2: a DDP stream on the existing WebSocket

**Hypothesis.** The existing WebSocket and stream infrastructure carries deltas at a low cost. A stream emit touches no database and sends one pre-encoded frame to each subscriber.

Answer each design point in the report.

1. **Stream.** Compare two options. Measure the standing cost of each in S4.
   - a. A new event on `notify-room`: `<rid>/agent-delta`. The read permission runs once, at subscribe (`packages/streamer/src/notifications.module.ts:196`). The emit rule defaults to `all` (`packages/streamer/src/streamer.module.ts:56`).
   - b. A dedicated stream keyed by streamId. The client subscribes only while a message with an active stream is on the screen.
2. **Do not use `room-messages`.** Its `__my_messages__` event runs DB reads for each subscriber (`notifications.module.ts:148-177`), and it carries full messages.
3. **Fan-out.** `Streamer.emit()` relays each emit to every instance as the broker event `stream` (`streamer.module.ts:270-273`; `docs/service-brokers.md`, "Stream relays"). Measure the broker events and bytes in D2 for each W. Sketch a relay that targets only the instances with subscribers. Build it only if the D2 numbers show that the relay is the largest cost.
4. **Delivery loop.** `StreamAdapter.sendToManySubscriptions` awaits `isEmitAllowed` and `sendFrames` for each subscriber, one after the other (`packages/ddp-server/src/streams/StreamAdapter.ts:39-60`). Measure the latency spread across the 500 viewers of S2. Say whether the loop needs a change.
5. **Frame.** Confirm that the emit uses the pre-encoded frame path, with no transform function. Report the frame size for each delta.
6. **Resume.** After a reconnect, the client subscribes again, then calls a method for the snapshot `{ blocks, seq }`. It keeps the deltas that arrive before the snapshot and applies those with a higher `seq`.
7. **Microservices.** Emits from the monolith reach ddp-streamer through the `stream` relay (`docs/adr/0005-stream-fan-out-rides-the-service-broker.md`). Run D3 if time allows.
8. **Web client.** Add the subscription and the same overlay behavior as H1.
9. **Other clients.** Mobile and livechat use DDP already. Estimate the effort.

**Harness additions.** A DDP stream viewer adapter and a stream sink.

## 9. H3: lean, coalesced message updates

**Hypothesis.** With a coalescing window of 250 to 1,000 ms and a lean update path, the existing message update flow is cheap enough.
If this is true, no client needs a change: every client renders message updates today. This is the option with the least new code, so it must be disproved with numbers, not assumed false.

Answer each point in the report.

1. **Wider windows.** Add W = 500 and W = 1,000 ms to the Phase 0 baseline, with the current `updateMessage`.
2. **Lean sink.** Add one model method, for example `Messages.setStreamTextById(_id, msg)`, with a `$set` of the text only (`docs/database-access.md`). The sink skips the Apps events, the history, the `beforeSave` parse and the `afterSave` callbacks. It broadcasts with `notifyOnMessageChange({ id, data })`, so it does not read the message again. The final write at the end uses the full `updateMessage`.
3. **What remains.** Measure the DB write, the `watch.messages` event, the work for each subscriber in `ListenersModule`, and the growth of the payload.
4. **Partial payload.** Test a broadcast of only `_id`, `rid`, `msg` and `_updatedAt`. Check whether `upsertMessage` (`apps/meteor/client/lib/RoomHistoryManager.ts:32`) accepts a partial message. Say what the mobile client needs for it.
5. **Markdown.** Without `beforeSave`, `md` stays old during the stream. Find how the web client renders a message without a current `md`, and what a client-side parse costs per update.
6. **Side effects.** List every consumer of a message write and of the `watch.messages` event: callbacks, Apps events, outgoing integrations, notifications, read receipts, search indexes, the "edited" mark. Say which ones the lean path skips, and whether each skip is acceptable while the stream is active.

**Harness additions.** The lean sink. The baseline adapter from Phase 0 already reads message updates.

## 10. Options not included

- **WebTransport or WebRTC data channels.** No gain over a WebSocket for text from server to client. Browser and proxy support is narrower.
- **A second WebSocket without DDP.** The same cross-instance problem as SSE, plus a second socket for each client.
- **Deltas in a capped Mongo collection with change streams.** This puts every delta back in the database.
- **Clients that connect to the agent runtime directly.** This removes Rocket.Chat from the data path, but it depends on the design of the agent runtime, which is out of scope. Reconsider it when that design exists.

## 11. Report template

Write the report to `docs/experiments/agent_streams/reports/<id>.md` in your branch.
Write the raw results to `docs/experiments/agent_streams/reports/<id>-results/`. Commit both.

Stage 1 writes every section except section 4, and marks section 4 "pending stage 2".
When a design point asks for a measurement, stage 1 builds what the measurement needs and writes "stage 2" in place of the number.
Stage 2 fills section 4 and these numbers, then revises the verdict.

1. **Verdict.** One paragraph: does the hypothesis hold, and under which limits.
2. **Prototype.** The branch, the files that changed, how to run it.
3. **Machine and mode.**
4. **Results.** One table per deployment: rows are scenarios and W, columns are the metrics of section 5.
5. **Correctness.** Gaps, duplicates, wrong order, and blocks mismatches: for each functional check in stage 1, and for each scenario in stage 2.
6. **Design points.** One answer for each numbered point of your section.
7. **Failure modes.** Test and describe: a viewer reconnect; a restart of the instance that serves a viewer; a producer that dies before `end` (what the client shows, and what happens to the placeholder); a stop in the middle of a reply.
8. **Client effort.** The web client (done in the POC) and an estimate for each other client.
9. **Production gaps.** What the POC skipped.
10. **Open questions.**

## 12. How to compare the results

**Hard gates.** An option that fails one of these is rejected.

- No gaps and no duplicates on the delta channel in S5. The gate does not cover the final `updateMessage`.
  Phase 0 found a race in `updateMessage`: it reads the message again after the write. The race gives rare gaps and duplicates in the baseline. It is a separate issue.
- The `blocks` that the client shows at the end equal the persisted `blocks`, also after a stop.
- It works behind the proxy of `docker-compose-ci.yml`.
- S2 p99 latency is below 1 second at W = 50. This threshold is a proposal; adjust it before the runs.

**Ranking**, in this order:

1. Server CPU per delivered delta, in D2.
2. Broker bytes per reply, in D2.
3. Mongo writes per reply.
4. Standing cost, from S4.
5. The work for all clients, not only the web client.
6. The size of the POC code.

## 13. Subagent prompts

Use `subagent_type: "agent-stream-explorer"` (defined in `~/.claude/agents/agent-stream-explorer.md`). Run one subagent at a time.
The plan and the reports live in the branch `poc/agent-stream-harness`, in `docs/experiments/agent_streams/`.

**Phase 0** is done. Its report is `docs/experiments/agent_streams/reports/H0-baseline.md`.

**Phase 0, task 9** (no isolation; it works in the harness worktree):

> You run task 9 of Phase 0 of the agent stream plan. Work in the worktree `/Users/dgubert/dev/RocketChat/worktrees/main/.claude/worktrees/agent-aa21275e3f8eb1e66`, on the branch `poc/agent-stream-harness`. Do not create another worktree or branch. Read `docs/experiments/agent_streams/PLAN.md`: sections 0, 3, 5 and 6. Then read `HARNESS.md`. Build the observability stack of task 9 and prove that it works as task 9 says. Stop the stack and the servers after the check. Add the stack to `HARNESS.md`, and commit. Do not push, open a pull request, or post anywhere. When you finish, reply with the files that changed, the ports of the stack, and a summary of 5 lines or less.

**H1, H2, H3, stage 1** (with `isolation: "worktree"`; replace `<id>` with `h1`, `h2` or `h3`, and `<n>` with 7, 8 or 9):

> You run stage 1 (implementation) of exploration `<id>` of the agent stream plan. In your worktree, create the branch `poc/agent-stream-<id>` from `poc/agent-stream-harness` and switch to it. Read `docs/experiments/agent_streams/PLAN.md`: sections 0 to 5, section `<n>`, and section 11. Follow the ground rules in section 3 exactly. Read `HARNESS.md` first. The baseline report is `docs/experiments/agent_streams/reports/H0-baseline.md`. Build the prototype, then run the functional checks of section 5 until they pass. Do not run the matrix. Write the stage 1 report as section 11 says, and commit it. Do not push, open a pull request, or post anywhere. When you finish, reply with the report path, the branch name, and a summary of 5 lines or less.

**H1, H2, H3, stage 2** (only when the user asks; no isolation; replace `<id>` and `<n>` as above):

> You run stage 2 (measurement) of exploration `<id>` of the agent stream plan. Stage 1 is done on the branch `poc/agent-stream-<id>`. Find the worktree of that branch with `git worktree list`, and work there. Read `docs/experiments/agent_streams/PLAN.md`: sections 0 to 5, section `<n>`, and section 11. Then read `HARNESS.md` and the stage 1 report `docs/experiments/agent_streams/reports/<id>.md`. Follow the ground rules in section 3 exactly, including the measurement lock. Run the matrix of section 5. Fill the stage 2 parts of the report as section 11 says. Commit the report and the raw results. Do not push, open a pull request, or post anywhere. When you finish, reply with the report path and a summary of 5 lines or less.
