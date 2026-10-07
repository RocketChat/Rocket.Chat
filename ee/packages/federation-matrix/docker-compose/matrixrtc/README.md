# Two federated Rocket.Chat servers with their own LiveKit (MatrixRTC)

A local environment for MatrixRTC calls between two Rocket.Chat servers federated over Matrix.
Each server has its own LiveKit SFU: a user publishes on their own server's SFU and subscribes to
the other server's SFU (multi-SFU).

```
           browser (this Mac)                                  browser (this Mac)
     profile A: alice@rc1                                  profile B: carol@rc2
        |  https://rc1          ws://localhost:7980 / 7990          https://rc2  |
        v                                  |                                     v
  +---------------------------- traefik :443 (TLS, mkcert) ----------------------------+
  |  rc1-net                                                        rc2-net            |
  |  rc1 (Rocket.Chat) <---- federation: https://rc2 via traefik ----> rc2 (Rocket.Chat)|
  |  livekit1 :7980/7981/7982udp                         livekit2 :7990/7991/7992udp   |
  +-------------------------------- mongo (rs0: db rc1, db rc2) -----------------------+
```

Each server sits on its own Docker network with traefik, which answers to every server name
(`rc1`, `rc2`, `hs1`). So rc1 reaches rc2 only through `https://rc2` on traefik, with TLS and the
real server name, as it would in production, never the other container's plain HTTP port.

## What runs where

| Service | Reached at | Notes |
| --- | --- | --- |
| traefik | host `:80`, `:443` | routes `rc1`, `rc2` (and `hs1`, `element` with `--interop`); `:80` redirects to HTTPS |
| rc1 | https://rc1 | Rocket.Chat, federation domain `rc1`, db `rc1` |
| rc2 | https://rc2 | Rocket.Chat, federation domain `rc2`, db `rc2` |
| livekit1 | `ws://localhost:7980` (signalling), `7981/tcp`, `7982/udp` (media) | rc1's SFU; from inside rc1: `ws://livekit1:7980` |
| livekit2 | `ws://localhost:7990` (signalling), `7991/tcp`, `7992/udp` (media) | rc2's SFU; from inside rc2: `ws://livekit2:7990` |
| mongo | `mongodb://127.0.0.1:27037/?directConnection=true` | one replica set `rs0`, databases `rc1` and `rc2` |
| hs1 (`--interop`) | https://hs1 | Synapse, users `admin`, `alice`, `bob` (password = username) |
| element (`--interop`) | https://element | Element Web pointed at hs1 |

All host ports bind to `127.0.0.1` except traefik's 80/443. Ports 80 and 443 are also what
`matrix-homeserver-local` and `../../docker-compose.test.yml` use, so stop those first.

LiveKit advertises `127.0.0.1` in its ICE candidates (`node_ip`, `use_external_ip: false`), so
calls work from browsers on this Mac only. The container ports equal the host ports for that reason.
Chrome lets an `https://` page open `ws://localhost`, so the SFUs need no TLS.

## Prerequisites

- Docker Desktop.
- `/etc/hosts` maps `rc1`, `rc2` (and `hs1`, `element` for `--interop`) to `127.0.0.1`.
- A local federation checkout such as `matrix-homeserver-local` (default
  `~/Projects/matrix-homeserver-local`) with:
  - `traefik/certs/{rc1,rc2,hs1,element}.pem` and `-key.pem`, plus `traefik/certs/ca/rootCA.crt`, from a mkcert
    CA trusted by this Mac;
  - a `.env` with `ENTERPRISE_LICENSE_RC1`, `ENTERPRISE_LICENSE_RC2`, `MATRIX_SIGNING_KEY_RC1`,
    `MATRIX_SIGNING_KEY_RC2`.
- `meteor`, `yarn`, `jq`, `curl` on the PATH, and `yarn install` done in the repo.

## First run

```bash
cd ee/packages/federation-matrix/docker-compose/matrixrtc
./init-env.sh            # writes .env (gitignored): cert path, licences, signing keys, new LiveKit keys
./build-image.sh         # yarn build + meteor build + docker build -> rocketchat/rocket.chat:matrixrtc-poc
./up.sh                  # starts everything, waits for both servers and both SFUs
./seed.sh                # alice@rc1, carol@rc2, federated DM between them, one message each way
```

