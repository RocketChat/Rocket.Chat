# H0-baseline: one `updateMessage` for every delta

Branch `poc/agent-stream-harness`. Harness guide: `HARNESS.md` at the root of the branch.

## 1. Verdict

The baseline is correct for the text, but each delta costs a full message update, and one instance cannot keep up with
many replies at the same time. Each delta runs 17 to 21 Mongo reads and 3 writes, sends 2 broker events with 13.5 KB
together in D2 (`watch.messages`, and `watch.rooms` because the streamed message is the room's `lastMessage`), and sends
the full message to every viewer. One reply to a large room works: in S2 (500 viewers) the median p99 latency stays at
or below 51 ms at every W, in D1 and D2, so the S2 gate (p99 below 1 s at W = 50) passes. 100 replies at the same time
(S3, S5) saturate the producer's instance at every W: it writes about 270 to 370 updates per second, and the S3 p99
latency is 3.6 s (D2) to 6.8 s (D1) at W = 250, about 105 s at W = 50, and 255 to 295 s at W = 0. Each viewer
receives 6.1 MB for one 4 KB reply at W = 0, and 0.6 MB at W = 250: the bytes grow with the square of the reply
length. A wider W cuts the number of updates, not the cost of each one. No run ended
with a text mismatch. The sequence numbers show a few gaps and duplicates, because the broadcast reads the message again
after the write; the full-text updates hide this from the user. Side effects: each delta counts as one sent message in
the EE engagement dashboard, and marks the message as edited.

## 2. Prototype

Branch: `poc/agent-stream-harness`, from `develop` at `1572a5908c`. Ten commits: the server POC first, then the
harness, then its later additions. The raw JSON results (78 matrix runs and 9 web client runs) are in
`reports/H0-baseline-results/`, next to this report; `node agent-stream/summary.mjs <that folder> --label h0` rebuilds
the tables.

Server (all behind `AGENT_STREAM_POC=1`; `main.ts` imports the module only with it):

| File | What |
| --- | --- |
| `apps/meteor/server/main.ts` | loads `./agent-stream` at the end of the startup when `AGENT_STREAM_POC=1` |
| `apps/meteor/server/agent-stream/producer.ts` | the fake producer, the `AgentDelta` and `Sink` types, `getSnapshot()` |
| `apps/meteor/server/agent-stream/reply.ts` | the fixed reply: 1,000 tokens of 4 ASCII characters (4,000 characters of markdown, with a list and a code block) |
| `apps/meteor/server/agent-stream/sinks/updateMessageSink.ts` | the baseline sink: `updateMessage` with the text so far, for each delta |
| `apps/meteor/server/agent-stream/routes.ts` | `/_agent-stream/{start,stop,kill,status,snapshot,metrics}` on `httpApp` |
| `apps/meteor/server/agent-stream/counters.ts` | the broker counters |
| `apps/meteor/ee/server/local-services/instance/service.ts` | counts the events in the cluster transport's `publish`, and the packets and bytes in its EJSON serializer |

Harness (`agent-stream/`, plain Node, outside the bundle): `seed.mjs`, `loadgen.mjs`, `viewer-worker.mjs`,
`lib/viewer.mjs`, `lib/ddp.mjs`, `adapters/ddp-room-messages.mjs`, `scenarios.mjs`, `matrix.sh`, `summary.mjs`,
`failures.mjs`, `webclient.mjs`, `start-instance.sh`, `run-d1.sh`, `run-d2.sh`, `stop.sh`. Size: 415 lines of server
code (the sink is 30), 1,460 lines of harness.

To run: build the bundle, start a deployment, seed, run the matrix, summarize. `HARNESS.md` has the commands, the
environment variables, and how to add a sink or an adapter.

## 3. Machine and mode

| Item | Value |
| --- | --- |
| CPU | Apple M5 Pro, 15 cores (performance and efficiency cores; macOS does not let a process pin to one kind) |
| RAM | 48 GB |
| OS | macOS 27.0.1 |
| Node | v24.15.0 (the repo pin), started directly, not through the Volta shim |
| Server mode | **production bundle**: `meteor build --server-only` (Meteor 3.5.2), started with `node --expose-gc main.js`, `NODE_ENV=production` |
| Mongo | 8.2.12, single-node replica set in Docker Desktop (VM: 15 CPUs, 8 GB), shared with other databases; database `agentstream_h0`, `directConnection=true` |
| License | an enterprise license with `scalability`, on every instance of D1 and D2 |
| Ports | A: 3000, B: 3002 (3001 is held by a Grafana container on this machine) |
| Load generator | the same host, 8 worker threads, 3 to 6 % of one core |

The user used the machine for other work during the runs. `otherBusyCores` in each result (from the D1 S1 runs on)
records the cores that were busy with anything but the instances and the load generator, Mongo included: 0.9 to 3.3 in
S1, S2 and S4, and 4.6 to 6.1 in S3 and S5, where Mongo does most of it. Its spread within a scenario is small, so no
run stands out. See "How the other work affects the numbers" in section 4.

## 4. Results

Each cell is the median of 3 runs. CPU is `process.cpuUsage()` of the instances in the window, summed. "Net" subtracts
the median idle rate of the deployment (about 5 to 6 ms/s per instance). Latency is from the producer's `ts` to the
receipt in the load generator, one clock. In D2 the viewer of S1 is on B; half of the other viewers are on A and half on
B; the producer runs on A. "Delivered / expected" counts first receipts, the end included.

### D1: one instance

Median idle CPU of the deployment, subtracted for the net columns: 6.5 ms/s per instance.

| Scenario | W | Runs | CPU ms / delivered delta | Net CPU ms / delivered delta | Net CPU ms / reply | Idle CPU ms/s in the run probe (per instance) | CPU % (per instance) | EL p99 ms (per instance) | RSS MB (per instance) | Heap MB (per instance) | Mongo reads / reply | Mongo writes / reply | Mongo commands / reply | Broker events / reply | Broker KB / reply | KB / viewer / reply | Latency p50 / p95 / p99 ms | Delivered / expected | Window s | Timed out |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| S1 | 0 | 3 | 14.270 | 14.107 | 14107 | 6.0 | 56.7 | 12.9 | 1074 | 580 | 20069 (20044) | 3020 (3020) | 42 | 2006 | 0 | 6232.8 | 17 / 24 / 35 | 1001 / 1001 | 25.2 | 0 |
| S1 | 50 | 3 | 16.983 | 16.646 | 8077 | 5.6 | 32.7 | 12.8 | 1128 | 592 | 9749 (9724) | 1470 (1469) | 41 | 974 | 0 | 3023.4 | 24 / 30 / 33 | 485 / 485 | 25.2 | 0 |
| S1 | 250 | 3 | 21.522 | 19.853 | 1946 | 6.9 | 8.4 | 12.6 | 1128 | 527 | 2009 (1979) | 309 (303) | 35 | 200 | 0 | 619.7 | 29 / 35 / 56 | 98 / 98 | 25.2 | 0 |
| S2 | 0 | 3 | 0.029 | 0.029 | 14400 | 8.1 | 57.9 | 16.8 | 1173 | 585 | 21068 (21043) | 3516 (3511) | 24 | 2005 | 0 | 6232.8 | 17 / 25 / 35 | 500500 / 500500 | 25.2 | 0 |
| S2 | 50 | 3 | 0.050 | 0.049 | 11332 | 6.5 | 45.6 | 20.0 | 1175 | 626 | 10347 (10322) | 1905 (1905) | 25 | 933 | 0 | 2891.9 | 30 / 38 / 44 | 232500 / 232500 | 25.2 | 0 |
| S2 | 250 | 3 | 0.059 | 0.055 | 2704 | 7.5 | 11.4 | 14.5 | 1174 | 568 | 3007 (2982) | 806 (801) | 35 | 199 | 0 | 620.5 | 29 / 42 / 49 | 49000 / 49000 | 25.1 | 0 |
| S3 | 0 | 3 | 2.112 | 2.103 | 4210 | 4.9 | 148.5 | 32.3 | 1675 | 564 | 17078 (17075) | 3038 (3038) | 15 | 2009 | 0 | 6232.9 | 108315 / 241687 / 255841 | 200200 / 200200 | 284.7 | 0 |
| S3 | 50 | 3 | 2.325 | 2.315 | 1893 | 5.9 | 141.1 | 35.6 | 1684 | 616 | 6979 (6977) | 1245 (1245) | 11 | 824 | 0 | 2537.5 | 45823 / 102646 / 108176 | 81654 / 81654 | 134.8 | 0 |
| S3 | 250 | 3 | 2.423 | 2.411 | 445 | 6.1 | 137.6 | 39.3 | 1684 | 692 | 1597 (1597) | 289 (288) | 8 | 192 | 0 | 584.5 | 1503 / 5906 / 6777 | 18502 / 18502 | 32.6 | 0 |
| S4 | - | 3 | - | - | - | 13.5 | 4.2 | 11.3 | 1684 | 566 | - (-) | - (-) | - | - | - | 0.0 | - | - | 25.0 | 0 |
| S5 | 0 | 3 | 2.171 | 2.162 | 4296 | 6.6 | 152.4 | 32.3 | 1689 | 584 | 17194 (17191) | 3069 (3069) | 65 | 2020 | 0 | 6230.7 | 110993 / 241235 / 253995 | 198702 / 200200 | 282.9 | 0 |
| S5 | 50 | 3 | 2.118 | 2.109 | 1744 | 26.9 | 150.2 | 30.4 | 1689 | 666 | 7134 (7133) | 1273 (1116) | 29 | 841 | 0 | 2577.2 | 37573 / 85189 / 89982 | 82394 / 82980 | 116.8 | 0 |
| S5 | 250 | 3 | 2.151 | 2.141 | 401 | 4.6 | 142.5 | 34.3 | 1689 | 606 | 1628 (1623) | 295 (294) | 12 | 196 | 0 | 592.5 | 195 / 1906 / 2468 | 18708 / 18776 | 28.2 | 0 |

S4 standing cost (1000 idle viewers): CPU 41.6 ms/s in total, heap 17.9 KB and RSS 0.3 KB per connection, Mongo 122.4 ops/s, broker 0.00 events/s, 14 bytes per viewer in 25 s.

In D1 the license installs the cluster transport, so "Broker events / reply" counts the events handed to it; with no peer it sends nothing (0 KB).

### D2: two instances, instance broker active

Median idle CPU of the deployment, subtracted for the net columns: 5.9 / 5.4 ms/s per instance.

| Scenario | W | Runs | CPU ms / delivered delta | Net CPU ms / delivered delta | Net CPU ms / reply | Idle CPU ms/s in the run probe (per instance) | CPU % (per instance) | EL p99 ms (per instance) | RSS MB (per instance) | Heap MB (per instance) | Mongo reads / reply | Mongo writes / reply | Mongo commands / reply | Broker events / reply | Broker KB / reply | KB / viewer / reply | Latency p50 / p95 / p99 ms | Delivered / expected | Window s | Timed out |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| S1 | 0 | 3 | 12.326 | 12.044 | 12056 | 4.7 / 5.2 | 46.1 / 3.2 | 12.4 / 11.6 | 1151 / 945 | 634 / 559 | 20101 (20046) | 3020 (3015) | 57 | 2006 | 13207 | 6232.8 | 18 / 23 / 32 | 1001 / 1001 | 25.1 | 0 |
| S1 | 50 | 3 | 15.829 | 15.253 | 7474 | 5.3 / 5.3 | 28.7 / 2.1 | 11.9 / 11.5 | 1151 / 945 | 616 / 560 | 9883 (9831) | 1491 (1480) | 74 | 986 | 6484 | 3058.5 | 25 / 31 / 35 | 490 / 490 | 25.1 | 0 |
| S1 | 250 | 3 | 23.069 | 20.243 | 2024 | 5.4 / 5.2 | 8.3 / 0.9 | 11.6 / 11.4 | 1152 / 945 | 517 / 562 | 2083 (2031) | 322 (322) | 51 | 204 | 1348 | 634.0 | 31 / 38 / 59 | 100 / 100 | 25.1 | 0 |
| S2 | 0 | 3 | 0.031 | 0.030 | 15191 | 8.8 / 8.7 | 48.0 / 14.1 | 14.7 / 15.1 | 1162 / 945 | 580 / 543 | 21096 (21036) | 3519 (3508) | 43 | 2005 | 13207 | 6232.8 | 18 / 26 / 36 | 500500 / 500500 | 25.1 | 0 |
| S2 | 50 | 3 | 0.045 | 0.044 | 10497 | 9.0 / 8.0 | 34.2 / 8.6 | 16.2 / 16.3 | 1169 / 946 | 609 / 550 | 10699 (10649) | 1958 (1948) | 51 | 965 | 6362 | 3001.2 | 29 / 38 / 42 | 240500 / 240500 | 25.2 | 0 |
| S2 | 250 | 3 | 0.072 | 0.067 | 3295 | 8.5 / 7.1 | 11.2 / 3.0 | 13.8 / 14.1 | 1172 / 946 | 553 / 539 | 3058 (3008) | 810 (805) | 58 | 201 | 1329 | 625.6 | 33 / 42 / 51 | 49500 / 49500 | 25.1 | 0 |
| S3 | 0 | 3 | 2.430 | 2.412 | 4829 | 6.8 / 8.9 | 142.6 / 7.9 | 36.6 / 11.3 | 1521 / 772 | 612 / 530 | 17086 (17077) | 3041 (3039) | 18 | 2009 | 13248 | 6232.9 | 132848 / 279429 / 293683 | 200200 / 200200 | 323.0 | 0 |
| S3 | 50 | 3 | 2.438 | 2.419 | 1943 | 5.6 / 5.0 | 141.0 / 8.3 | 35.1 / 11.3 | 1522 / 774 | 623 / 530 | 6923 (6920) | 1240 (1239) | 14 | 817 | 5350 | 2515.5 | 45125 / 97982 / 103149 | 80962 / 80962 | 130.2 | 0 |
| S3 | 250 | 3 | 2.332 | 2.315 | 435 | 5.6 / 5.1 | 137.6 / 7.4 | 34.9 / 11.3 | 1523 / 780 | 562 / 549 | 1618 (1617) | 292 (292) | 9 | 194 | 1257 | 590.0 | 660 / 2885 / 3552 | 18740 / 18740 | 29.5 | 0 |
| S4 | - | 3 | - | - | - | 15.6 / 13.9 | 2.5 / 2.2 | 11.3 / 11.3 | 1524 / 795 | 517 / 539 | - (-) | - (-) | - | - | - | 0.0 | - | - | 25.0 | 0 |
| S5 | 0 | 3 | 2.309 | 2.292 | 4568 | 5.7 / 5.3 | 149.3 / 8.9 | 31.6 / 11.3 | 1554 / 802 | 623 / 542 | 17203 (17196) | 3072 (3071) | 70 | 2021 | 13261 | 6243.5 | 113612 / 248943 / 262021 | 199254 / 200200 | 290.7 | 0 |
| S5 | 50 | 3 | 2.258 | 2.242 | 1841 | 4.5 / 4.5 | 148.3 / 8.9 | 31.5 / 12.1 | 1556 / 810 | 642 / 534 | 7070 (7067) | 1262 (1257) | 29 | 834 | 5456 | 2566.9 | 38828 / 86882 / 91586 | 81910 / 82240 | 118.0 | 0 |
| S5 | 250 | 3 | 2.248 | 2.231 | 419 | 4.7 / 4.0 | 139.9 / 8.3 | 31.9 / 12.1 | 1557 / 810 | 601 / 530 | 1628 (1623) | 295 (294) | 11 | 196 | 1262 | 592.8 | 193 / 2250 / 2822 | 18760 / 18798 | 28.3 | 0 |

S4 standing cost (1000 idle viewers): CPU 47.7 ms/s in total, heap 17.3 KB and RSS 2.0 KB per connection, Mongo 124.8 ops/s, broker 0.00 events/s, 14 bytes per viewer in 25 s.

### What one update costs

Mongo operations for each update, by collection (D2, S2 at W = 0: 1,001 updates; S3 has the same per-update pattern):

| Collection | Operation | Per update | Where it comes from |
| --- | --- | ---: | --- |
| `users` | find | 10.5 (7 in S3) | mostly the Apps-Engine message converter (`apps/meteor/server/modules/apps/converters/messages.ts`): it reads the sender and the editor for each conversion, in both directions, for the 3 pre-events and the post-event, also with no app installed |
| `rocketchat_room` | find | 7.0 | the same converter (the room for each conversion), plus `updateMessage` and `notifyOnRoomChangedById` |
| `rocketchat_message` | find | 3.0 | `updateMessage` (the original), the `setImmediate` re-read, `notifyOnMessageChange` |
| `rocketchat_message` | update | 1.0 | the write of the text |
| `rocketchat_room` | update | 1.0 | `lastMessage` of the room |
| `rocketchat_analytics` | update | 1.0 | the EE engagement dashboard's `afterSaveMessage` hook (`apps/meteor/ee/server/lib/engagementDashboard/messages.ts`): `$inc: { messages: 1 }` for every edit |

The attribution of the reads comes from reading the code, not from a profile; the counts come from `top`.

CPU for each update: the net CPU of the run (all instances, minus the median idle rate of the deployment) divided by the
updates of the run, median of 3 runs. In brackets: updates per reply (the end included).

| Deployment | Scenario | W = 0 | W = 50 | W = 250 |
| --- | --- | ---: | ---: | ---: |
| D1 | S1 (1 viewer) | 14.1 ms (1001) | 16.6 ms (485) | 19.9 ms (98) |
| D1 | S2 (500 viewers) | 14.4 ms (1001) | 24.5 ms (465) | 27.6 ms (98) |
| D1 | S3 (100 streams, 2 viewers each) | 4.2 ms (1001) | 4.6 ms (408) | 4.8 ms (93) |
| D1 | S5 (as S3, with reconnects) | 4.3 ms (1001) | 4.2 ms (415) | 4.3 ms (94) |
| D2 | S1 | 12.0 ms (1001) | 15.3 ms (490) | 20.2 ms (100) |
| D2 | S2 | 15.2 ms (1001) | 21.8 ms (481) | 33.3 ms (99) |
| D2 | S3 | 4.8 ms (1001) | 4.8 ms (405) | 4.6 ms (94) |
| D2 | S5 | 4.6 ms (1001) | 4.5 ms (411) | 4.5 ms (94) |

An update costs about 4.2 to 4.8 ms of CPU when the producer's instance is saturated (S3, S5). D2 costs 0 to 15 % more
than D1 in those cells (the broker serialization on A, and B's share of the sends). At light load an update costs 3 to 7
times more, and more with a wider W, also net of the idle rate. The cause of that rise is not proven. Likely causes:
macOS runs a lightly loaded process on the efficiency cores, and a busy event loop batches its wake-ups and its Mongo
round trips. So **compare mechanisms only within the same cell**, never across load levels.

Message and transport sizes (D2): the persisted final message is 10.5 KB (4.0 KB of text plus the `md` AST, `urls` and
the other fields). Each update sends about 13.5 KB on the instance broker, as an average over the reply, because
`watch.rooms` carries the room with the message as `lastMessage`, and `watch.messages` carries the message again. In D1
the broker sends nothing (no peer).

S4, the standing cost of 1,000 idle viewers with the room open: 17.9 KB (D1) and 17.3 KB (D2) of heap for each
connection (each viewer holds 6 stream subscriptions: `room-messages` and 5 `notify-room` events); 41.6 ms/s of CPU in
total in D1, 47.7 ms/s in D2; about 123 Mongo operations per second, which are 1 `users` read and 1 `usersSessions` read
and write for each connection in 25 s (presence); no broker events; 14 bytes for each viewer (pings). The baseline adds
nothing to it: it uses the subscriptions that an open room has anyway. RSS growth per connection is noise (0.2 to 14 KB
across runs).

### Web client (S1 only, D1, secondary)

`webclient.mjs`: headless Chromium (Playwright 1.52) opens `as-s1` as its viewer, then one reply streams. Chrome's
`Performance.getMetrics` durations, minus the page's idle rate (0.9 ms/s), divided by the deltas. Median of 3 runs.

| W | Deltas | Main-thread task ms / delta | Script ms / delta | Layout ms / delta | Style ms / delta | Main thread busy during the reply | Long tasks (> 50 ms) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 1001 | 6.1 | 4.9 | 0.30 | 0.05 | 22 % | 0 |
| 50 | 490 | 8.6 | 6.9 | 0.42 | 0.12 | 15 % | 0 |
| 250 | 100 | 20.5 | 15.3 | 0.73 | 0.79 | 8 % | 0 |

Each delta upserts and renders the whole message again, mostly in script (the message store, the
`streamMessage` callbacks and React). As on the server, the cost of one delta rises when the deltas are fewer: the
total over the reply drops from 6.1 s (W = 0) to 2.0 s (W = 250).

### How the other work affects the numbers

- Counts do not change with the machine load: Mongo operations, broker events and bytes, bytes per viewer. One
  exception: under load the coalescing timer fires late, so a run at W > 0 makes fewer and larger deltas (S3 at W = 50:
  405 deltas per reply instead of about 490). W acts as a minimum.
- CPU per delta changes by 3 to 9 % across the runs of a cell.
- Latency, throughput and event loop delay change a lot when the instance is saturated: S3 at W = 250 had a p50 of
  1,379, 660 and 230 ms in its 3 D2 runs. Away from saturation (S1, S2) they are stable.
- The Mongo counts come from `top` for the run's database, so other databases on the same mongod do not add to them.

## 5. Correctness

| Deployment | Scenario | W | Runs | Gap events | Missing seqs | Duplicates | Out of order | Stale after snapshot | Reconnects | Errors | Not ended | Text mismatch | Persisted not done |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| D1 | S1 | 0 | 3 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S1 | 50 | 3 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S1 | 250 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S2 | 0 | 3 | 500 | 500 | 500 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S2 | 50 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S2 | 250 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S3 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S3 | 50 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S3 | 250 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S4 | - | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D1 | S5 | 0 | 3 | 2 | 2 | 2 | 0 | 2635 | 1769 | 0 | 0 | 0 | 0 |
| D1 | S5 | 50 | 3 | 0 | 0 | 0 | 0 | 983 | 661 | 0 | 0 | 0 | 0 |
| D1 | S5 | 250 | 3 | 0 | 0 | 0 | 0 | 132 | 117 | 0 | 0 | 0 | 0 |
| D2 | S1 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S1 | 50 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S1 | 250 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S2 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S2 | 50 | 3 | 500 | 500 | 500 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S2 | 250 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S3 | 0 | 3 | 18 | 18 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S3 | 50 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S3 | 250 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S4 | - | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| D2 | S5 | 0 | 3 | 0 | 0 | 0 | 0 | 1777 | 1710 | 0 | 0 | 0 | 0 |
| D2 | S5 | 50 | 3 | 0 | 0 | 0 | 0 | 617 | 634 | 0 | 0 | 0 | 0 |
| D2 | S5 | 250 | 3 | 4 | 4 | 4 | 0 | 69 | 101 | 0 | 0 | 0 | 0 |

- **Text.** No viewer ended with a text that differs from the persisted text, in any run, also with reconnects (S5).
  Every update carries the whole text, so a lost or repeated update cannot corrupt it.
- **Gaps and duplicates.** They come in pairs, one of each, at the same moment for every viewer of the reply (500 of
  each in one S2 run = 1 for each viewer). Cause: `updateMessage` broadcasts from a `setImmediate` that reads the
  message again (`updateMessage.ts:95-106`, then `Message.afterSave` calls `notifyOnMessageChange({ id })` with no data,
  which reads it once more). When the next write lands before that read, the broadcast of update k carries k + 1, and
  the broadcast of k + 1 carries k + 1 again. The viewer sees k + 1 twice and never sees k. By the S5 hard gate ("no
  gaps and no duplicates") the baseline fails in some runs, although the text is never wrong.
- **Reconnects.** S5 reconnected 2,547 viewers in D1 and 2,445 in D2 (9 runs each). Each read the persisted message as
  its snapshot, then took only the updates with a higher `seq`. "Stale after snapshot" counts the updates that arrived after the
  snapshot with a `seq` the snapshot already covered; that is expected. No reconnect lost an update after its
  snapshot.
- **Wrong order.** None.

## 6. Design points

Phase 0 has no design points of its own; these are the parts of section 6 and the decisions taken for each.

1. **Branch.** `poc/agent-stream-harness` from `develop` (`1572a5908c`), committed, not pushed.
2. **Fake producer.** `producer.ts`. It sends the placeholder with `sendMessage` (the bot user `as-bot`, `msg: ''`,
   `streaming: { id, state: 'active', seq: 0, ts }`), then emits the reply's tokens on a 25 ms timer. The timer emits
   every token that is due by the clock, so a late timer does not slow the reply. With W = 0 each token is one delta;
   otherwise the first buffered token starts a W timer, and its expiry flushes the buffer as one delta. The producer
   calls the sink of a stream in order and waits for each call, so a slow sink builds a queue (that is what drives the
   S3 latency). At the end it calls `sink.end()`, then writes the final text with one `updateMessage` and
   `streaming.state` set to `done`, `stopped` or `error`. The sink interface is `start(placeholder)`,
   `delta(delta, text)`, `end(delta, text)`, where `text` is the reply after the delta. The baseline sink calls
   `updateMessage` with that text and `streaming: { id, state: 'active', seq, ts }`. `seq` and `ts` in the marker are a
   harness addition: the baseline viewers read them from each message update. The start route is
   `POST /_agent-stream/start`.
3. **Metrics endpoint.** `GET /_agent-stream/metrics?reset=1&gc=1`: CPU (`process.cpuUsage()`), event loop delay
   (`monitorEventLoopDelay`, default 10 ms resolution, as the health route; its floor is about 10 ms), memory,
   broker counters, producer counters. Mongo counts are read by the load generator, not by the server: `top` for the
   run's database (exact, per collection) and `serverStatus().opcounters` (the plan's source, but for the whole
   mongod). I added a 5 s idle probe before each window, so the report can subtract the background.
4. **Broker counter.** In `InstanceService`: the event name in `clusterTransport.publish`, and packets and bytes in the
   EJSON serializer, in and out. The bytes include the Moleculer envelope and the heartbeats (about 80 bytes/s per
   instance in S4).
5. **Seed.** `seed.mjs`, through the REST API only (no raw database writes): 1,000 viewers and the bot, the channels
   `as-s1` (1 viewer), `as-s2` (500) and `as-s4` (1,000), and 100 group DMs of the bot and 2 viewers for S3 and S5
   ("as in DMs"). It logs every user in for a token. 26 s.
6. **Load generator.** `loadgen.mjs` with viewers in 8 worker threads, so parsing does not delay receipt. The adapter
   interface: `create(spec)`, `connect()`, `open({ rid, streamId, mid })`, `events()` (an async iterable), `bytesIn`,
   `close()`. `ddp-room-messages` opens a room as the web client does: `stream-room-messages` with the room id, and
   `stream-notify-room` for `messagesImported`, `deleteMessage`, `deleteMessageBulk`, `messagesRead` and
   `user-activity`. It does not subscribe to `__my_messages__` (the web client does not) and does not load the room
   history. On a reconnect its snapshot is the persisted message, read with `chat.getMessage`. The viewer logic checks
   order, gaps and duplicates and records latency. One JSON result per run; `summary.mjs` makes the tables.
7. **Run scripts.** `run-d1.sh <port> <db>`, `run-d2.sh <portA> <portB> <db>`, `stop.sh <ports>`, all through
   `start-instance.sh`. They read the license from `ROCKETCHAT_LICENSE` or `ROCKETCHAT_LICENSE_FILE`, never from the
   branch. They disable the setup wizard, the REST rate limiter and 2FA (the seed logs in 1,000 users).
8. **Baseline run.** The full matrix: S1 to S5 × D1 and D2 × W = 0, 50, 250 (S4 without W), 3 runs each, 78 runs, every
   run under the measurement lock. Plus one unrecorded warm-up for each deployment, after a fresh start of its
   instances.

**Server mode.** A production bundle. It builds in about one minute, so every hypothesis can use it.

## 7. Failure modes

Tested with `failures.mjs` in D2: one viewer of `as-s1` on B, the producer on A, W = 50.

- **Viewer reconnect.** S5: 4,992 reconnects in D1 and D2, no text mismatch. The few gaps and duplicates in S5 (2 in
  D1, 4 in D2, in 18 runs) come from the broadcast race of section 5, not from the snapshot.
- **Restart of the instance that serves a viewer.** B restarted 2 s into the reply. The viewer reconnected and read the
  snapshot (seq 160, 1,324 characters). It then missed the next 184 updates (about 9 s), and resumed at seq 345.
  Cause: the restarted instance serves DDP subscriptions before its instance broker connects to A, so A's broadcasts in
  that window do not reach it. The final message arrived, so the text at the end was correct (4,000 characters, equal
  to the persisted text). With full-text updates the user sees a stale text for some seconds. A delta mechanism loses
  deltas in that window, and its viewer must fetch the snapshot again when it detects the gap.
- **Producer that dies before the end.** Two cases: `kill` (the producer stops with no end and no final write) and a
  crash (`kill -9` of A). In both, the placeholder stays at `streaming.state: 'active'` with the text of the last
  update (792 to 800 characters), and the viewer shows that text with no end. Nothing ever cleans it up: the message
  shows a half reply, marked as edited, for good.
- **Stop in the middle.** The viewer ended with `stopped` and the same text as the persisted one. Both stops landed in
  the code block: the persisted text then ends with `\n```` that the producer never sent, because `Message.beforeSave`
  closes an open code block (`closeUnclosedCodeBlock`). The baseline viewer shows the persisted text, so it matches. A
  delta mechanism whose overlay holds the raw text ends 4 characters short of the persisted text.

## 8. Client effort

None, for any client. The web client, mobile, desktop and the livechat widget all render message updates today. The
cost lands on the client in another form: each delta is a full message to upsert and render again (in the web client
6.1 ms of main-thread time for each delta at W = 0, 22 % of the main thread during the reply), and 6.1 MB of transfer
for each viewer for one reply at W = 0. On mobile, that transfer and the re-render of every delta are the likely costs
to watch; not measured.

## 9. Production gaps

- The dev routes have no auth. They exist only with `AGENT_STREAM_POC=1`.
- One fixed reply, produced in process, at a constant rate. No real agent, no backpressure from the sink to the
  producer.
- No cleanup for a placeholder left `active` by a producer that died.
- `seq` and `ts` in the persisted `streaming` marker are harness fields.
- The harness instances run without the REST rate limiter and without 2FA.
- The metrics route resets process-wide counters; two callers at the same time spoil each other's window.
- The broker byte counter counts the whole serializer traffic, heartbeats and envelope included.
- The viewers do not load the room history and do not render; only `webclient.mjs` renders, for S1.
- Everything runs on one host: the load generator, both instances and Mongo (in a Docker VM) share the CPU.
- D3 (microservices) was not run.
- On a reconnect the baseline viewer reads the message with `chat.getMessage`. The web client resyncs a room in its own
  way (room history); the harness does not model that.
- Each failure mode ran once, in D2, at W = 50.
- S4 puts all 1,000 viewers in one room.

## 10. Open questions

- **Ports.** On this machine Docker containers hold 3001 (Grafana), 3100 (Loki) and 3200 (Tempo). Phase 0 used 3002 for
  B. H1 and H2 need other ports than the plan gives them. `docs/getting-started.md` also puts Meteor on 3100 under
  `yarn dev`.
- **The S5 hard gate and the baseline.** The baseline has gaps and duplicates by `seq` (the re-read race above) but never
  a wrong text. If the gate means "no wrong text", the baseline passes it; if it means "no `seq` gap", it fails. Decide
  before the comparison.
- **Persisted text after a stop.** `closeUnclosedCodeBlock` changes the persisted text when a stop lands in a code
  block. The display rule (show the persisted message after the end) hides it, but a check of "overlay at the end equals
  persisted text" fails for H1 and H2. Either compare after the switch to the persisted message, or apply the same
  closing on the client.
- **Engagement dashboard.** `handleMessagesSent` runs on every `afterSaveMessage`, edits included, so every edit counts
  as a sent message. In S2 the room had 11 messages and the dashboard counted 5,052 for the day. This is a bug in
  `develop`, apart from streaming; any mechanism that writes a delta with `updateMessage` (H3) multiplies it.
- **The broadcast race.** The `setImmediate` re-read in `updateMessage` makes a broadcast carry a newer write. It does
  no harm with full messages, but H3's partial payloads must not rely on the order of the broadcasts.
- **Plan and code differ** on the cost of an update. The plan's table counts 2 reads for the message and the room, and
  "3 Apps-Engine round trips". The round trips hide about 14 reads (room and users for each conversion, in both
  directions), and the table leaves out `watch.rooms`, which doubles the broker traffic, and the analytics write.
- **CPU per update depends on the load** (about 4 to 5 ms saturated, 12 to 33 ms at light load), also net of the idle rate.
  The cause is not proven. Compare mechanisms only within the same cell.
- **The restart window**: an instance accepts DDP subscriptions before its instance broker reaches its peers. Every
  broadcast mechanism (the baseline, H2's stream relay, H1's relay) loses what is sent in that window.
