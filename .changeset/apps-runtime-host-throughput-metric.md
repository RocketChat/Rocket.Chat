---
'@rocket.chat/apps': minor
'@rocket.chat/meteor': minor
---

Adds a Prometheus metric (`rocketchat_apps_engine_runtime_throughput_bytes_total`) that measures the throughput, in bytes, at the boundary between an app's runtime (the subprocess) and the host. The counter is labelled by `app_id`, `app_name` (a readable version of the id), `runtime` (the platform backing the subprocess, e.g. `deno` or `node`) and `direction` (`inbound` for data coming from the runtime, `outbound` for data going to the runtime), so `rate()` yields the bytes-per-second exchanged with each app's runtime in each direction.
