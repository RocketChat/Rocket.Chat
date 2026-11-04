# Agent stream harness

The shared harness of the agent response stream exploration (plan: `scratchpad/agent-stream/PLAN.md`, sections 4 to 6).
It measures how a mechanism delivers the deltas of a streamed reply to viewers. Phase 0 measured the baseline with it:
one `updateMessage` for every delta, read by the viewers from `room-messages`.

Everything on the server runs only with `AGENT_STREAM_POC=1`. Without it, the server behaves as `develop` does.

## What is where

| Path                                                                  | What                                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apps/meteor/server/agent-stream/producer.ts`                         | The fake producer, the delta and sink types, the snapshot `{ text, seq }` for each active stream |
| `apps/meteor/server/agent-stream/reply.ts`                            | The fixed reply: 1,000 tokens of 4 ASCII characters, markdown with a list and a code block       |
| `apps/meteor/server/agent-stream/sinks/`                              | The sinks. `update-message` is the baseline                                                      |
| `apps/meteor/server/agent-stream/routes.ts`                           | The dev routes under `/_agent-stream`                                                            |
| `apps/meteor/server/agent-stream/counters.ts`                         | The broker counters, filled by `apps/meteor/ee/server/local-services/instance/service.ts`        |
| `agent-stream/scenarios.mjs`                                          | S1 to S5 and the reply rate. **Do not change them.**                                             |
| `agent-stream/seed.mjs`                                               | Users, rooms and login tokens, through the REST API                                              |
| `agent-stream/loadgen.mjs`                                            | Runs one cell (scenario, deployment, W) and writes one JSON result                               |
| `agent-stream/viewer-worker.mjs`, `lib/viewer.mjs`                    | The viewers, in worker threads; order, gap and duplicate checks; latency                         |
| `agent-stream/adapters/`                                              | The viewer transports. `ddp-room-messages` is the baseline                                       |
| `agent-stream/matrix.sh`                                              | Runs the cells of one deployment, 3 runs each, under the measurement lock                        |
| `agent-stream/summary.mjs`                                            | Turns the JSON results into the report tables                                                    |
| `agent-stream/failures.mjs`                                           | The failure modes of the report template: stop, kill, restart, crash                             |
| `agent-stream/webclient.mjs`                                          | The secondary S1 metric: web client main-thread time for each delta                              |
| `agent-stream/start-instance.sh`, `run-d1.sh`, `run-d2.sh`, `stop.sh` | Start and stop the instances                                                                     |

## Server mode

All measurements use a **production bundle** (`meteor build --server-only`), started with `node --expose-gc main.js`.
Every hypothesis uses the same mode.

## Prerequisites

- Mongo as a replica set on `localhost:27017`. The harness connects with `directConnection=true`, so the member name of
  the replica set (here `mongo:27017`, from Docker) does not need to resolve on the host.
- Node at the version that the repo pins (`node -p process.execPath` in the repo gives the real binary, not a shim).
- An enterprise license with the `scalability` module, for D2. D1 uses the same license, so both deployments run with the
  same code paths.

## Build

From the root of your worktree:

```bash
yarn
npx turbo run build --filter=@rocket.chat/meteor^...
(cd apps/meteor && yarn build:client)
(cd apps/meteor && meteor build --server-only --directory "$AGENT_STREAM_BUNDLE")
(cd "$AGENT_STREAM_BUNDLE/bundle/programs/server" && npm install --omit=dev)
```

The Meteor build takes about one minute. Build again after every server change, then restart the instances.

## Environment

| Variable                                          | Used by                        | Meaning                                                            |
| ------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `AGENT_STREAM_BUNDLE`                             | `start-instance.sh`, `stop.sh` | The `meteor build --directory` output. Use a directory of your own |
| `ROCKETCHAT_LICENSE` or `ROCKETCHAT_LICENSE_FILE` | `start-instance.sh`            | The license, or a file with it. Never commit it                    |
| `AGENT_STREAM_LOGS`                               | `start-instance.sh`, `stop.sh` | Logs and pid files. Default: `$AGENT_STREAM_BUNDLE/logs`           |
| `MONGO_HOST`                                      | `start-instance.sh`            | Default `localhost:27017`                                          |

`start-instance.sh` also sets the settings that the harness needs: no setup wizard, an admin user (`as-admin`), no REST
rate limiter, and no two-factor authentication (the seed logs in 1,000 users).

## Run a deployment

Use your own ports and your own database (`agentstream_<id>`).

> Check that your ports are free before you start. On the Phase 0 machine, Docker containers held 3001 (Grafana),
> 3100 (Loki) and 3200 (Tempo). Phase 0 used 3000 and 3002.

```bash
# D1: one instance
agent-stream/run-d1.sh 3000 agentstream_h0
# D2: two instances on one Mongo, joined by the instance broker. A runs the producer
agent-stream/run-d2.sh 3000 3002 agentstream_h0
# stop
agent-stream/stop.sh 3000 3002
```

Seed the database once, against any instance:

```bash
node agent-stream/seed.mjs --server http://localhost:3000 --out "$OUT/seed-agentstream_h0.json"
```

It creates `as-bot` (the producer's user), `as-u0000` to `as-u0999`, the channels `as-s1` (1 viewer), `as-s2`
(500 viewers) and `as-s4` (1,000 viewers), and 100 group DMs of the bot and two viewers for S3 and S5. Run it again to
get fresh tokens.

## Run one cell

```bash
node agent-stream/loadgen.mjs --label h0 --deployment D2 --servers http://localhost:3000,http://localhost:3002 \
  --db agentstream_h0 --seed "$OUT/seed-agentstream_h0.json" --out "$OUT/h0" \
  --scenario S2 --w 50 --run 1 --adapter ddp-room-messages --sink update-message
