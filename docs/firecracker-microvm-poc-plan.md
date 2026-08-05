# PoC: Run Rocket.Chat Apps inside Firecracker microVMs

Status: draft / proposal. Scope: prove feasibility + surface deployment cost. Not production design.

## Goal / hypothesis

Today each app = 1 OS subprocess isolated by Deno permission flags (shared kernel, shared user, host FS allowlist). Hypothesis: run each app's runtime inside a **Firecracker microVM** → hardware-virt isolation (own kernel, own mem/vCPU cgroup) instead of process+Deno-perms. Validate: works at all, boot latency, bridge round-trip latency, per-app mem cost, and — key deliverable — the **deployment delta**.

## Baseline (current runtime, what we're changing)

Located in `packages/apps` (`@rocket.chat/apps`), not the SDK-only `packages/apps-engine`.

- **Model**: 1 subprocess **per app**. `AppRuntimeManager.subprocesses[appId]` (`packages/apps/src/server/managers/AppRuntimeManager.ts`). No pool.
- **Backends**: `node` (default) / `deno`, env `APPS_ENGINE_RUNTIME_BACKEND`. Deno = target isolation.
- **Spawn**: `child_process.spawn` in `BaseRuntimeSubprocessController.spawnProcess()`. Deno flags in `AppsEngineDenoRuntime.buildProcessConfiguration()`: `deno run --cached-only --config=… --allow-read=<allowlist> --allow-env=NODE_EXTRA_CA_CERTS [--allow-net if app declares `networking`]`.
- **Isolation today**: OS process + Deno perms. Same kernel, runs as `rocketchat` uid 65533, no per-app CPU/mem cgroup, no ulimit. Just watchdog + request timeout.
- **Transport**: JSON-RPC 2.0 (`jsonrpc-lite`) over child **stdin/stdout**, msgpack-framed (`@msgpack/msgpack`, custom ExtensionCodec: fn-stripper, Buffer, SecureFields redaction) — `ProcessMessenger` (host send) + `BaseRuntimeSubprocessController.parseStdout` (host recv). stderr = metrics. **Guest transport is pluggable**: `deno-runtime/main.ts` → `setTransport(stdoutTransport)`.
- **Bidirectional + chatty**: app→host `bridges:<bridge>:<doMethod>` JSON-RPC callbacks run on host (DB, rooms, messages, persistence). Every DB touch = 1 host round-trip → transport latency matters a lot.
- **Liveness**: raw `_zPING`/`_zPONG` (not JSON-RPC), 10s interval / 1s timeout / 4 misses → restart. `LivenessManager` + `restartApp()`. Unchanged by VM move as long as transport carries the bytes.
- **App source**: ZIP (app.json + bundled JS), stored default in **GridFS** (Mongo), fetched → parsed → sent to subprocess via `app:construct` RPC (source travels over the pipe, NOT a shared mount). Legacy multi-file bundled at runtime w/ esbuild.
- **Runtime files**: deno-runtime + apps-engine src + base-runtime resolved from node_modules, symlinked into host temp dir (`os.tmpdir()/apps-engine-temp`) because Deno 2.x won't run inside node_modules.
- **Deploy today**: Deno binary baked into image (`Dockerfile.debian`: `COPY --from=denoland/deno:bin`; `Dockerfile.alpine`: `apk add deno`). `.tool-versions` pins deno 2.3.1. `--cached-only` + prewarmed `.deno-cache`. Cluster/microservice mode: **each node runs its own engine**, app state synced via `apps-engine` Moleculer events.

## Target architecture (PoC)

```
Rocket.Chat (Node/Meteor host)
  └ AppRuntimeManager  ── per app ──▶ FirecrackerRuntimeSubprocessController
        │  (msgpack JSON-RPC, same codec, over vsock instead of stdio)
        ▼
   Firecracker VMM  (1 microVM per app, KVM /dev/kvm)
     guest kernel (vmlinux) + rootfs (ext4: deno + deno-runtime + apps-engine + base-runtime)
       └ deno main.ts  setTransport(vsockTransport)  ── runs app code
```

Isolation boundary moves process→VM. Same JSON-RPC protocol + msgpack codec reused; **only the transport channel changes (stdio → vsock)** and the process launcher changes (spawn deno → boot Firecracker).

## Deployment requirement changes  ⚠️ (the ask)

### Host / infra — biggest blocker
- **`/dev/kvm` required.** Firecracker needs KVM. Rules out most managed container platforms (Fargate/ECS, App Runner, many k8s node pools). Need **bare-metal or nested-virt-enabled** hosts: AWS `*.metal` / nested-virt instances, GCP nested virtualization, Azure Dv3/Ev3. Applies to **every node** in cluster mode (each runs its own engine).
- If RC itself runs in a VM → **nested virtualization** must be on.
- **Linux-only.** Firecracker = Linux+KVM. macOS/Windows dev boxes can't run this backend → keep deno/node backend as default, firecracker strictly opt-in. Dev-experience hit; document.
- x86_64 **and** arm64 need separate kernel+rootfs artifacts (matrix).