`init-env.sh` takes the checkout path as its argument (or `MATRIX_LOCAL_DIR`), never prints values,
and keeps variables already in `.env`. See `.env.example` for every variable and optional
overrides (`RC_LOG_LEVEL`, `RC_TEST_MODE`, `MONGO_HOST_PORT`, image tags).

## After changing code

```bash
./build-image.sh         # add --no-packages when nothing under packages/ or ee/packages/ changed
./up.sh --recreate       # recreates rc1 and rc2 on the new image; data is kept
```

The Meteor bundle reads workspace packages from their `dist/`, which is why `build-image.sh` runs
`yarn build` (turbo, so only changed packages rebuild) unless told not to. The bundle includes
uncommitted changes; the script logs the HEAD and the number of modified files, and labels the image
with both.

A bundle built on macOS only carries the macOS binaries of packages that ship one optional
dependency per platform (sharp, esbuild, `@napi-rs/pinyin`), and the server would crash on the first
`require`. `build-image.sh` therefore runs `fix-bundle-natives.js` in the Dockerfile's node alpine base
to swap them for the linux-musl ones before `docker build`. A full build takes about 8 minutes
(`yarn build` with turbo cache ~2, `meteor build` ~3, `docker build` ~3).

## Logging in

Use two Chrome profiles (or a profile and a Guest window), one per user, so each has its own
session and camera/microphone choice:

| Profile | URL | User | Password |
| --- | --- | --- | --- |
| A | https://rc1 | `alice` | `Alice-MatrixRTC-1` |
| B | https://rc2 | `carol` | `Carol-MatrixRTC-2` |

`admin` / `admin` works on both servers. The fixture passwords are defined in `seed.sh`. Alice sees
the DM as `@carol:rc2`, Carol as `@alice:rc1`.

## Settings applied from the compose file

Set with `OVERWRITE_SETTING_*`, so they are read-only in the admin UI:

- Federation: `Federation_Service_Enabled`, `Federation_Service_Domain` (`rc1` / `rc2`),
  `Federation_Service_Matrix_Signing_Key` (from `.env`).
- LiveKit: `VideoConf_LiveKit_Enabled`, `VideoConf_LiveKit_Url` (`ws://localhost:7980` / `ws://localhost:7990`),
  `VideoConf_LiveKit_Api_Key` / `_Api_Secret` (from `.env`), `VideoConf_Conference_Window_Enabled`,
  `VideoConf_Default_Provider=livekit`.
- MatrixRTC PoC: `Federation_Service_MatrixRTC_Enabled=true`, `Federation_Service_MatrixRTC_Mode=matrix_2_0`
  (marked block in `docker-compose.yml`; ignored until the server registers them).

`TEST_MODE=api` (as in `docker-compose.test.yml`) removes the REST rate limits and adds an internal
test admin, but also makes the server exit on an unhandled promise rejection; the restart policy
brings it back. Set `RC_TEST_MODE=` in `.env` to turn it off.

## Everyday commands

```bash
./logs.sh rc1 rc2                 # follow logs (TAIL=1000 ./logs.sh rc1 for more history)
./logs.sh livekit1 livekit2
./up.sh --interop                 # also start hs1 + element
./down.sh                         # stop and remove containers, keep data
./down.sh --volumes               # also wipe mongo and hs1 data
docker compose ps                 # from this directory
curl http://localhost:7980        # "OK" when livekit1 is up
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `up.sh` times out on rc1/rc2 | `./logs.sh rc1`: a crash at startup usually means the image is older than the packages it was built with; rebuild without `--no-packages` |
| `up.sh` warns `federation on rc1 answers HTTP 403`, `seed.sh` stops early, no LiveKit settings in the admin UI | federation and the LiveKit provider are enterprise modules: the licence in `.env` is missing or expired (`docker compose logs rc1 \| grep License` shows `Period validation failed`). Put valid ones in `.env` and run `./up.sh --recreate` |
| `bind: address already in use` on 80/443 | another traefik (matrix-homeserver-local, docker-compose.test.yml) is running |
| Call connects but no media | `./logs.sh livekit1` for ICE errors; UDP 7982/7992 must be free on the host |