```

- `--servers`: the producer's instance first. Viewer `i` connects to `servers[(i + 1) % n]`, so half of the viewers are
  on each instance in D2, and the single viewer of S1 is on B.
- `--tokens N` shortens the reply for a functional check. Do not use it for a measured run.
- `--drain-timeout` (ms, default 300000 in `loadgen.mjs`, 600000 in `matrix.sh`): how long to wait after the reply for
  a backlog to drain. A run that hits it is marked `timedOut`.

A run: connect the viewers, measure the idle rate of each instance and of Mongo for 5 s, reset the server metrics,
start the replies on A, wait until every viewer saw the end and
the producer is idle (or 10 s after the producer is idle), read the metrics, then read the persisted messages over REST.

## Run the matrix

Take the measurement lock for every load run. `matrix.sh` does it for each run: `mkdir` on the lock path of the plan,
60 s waits while it is busy, `rmdir` after the run, also after a failure.

```bash
agent-stream/matrix.sh h0 D2 http://localhost:3000,http://localhost:3002 agentstream_h0 "$OUT/seed-agentstream_h0.json" "$OUT/h0"
agent-stream/matrix.sh h0 D1 http://localhost:3000 agentstream_h0 "$OUT/seed-agentstream_h0.json" "$OUT/h0"
node agent-stream/summary.mjs "$OUT/h0" --label h0
```

Environment for `matrix.sh`: `SCENARIOS` (default `S1 S2 S3 S4 S5`), `WS` (default `0 50 250`), `RUNS` (default 3),
`ADAPTER`, `SINK`, `DRAIN_TIMEOUT`. Restart the instances when you change deployment, and run one short unrecorded
warm-up (for example S2 and S3 with `--tokens 200 --label warmup`) before a matrix.

## The dev routes

All under `/_agent-stream`, no auth (local use only):

| Route                                                   | Does                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `POST /start` `{ rooms, userId, w, tokens, tps, sink }` | Starts one stream in each room, at the same time. Returns `{ streams: [{ streamId, rid, mid }] }` |
| `POST /stop` `{ streamId, reason? }`                    | Ends a stream early (default reason `stopped`)                                                    |
| `POST /kill` `{ streamId }`                             | Stops a stream with no end delta and no final write, as a producer that dies                      |
| `GET /status`                                           | `{ active, queued }`: active streams and sink calls that wait                                     |
| `GET /snapshot/:streamId`                               | The producer's `{ text, seq, active }`                                                            |
| `GET /metrics[?reset=1][&gc=1]`                         | The counters below; `reset=1` starts a new window after it reads; `gc=1` collects first           |

`/metrics` returns, for the window since the last reset: `cpu` (`process.cpuUsage()`: user, system, total ms, and % of
one core), `eventLoop` (`monitorEventLoopDelay` at the default 10 ms resolution, so its floor is about 10 ms),
`memory` (`process.memoryUsage()`), `broker` (instance broker: events sent by name, and packets and bytes in and out of
its serializer, which includes heartbeats and the Moleculer envelope), and `producer` (streams, deltas, queued sink
calls, sink errors).

## The metrics in a result

| Field                                                              | How                                                                                                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `server.cpuMsPerDeliveredDelta`                                    | CPU ms of all instances in the window, divided by the deltas the viewers received (first receipt, end included)                       |
| `server.idleCpuMsPerSec`                                           | Per instance: CPU ms per second in the 5 s idle probe before the window, with the viewers connected                                   |
| `server.netCpuMs`, `netCpuMsPerDeliveredDelta`, `netCpuMsPerReply` | The same, minus the idle rate of each instance over the window                                                                        |
| `server.eventLoopP99Ms`, `cpuPct`, `rssBytes`, `heapUsedBytes`     | Per instance, A first                                                                                                                 |
| `server.memoryPerConnection`                                       | S4 only: the growth of RSS and heap (after a GC) from before the viewers connect to 5 s after, divided by the viewers                 |
| `mongo.db`                                                         | `top` counts for the database of the run (`queries`, `getmore`, `insert`, `update`, `remove`, `commands`)                             |
| `mongo.server`                                                     | `serverStatus().opcounters` of the whole mongod, as the plan asks. Other databases on the same mongod add to it                       |
| `mongo.readsPerReply`, `writesPerReply`                            | From `top`: (`queries` + `getmore`) and (`insert` + `update` + `remove`), divided by the replies                                      |
| `mongo.idlePerSec`, `netReadsPerReply`, `netWritesPerReply`        | The `top` rate of the idle probe, and the counts per reply minus that rate over the window                                            |
| `broker.eventsPerReply`, `bytesPerReply`                           | Sent by all instances, divided by the replies                                                                                         |
| `bytesPerViewerPerReply`                                           | WebSocket payload bytes (no frame headers; the server does not compress) plus REST bodies the adapter reads, per viewer in the window |
| `latencyMs`                                                        | Receive time minus the delta's `ts`, for each first receipt. One host, one clock                                                      |
| `correctness`                                                      | Summed over the viewers. See below                                                                                                    |

Correctness, as `lib/viewer.mjs` counts it:

- `gapEvents` / `missingSeqs`: a `seq` that skips ahead in one session, and how many it skipped.
- `dupes`: a `seq` seen before in the same session.
- `outOfOrder`: a `seq` lower than the last one, not seen before.
- `staleAfterSnapshot`: a `seq` that the snapshot already covers. Expected after a reconnect, not an error.
- `notEnded`: viewers that never saw the end. `textMismatch`: viewers whose final text differs from the persisted text.
- `persistedNotDone`: replies whose persisted state is not `done`.

## Add a sink

A sink carries the deltas of one stream from the producer to the viewers.

1. Write a `SinkFactory` in `apps/meteor/server/agent-stream/sinks/<name>.ts`. It gets `{ streamId, room, user }` and
   returns `{ start(placeholder), delta(delta, text), end(delta, text) }`. `text` is the whole reply after the delta.
2. Register it in `sinks/index.ts` under a name.
3. Run with `--sink <name>` (or `SINK=<name>` for `matrix.sh`).

The producer calls the sink of a stream in order and waits for each call before the next, so a slow sink builds a queue
and the latency shows it. The producer owns the persistence of the shared contract: the placeholder before `start`, and
one `updateMessage` with the final text and `streaming.state` after `end`. A sink writes nothing to the database, except
in H3. Read the snapshot of a stream with `getSnapshot(streamId)` from `producer.ts`.

The placeholder and the final write carry `streaming: { id, state, seq, ts }`. `seq` and `ts` are harness additions to
the contract's marker: the baseline viewers read them from each message update.

## Add an adapter

An adapter is how one viewer receives a stream.

1. Write a module in `agent-stream/adapters/<name>.mjs` that exports `create({ baseUrl, userId, token, rid, index })`.
   It returns:
   - `connect()`: open the connection and authenticate;
   - `open({ rid, streamId, mid })`: subscribe, as the client would for a room it opens. `streamId` and `mid` are set on
     a reconnect: then read the snapshot, and yield it before any event that arrived while it was read;
   - `events()`: an async iterable of events (below); end it when the connection closes;
   - `bytesIn`: every byte the viewer received, including snapshot reads;
   - `close()`.
2. Register it in `adapters/index.mjs`.
3. Run with `--adapter <name>` (or `ADAPTER=<name>`).

Events, each with `recvTs: Date.now()` taken when it came off the socket:

- `{ type: 'snapshot', streamId, mid, seq, text, state }`
- `{ type: 'append', streamId, seq, ts, text }` and `{ type: 'end', streamId, seq, ts, reason }`: the contract's deltas
- `{ type: 'full', streamId, mid, seq, ts, text, state }`: a whole-message update, as the baseline gets

`lib/ddp.mjs` is a small DDP client over the raw `/websocket` endpoint, with login by resume token, `stream()` for
streamer subscriptions, `call()` for methods, and a byte counter.

## Failure modes

`failures.mjs` runs one case with one viewer of the S1 room on the last server, and the producer on the first:

```bash
node agent-stream/failures.mjs --case stop  --servers http://localhost:3000,http://localhost:3002 --seed "$SEED"
node agent-stream/failures.mjs --case kill  --servers ... --seed "$SEED"
node agent-stream/failures.mjs --case restart --servers ... --seed "$SEED" --cmd "agent-stream/stop.sh 3002 && agent-stream/start-instance.sh 3002 agentstream_h0"
node agent-stream/failures.mjs --case crash --servers ... --seed "$SEED" --cmd "kill -9 \$(cat \$AGENT_STREAM_BUNDLE/logs/3000.pid)"
```

`--after` (ms, default 5000) sets when the failure happens; 3800 lands the stop inside the code block of the reply.

## Web client (S1, secondary)

```bash
node agent-stream/webclient.mjs --server http://localhost:3000 --seed "$SEED" --w 50 --out "$OUT/h0" --run 1
```

It opens `as-s1` as `as-u0000` in headless Chromium, measures the page's idle main-thread time for 10 s, then streams one
reply and reports the Chrome `Performance.getMetrics` durations (task, script, layout, style) for each delta, net of the
idle rate, and the long tasks. Take the lock for it too.

## Caveats

- CPU per delta changes with the load. One stream (S1) costs several times more CPU per update than 100 streams (S3),
  also net of the idle rate (about 5 ms/s per instance). A likely cause: macOS runs a lightly loaded process on the
  efficiency cores and does not let us pin it, and a busy event loop batches its wake-ups. Compare mechanisms only
  within the same cell.
- The event loop p99 has a 10 ms floor from the histogram resolution.
- RSS growth per connection is noisy, even after a GC. Use the heap growth.