### Container privileges (today runs non-root uid 65533)
- Mount `/dev/kvm` (+ `kvm` group access) and `/dev/net/tun` into the RC container.
- tap-device creation needs `CAP_NET_ADMIN` (or pre-provisioned taps).
- **jailer** (Firecracker's cgroup/namespace/seccomp hardener) wants privileges. → move from locked-down non-root to a privileged / added-caps container. Security review needed — we'd be trading Deno-perms for VM boundary but loosening the container.

### Extra binaries in the image
- `firecracker` binary.
- `jailer` binary (recommended, not strictly required for spike).
- **guest kernel image** `vmlinux` — build + pin + ship.
- **guest rootfs** ext4 image bundling: deno binary + `deno-runtime/` + `@rocket.chat/apps-engine` src + `base-runtime/` (everything currently symlinked from node_modules must be baked into rootfs, or attached as a virtio block / virtio-fs device). App source itself still arrives over transport via `app:construct` (no rootfs rebuild per app).

### Extra services / containers
- **microVM orchestrator/supervisor** — no Node Firecracker SDK, so either:
  - (a) drive Firecracker REST API over its unix socket ourselves from Node (thin, PoC-friendly), or
  - (b) adopt **firecracker-containerd** / **Kata Containers** / **Weave Ignite** (heavier; extra daemon/service). → PoC = (a).
- **Networking plumbing** (only if apps use `networking` perm): per-VM **tap** + bridge + NAT (iptables/nftables). If no networking perm → vsock-only, no tap, simpler. PoC: start vsock-only, add tap for one net-using app.
- **Log/metrics path**: today stderr=metrics; crossing VM boundary → route over transport or a second vsock port.

### Transport
- stdin/stdout pipe → **vsock (AF_VSOCK)** (or virtio-serial). New socket handling both sides. Reuse existing msgpack codec + JSON-RPC untouched.

### Storage / temp
- `manager.getTempFilePath()` shared host dir no longer visible to guest. Per-VM rootfs/overlay (copy-on-write from base). Anything relying on shared temp FS must move over transport or virtio-fs.

### CI / build
- New pipeline steps: build+publish `vmlinux` + rootfs artifacts (per arch), cache them; add a firecracker e2e job (needs KVM runner — self-hosted/bare-metal, GH-hosted runners lack `/dev/kvm`).

## Code touchpoints

- `packages/apps/src/server/managers/AppRuntimeManager.ts` — add `firecrackerRuntimeFactory`, extend backend switch (`APPS_ENGINE_RUNTIME_BACKEND=firecracker`).
- **new** `packages/apps/src/server/runtime/firecracker/` — `FirecrackerRuntimeSubprocessController`. Doesn't fit `buildProcessConfiguration()` cleanly (it boots a VM, not a child stdio process) → needs a transport abstraction.
- `packages/apps/src/server/runtime/base/` — **main refactor**: `ProcessMessenger` and `BaseRuntimeSubprocessController` (`parseStdout`/`setupListeners`/`spawnProcess`/`killProcess`) are hard-wired to `child.stdin`/`stdout`. Introduce a `Transport` seam (stdio impl vs vsock impl) so base logic (JSON-RPC loop, bridges, liveness, restart) is channel-agnostic.
- guest `packages/apps/deno-runtime/` — add `lib/transports/vsockTransport.ts`, swap `setTransport()` in `main.ts` when running under Firecracker (transport already pluggable — cheap).
- Liveness ping/pong, codec, bridge handling: **no change** (channel-agnostic once transport seam exists).

## PoC phases

- **P0 — spike, outside RC (1–2 wk).** Manually: build vmlinux+rootfs w/ deno+runtime, boot 1 Firecracker VM, run `deno-runtime/main.ts` in guest, JSON-RPC over vsock, echo one bridge call from a trivial app. Measure boot + rtt. Go/no-go gate.
- **P1 — transport seam (in RC).** Refactor base controller/messenger to a `Transport` interface; prove existing deno backend still green over the seam (stdio impl). No behavior change.
- **P2 — firecracker backend.** New controller + vsock transport, 1 VM per app, boot/teardown via Firecracker REST-over-unixsock. Wire into `AppRuntimeManager`. Get 1 real marketplace app: install → enable → onEnable → a slashcommand + a DB bridge round-trip, inside a VM.
- **P3 — measure + report.** Boot time, bridge rtt p50/p95 vs deno, mem/app, teardown, density. Test networking-perm app w/ tap+NAT. Write deploy delta + go/no-go.

## Metrics / success criteria

- Functional: app installs, enables, handles an event, does a DB bridge round-trip, restarts on crash — all inside VM.
- Boot latency per app (target: FC ~<125ms + deno init; likely need **pre-booted VM pool** to hide it — note vs current spawn).
- Bridge rtt p50/p95 vsock vs stdio (chatty path — the risk).
- Mem per app (kernel + deno overhead) → density ceiling vs today's subprocess.
- Teardown clean, no leaked taps/VMs/sockets.

## Risks / open questions

- **KVM availability** = adoption blocker for RC Cloud + self-hosters on managed platforms. Firecracker may end up an opt-in "high-isolation" tier, not default.
- **Density**: N apps = N kernels+rootfs. Mem/startup cost vs N deno processes — could regress. Pooling/prewarm needed.
- **Bridge latency**: vsock rtt on every DB op; if >> pipe, chatty apps suffer.
- **Container hardening tradeoff**: gain VM boundary, lose non-root/locked-down container. Net security posture must be argued.
- **Cluster mode**: per-node KVM requirement multiplies infra cost.
- **Cold vs pooled**: decide early — pool of prebooted VMs (snapshot/restore via FC snapshotting) likely required to match current enable latency.
- Non-Linux dev flow — keep deno default; firecracker gated behind env + Linux+KVM check.

## Recommendation

Do P0 spike first, cheap, outside the codebase — it answers the two decisive questions (KVM/deploy cost + bridge-rtt over vsock) before touching `packages/apps`. Only invest in the P1 transport-seam refactor if P0 clears.
