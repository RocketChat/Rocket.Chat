# MatrixRTC wire protocol reference

The exact formats Rocket.Chat must emit and accept to take part in MatrixRTC (LiveKit) calls in federated rooms, as
the reference implementations use them on 2026-10-07. The overview of the feature is in [README.md](README.md).

Everything below was read from source. Each claim links to the file and lines at a fixed commit or tag. Where an MSC
and the implementation disagree, both are given, and the "on the wire" column says which one Element actually sends.

## Contents

- [0. Sources and generations](#0-sources-and-generations)
- [Assumptions check](#assumptions-check)
- [1. Sticky events (MSC4354)](#1-sticky-events-msc4354)
- [2. Membership in `matrix_2_0` mode](#2-membership-in-matrix_2_0-mode)
- [3. Membership in `compatibility` mode](#3-membership-in-compatibility-mode)
- [4. LiveKit participant identity and room name](#4-livekit-participant-identity-and-room-name)
- [5. Token issuance](#5-token-issuance)
- [6. Ringing and declining (MSC4075, MSC4310)](#6-ringing-and-declining-msc4075-msc4310)
- [7. E2EE key distribution (brief)](#7-e2ee-key-distribution-brief)
- [8. Power levels](#8-power-levels)
- [Open questions / unverified](#open-questions--unverified)

## 0. Sources and generations

| Source | Ref read | Commit | Date |
| --- | --- | --- | --- |
| matrix-js-sdk `develop` | `develop` | [`2a70f51`](https://github.com/matrix-org/matrix-js-sdk/tree/2a70f5130c469020e2ff5e64ea2e8a221fd3a448) | 2026-10-07 |
| matrix-js-sdk latest release | `v43.0.0` | [tag](https://github.com/matrix-org/matrix-js-sdk/tree/v43.0.0) | 2026-09-29 |
| matrix-js-sdk pinned by Element Call v0.26.1 | lockfile pin | [`24929be`](https://github.com/matrix-org/matrix-js-sdk/tree/24929be0e741be6a5d0a7226f1c682e245263b8a) | |
| matrix-js-sdk pinned by Element Call `main` | lockfile pin | [`fa4772a`](https://github.com/matrix-org/matrix-js-sdk/tree/fa4772a4ddd335a5a8bfbf8bb21df49b70f7a999) | 2026-10-01 |
| Element Call `main` | `main` | [`1f07f94`](https://github.com/element-hq/element-call/tree/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b) | 2026-10-07 |
| Element Call latest release | `v0.26.1` | [`9f7c35c`](https://github.com/element-hq/element-call/tree/v0.26.1) | 2026-09-28 |
| Element Call PR #4331 (open) | head | [`ddfcde4`](https://github.com/element-hq/element-call/pull/4331) | 2026-10-07 |
| Element Web `develop` | `develop` | [`4d1993c`](https://github.com/element-hq/element-web/tree/4d1993cc38ef6f96257bbe693863d56f1bd65b61) | 2026-10-07 |
| Synapse `develop` | `develop` | [`2392446`](https://github.com/element-hq/synapse/tree/2392446370a5f708a5290bb69c5f9ebc37298d41) | 2026-10-07 |
| lk-jwt-service `main` | `main` | [`33e3851`](https://github.com/element-hq/lk-jwt-service/tree/33e385153bfb9caa1d9cc86a92bed3ec7c610adf) | 2026-10-06 |
| lk-jwt-service latest release | `v0.7.0` | [tag](https://github.com/element-hq/lk-jwt-service/tree/v0.7.0) | 2026-09-10 |
| MSC4354 sticky events | `kegan/persist-edu` | [`820ac4f`](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md) | open |
| MSC4143 MatrixRTC | `toger5/matrixRTC` | [`ed8d4df`](https://github.com/matrix-org/matrix-spec-proposals/blob/ed8d4dfa9f44eb3bb789018d7c2d76731f09ee2d/proposals/4143-matrix-rtc.md) | open |
| MSC4195 LiveKit transport | `hughns/matrixrtc-livekit` | [`357dcfa`](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md) | open |
| MSC4075 invites/notifications | `toger5/matrixrtc-call-ringing` | [`4d0bdea`](https://github.com/matrix-org/matrix-spec-proposals/blob/4d0bdea29b47509238ec5c19852487de93d40647/proposals/4075-rtc-notification-event.md) | open |
| MSC4310 decline | `toger5/matrixRTC-call-decline` | [`67687dc`](https://github.com/matrix-org/matrix-spec-proposals/blob/67687dc381f56c626edf6e00a2bd2c5e2d04e56b/proposals/4310-matrixRTC-call-decline.md) | closed, folded into MSC4075 ([comment](https://github.com/matrix-org/matrix-spec-proposals/pull/4310)) |
| MSC4519 transports registry | `travis/msc/voip-transports-registry` | [`34f78fb`](https://github.com/matrix-org/matrix-spec-proposals/blob/34f78fb1b68bf594b78d7d4ac50a39bda520e227/proposals/4519-rtc-transports-registry.md) | open |
| MSC4140 delayed events | `toger5/expiring-events-keep-alive` | [`02a1abf`](https://github.com/matrix-org/matrix-spec-proposals/blob/02a1abfbdf36d3452e2ee3f84ccd5b72ea3db67c/proposals/4140-delayed-events-futures.md) | merged 2026-09-08 |
| Matrix spec (OpenID) | `main` | [`c6a54df`](https://github.com/matrix-org/matrix-spec/tree/c6a54df511489a9e7f7880b4d55a36ae67405400) | |

The implementations are mid-migration, so "what the reference implementation does" depends on which build is
talking. This document uses three generations:

| Generation | Builds | What it means on the wire |
| --- | --- | --- |
| **Released** | Element Call v0.26.1 + js-sdk `24929be`/v43.0.0 + lk-jwt-service v0.7.0 | What deployed Element Call sends and expects today |
| **Main** | Element Call `main` + js-sdk `fa4772a` + lk-jwt-service `main` | Same identities as Released; drops `livekit_alias` and the `m.relation` field |
| **In flight** | js-sdk `develop` (PR [#5587](https://github.com/matrix-org/matrix-js-sdk/pull/5587) merged 2026-10-06, unreleased), js-sdk PR [#5588](https://github.com/matrix-org/matrix-js-sdk/pull/5588) (open), Element Call PR [#4331](https://github.com/element-hq/element-call/pull/4331) (open) | Aligns with MSC4195: identity chosen by the transport's shape, homeserver C-S token endpoint |

Element Call's mode switch is documented in [`docs/matrix_rtc_modes.md`](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/docs/matrix_rtc_modes.md):
`compatibility` is the default; `matrix_2_0` needs a homeserver advertising `org.matrix.msc4354` and all clients on
Element Call ≥ v0.17.0.

## Assumptions check

| Assumption | Verdict |
| --- | --- |
| `matrix_2_0` uses sticky `org.matrix.msc4143.rtc.member` | **Confirmed.** Sticky duration 3 600 000 ms, sticky key in `content.msc4354_sticky_key` = `member.id`. Content shape differs from the MSC text, see [§2](#2-membership-in-matrix_2_0-mode). |
| compat uses state `org.matrix.msc3401.call.member` with key `_@user:server_DEVICE_m.call` | **Confirmed** for ordinary room versions. Room versions matching `^org\.matrix\.msc(3757\|3779)` drop the leading `_`. |
| S-S token path `/_matrix/federation/unstable/io.element.msc4195/rtc/livekit/get_token` | **Confirmed**, but no released Element client triggers it. Only lk-jwt-service running as a Synapse application service serves it. The body changed on 2026-09-30, from `member:{…}` (v0.7.0) to `member_id` (`main` and MSC). |
| Room alias `base64nopad(sha256(json([room_id, slot_id])))` | **Confirmed.** The alphabet is standard base64 (`+`, `/`), unpadded, and the slot is always `m.call#ROOM`. lk-jwt-service also uses it for the legacy `/sfu/get`. |
| Identity `base64nopad(sha256(json([user_id, member_id])))` | **Only for MSC4195 / In flight.** Element Call as deployed expects `base64nopad(sha256(json([user_id, device_id, member_id])))` for `matrix_2_0` and the plain string `@user:server:DEVICE` (not hashed) for `compatibility`. See [§4](#4-livekit-participant-identity-and-room-name). |

## 1. Sticky events (MSC4354)

### 1.1 Where stickiness lives

A sticky event is an ordinary PDU (message event) with one extra **top-level** key. It cannot live in `content`,
because encrypted sticky events must still be recognisable to servers.
([MSC L45-71](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L45-L71), footnote [L564-565](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L564-L565))

| Item | Stable (MSC) | Unstable (on the wire today) |
| --- | --- | --- |
| PDU / client event top-level field | `sticky: { "duration_ms": <int> }` | `msc4354_sticky: { "duration_ms": <int> }` |
| C-S query parameter on `/send` | `sticky_duration_ms` | `org.matrix.msc4354.sticky_duration_ms` |
| Sticky (map) key | `content.sticky_key` | `content.msc4354_sticky_key` |
| Remaining TTL given to clients | `unsigned.sticky_duration_remaining_ms` | `unsigned.msc4354_sticky_duration_ttl_ms` |
| `/sync` section | `rooms.join.{id}.sticky.events` | `rooms.join.{id}.msc4354_sticky.events` |
| `/versions` flag | | `unstable_features["org.matrix.msc4354"] = true` |

Sources: [MSC unstable prefix L392-409](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L392-L409);
Synapse [`api/constants.py` L479-507](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/api/constants.py#L479-L507) (`QUERY_PARAM_NAME`, `EVENT_FIELD_NAME = "msc4354_sticky"`, `MAX_DURATION = 1h`, `MAX_EVENTS_IN_SYNC = 100`) and [L329](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/api/constants.py#L329) (`msc4354_sticky_duration_ttl_ms`);
Synapse `/versions` [`rust/src/handlers/versions.rs` L261-263, L331](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/rust/src/handlers/versions.rs#L261-L263) (gated by `experimental_features.msc4354_enabled`);
js-sdk reads `event.msc4354_sticky` and `unsigned.msc4354_sticky_duration_ttl_ms` ([`models/event.ts` L76-100](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/models/event.ts#L76-L100), [L1765-1777](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/models/event.ts#L1765-L1777)).

### 1.2 Duration, start and expiry

- `duration_ms` is an integer in milliseconds. The intended range is 0–3 600 000. Any integer is accepted and clamped
  to 1 hour when evaluated. The stored PDU keeps whatever the sender wrote, since Synapse copies the query parameter
  verbatim ([Synapse `rest/client/room.py` L431-465](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/rest/client/room.py#L431-L465)).
- **Server-side**, the start is `min(received_ts, origin_server_ts)` and the end is
  `start + min(duration_ms, 3600000)`. The event is sticky while the end is in the future
  ([MSC L79-89](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L79-L89)).
  Synapse implements exactly this ([`rust/src/events/mod.rs` L408-477](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/rust/src/events/mod.rs#L408-L477)).
  A missing or non-integer `duration_ms`, or a negative one (the `as_u64()` call fails), makes the event
  non-sticky. Rejected and spam-flagged events are never sticky. Events without a `received_ts` (persisted before the
  feature was enabled) are never sticky.
- **Client-side** (js-sdk): `expiresAt = now + min(unsigned.msc4354_sticky_duration_ttl_ms, 1h)` when the server
  gave a TTL, otherwise `min(now, origin_server_ts) + min(duration_ms, 1h)`. `duration_ms` of `0` or missing means
  "not sticky" ([`models/event.ts` L216, L462-468](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/models/event.ts#L462-L468)).
- The MSC says the duration SHOULD NOT be below 5 minutes because of clock skew
  ([L295](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L295)).
  Element nonetheless sends 110 000 ms for notifications and 120 000 ms for declines ([§6](#6-ringing-and-declining-msc4075-msc4310)).

### 1.3 Sticky key and the ephemeral map

- The key is in **content** (`msc4354_sticky_key`) and is "ignored server-side"
  ([MSC L438-445](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L438-L445)).
- Clients keep a map keyed by `(room_id, sender, type, sticky_key)`. On collision the MSC picks the highest
  `origin_server_ts + duration_ms`, then the lexicographically highest event ID
  ([L446-456](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L446-L456)).
  js-sdk sorts by its computed `unstableStickyExpiresAt` (§1.2), then event ID
  ([`models/room-sticky-events.ts` L61-82](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/models/room-sticky-events.ts#L61-L82)).
  Sticky events without a key are kept in a separate unkeyed set.
- Removing an entry means sending another sticky event with the same key and no other application fields, using the
  **same duration** as the entry it replaces ([L473-479](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L473-L479)).
- Two events with the same key sent in the same millisecond can resolve in either order. Senders must leave at least
  1 ms between them ([L452-455](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L452-L455)).

### 1.4 Hashes, signatures, redaction

- `msc4354_sticky` is **not** in the redaction allow-list
  ([Synapse `rust/src/events/utils.rs` L106-133](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/rust/src/events/utils.rs#L106-L133);
  [MSC L54-55, L206-208](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L206-L208)).
  Consequences:
  - It **is** covered by the content hash (`hashes.sha256`). That hash covers the whole event minus `unsigned`,
    `signatures`, `hashes`, `age_ts`, `outlier` and `destinations`
    ([`crypto/event_signing.py` L83-108](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/crypto/event_signing.py#L83-L108)).
  - It is **not** covered by the signatures or the event ID (reference hash), since both are computed over the
    redacted form ([`utils.rs` L63-82](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/rust/src/events/utils.rs#L63-L82)).
    A tampered `msc4354_sticky` fails the content-hash check, so the receiver redacts the event, which drops the
    stickiness.
  - Redacting a sticky event removes its stickiness.
- Rocket.Chat must include `msc4354_sticky` in the object it hashes for `hashes.sha256`. It must strip it before
  computing the reference hash (event ID) and the signature, as the redaction algorithm does for every unknown
  top-level key.

### 1.5 Server obligations over federation

From the MSC ([L91-116](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L91-L116), [L247-280](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L247-L280)):

1. Push **your own** unexpired sticky events (sender's domain = you) to all joined servers. Respect backoff. Never
   drop them from the queue because of volume. Only your own, because the receiver may need to fetch `prev_events`
   from you.
2. When a server **newly joins**, push all your own unexpired sticky events to it.
3. Deliver unexpired sticky events to clients of all joined users regardless of history visibility. This is
   C-S only and does not concern Rocket.Chat.
4. Re-evaluate soft-failure of unexpired sticky events when their authorising state changes. Never soft-fail an
   accepted event retroactively.
5. No history-visibility checks on unexpired sticky events, on any endpoint that can return them.
6. Apply spam checks and policy servers. An event flagged as spam is treated as non-sticky.
7. Optional: rate-limit sticky events received over federation; send best-effort in creation order; do not catch up
   sticky events of erased users.

What Synapse actually does today:

- Sticky events go out in normal `/send` transactions as part of the PDU. There is no separate EDU.
- Catch-up after a destination was unreachable is implemented: a per-(destination, room) backlog
  (`destination_rooms_sticky_events_backlog`) is drained alternately with the live queue, at most 50 locally
  originated, unexpired sticky events per transaction
  ([`storage/databases/main/sticky_events.py` L792-975](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/storage/databases/main/sticky_events.py#L792-L975),
  [`federation/sender/per_destination_queue.py` L1085-1145](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/federation/sender/per_destination_queue.py#L1085-L1145)).
- **Not implemented: pushing to newly joined servers.** The tracking issue lists "Federation: sending historical
  sticky events to newly-joined servers" as a current gap ([element-hq/synapse#19409](https://github.com/element-hq/synapse/issues/19409)).
  Element Call refreshes a sticky membership only about once an hour (§2.4). So when Rocket.Chat joins a room after a
  Synapse user is already in a call, it may not see that membership for up to about 60 minutes.
- Outlier events (for example ones received via backfill) are never stored as sticky, because the room state at
  them is unknown ([`sticky_events.py` L342-391](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/storage/databases/main/sticky_events.py#L342-L391)).
  Soft-failed sticky events are stored and re-checked later.

### 1.6 How a client asks for one (C-S, for reference)

```
PUT /_matrix/client/v3/rooms/{roomId}/send/{eventType}/{txnId}?org.matrix.msc4354.sticky_duration_ms=3600000
```

With MSC4140 delayed events, Synapse uses the same endpoint plus `org.matrix.msc4140.delay=<ms>`. The sticky
duration is stored with the delayed event and applied when it fires
([`rest/client/room.py` L431-450](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/rest/client/room.py#L431-L450);
js-sdk [`client.ts` L3554-3585, L3630-3654](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/client.ts#L3554-L3585)).
js-sdk refuses to send a sticky event unless `/versions` lists `org.matrix.msc4354`
([`client.ts` L589](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/client.ts#L589)).
The MSC used to allow sticky **state** events from clients but no longer does
([L556-562](https://github.com/matrix-org/matrix-spec-proposals/blob/820ac4f57865cc006071fdc2e59639345eb594b8/proposals/4354-sticky-events.md#L556-L562)).

### 1.7 Example PDU over federation

A `matrix_2_0` join as Rocket.Chat would put it in `PUT /_matrix/federation/v1/send/{txnId}`. The hashes and
signatures are placeholders. The PDU fields follow room versions 10 to 12.

```json
{
  "origin": "rc.example.com",
  "origin_server_ts": 1791374400050,
  "pdus": [
    {
      "auth_events": ["$create", "$power_levels", "$alice_join"],
      "content": {
        "application": { "type": "m.call", "m.call.intent": "video" },
        "member": {
          "device_id": "RCDEVICE01",
          "id": "2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10",
          "user_id": "@alice:rc.example.com"
        },
        "msc4354_sticky_key": "2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10",
        "slot_id": "m.call#ROOM",
        "transports": {
          "can_subscribe": ["livekit"],
          "published": [{ "type": "livekit", "livekit_service_url": "https://rc.example.com/_rc/livekit-jwt" }]
        },
        "versions": []
      },
      "depth": 1234,
      "hashes": { "sha256": "<unpadded base64 sha256 over the event including msc4354_sticky>" },
      "msc4354_sticky": { "duration_ms": 3600000 },
      "origin_server_ts": 1791374400000,
      "prev_events": ["$latest"],
      "room_id": "!abc:rc.example.com",
      "sender": "@alice:rc.example.com",
      "signatures": { "rc.example.com": { "ed25519:0": "<sig over the redacted form, which has no msc4354_sticky>" } },
      "type": "org.matrix.msc4143.rtc.member"
    }
  ]
}
```

## 2. Membership in `matrix_2_0` mode

### 2.1 Event type

`org.matrix.msc4143.rtc.member` (stable `m.rtc.member`). It is a **message event**: sticky, no `state_key`.
([js-sdk `@types/event.ts` L159-164](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/@types/event.ts#L159-L164);
[MSC4143 L747-755](https://github.com/matrix-org/matrix-spec-proposals/blob/ed8d4dfa9f44eb3bb789018d7c2d76731f09ee2d/proposals/4143-matrix-rtc.md#L747-L755))

### 2.2 Join content as js-sdk sends it

Sent with `msc4354_sticky.duration_ms = 3600000` (`MEMBERSHIP_STICKY_DURATION_MS`)
([`MembershipManager.ts` L96, L1290-1300, L1319-1332](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L1290-L1332)):

```json
{
  "slot_id": "m.call#ROOM",
  "application": {
    "type": "m.call",
    "m.call.intent": "video"
  },
  "transports": {
    "published": [
      { "type": "livekit", "livekit_service_url": "https://matrix-rtc.example.com/livekit/jwt" }
    ],
    "can_subscribe": ["livekit"]
  },
  "member": {
    "device_id": "ABCDEFGHIJ",
    "user_id": "@alice:example.com",
    "id": "2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10"
  },
  "versions": [],
  "msc4354_sticky_key": "2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10"
}
```

Field by field:

| Field | Value | Notes |
| --- | --- | --- |
| `slot_id` | `"m.call#ROOM"` | `{application}#{id}`; the default slot is `{ application: "m.call", id: "ROOM" }` ([`MatrixRTCSessionManager.ts` L61](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSessionManager.ts#L61)). The MSC4143 text says `m.call#room`, but the implementation uses upper-case `ROOM`, and the hashes in §4 depend on it. |
| `application.type` | `"m.call"` | Must not contain `#` |
| `application["m.call.intent"]` | `"audio"` or `"video"` | Only when set. Element Call sets it from the user's intent ([`UrlConfiguration.ts` L185-221](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/UrlConfiguration.ts#L185-L221)). |
| `application.capabilities` | e.g. `["m.render_audio","m.render_video"]` | js-sdk `develop` only ([#5577](https://github.com/matrix-org/matrix-js-sdk/pull/5577), 2026-10-06); Element Call does not set it yet |
| `transports.published` | array of transport objects | Released and Main publish `{type:"livekit", livekit_service_url}` only. Released js-sdk strips every other key ([`24929be` `MembershipManager.ts` L1101-1127](https://github.com/matrix-org/matrix-js-sdk/blob/24929be0e741be6a5d0a7226f1c682e245263b8a/src/matrixrtc/MembershipManager.ts#L1101-L1127)). In flight, `url` and/or `livekit_service_url` are published as discovered ([`LivekitTransport.ts` L57-71](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/LivekitTransport.ts#L57-L71)). |
| `transports.can_subscribe` | `["livekit"]` | Constant |
| `member.user_id` | sender | Receivers **reject** the event if it differs from `sender` ([`rtc.ts` L78-83](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/membershipData/rtc.ts#L78-L83)) |
| `member.device_id` | the device | Required string |
| `member.id` | UUID v4, new per join | Element Call: `uuidv4()` in `matrix_2_0` ([`CallViewModel.ts` L563-574](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/state/CallViewModel/CallViewModel.ts#L563-L574)) |
| `versions` | `[]` | Required array of strings |
| `msc4354_sticky_key` | equals `member.id` | `sticky_key` (stable) is also accepted; if both are present they must be equal |

Released only: on every re-send after the first, js-sdk `24929be`/v43 adds
`"m.relation": { "rel_type": "m.reference", "event_id": "<own previous membership event>" }`. Note the key is
`m.relation`, not `m.relates_to`. It was removed by [#5586](https://github.com/matrix-org/matrix-js-sdk/pull/5586)
([v43 `MembershipManager.ts` L1323-1350](https://github.com/matrix-org/matrix-js-sdk/blob/v43.0.0/src/matrixrtc/MembershipManager.ts#L1323-L1350)).
Receivers ignore it.

**Spec vs reference implementation**
([MSC4143 L173-258](https://github.com/matrix-org/matrix-spec-proposals/blob/ed8d4dfa9f44eb3bb789018d7c2d76731f09ee2d/proposals/4143-matrix-rtc.md#L173-L258), [implementation differences L772-801](https://github.com/matrix-org/matrix-spec-proposals/blob/ed8d4dfa9f44eb3bb789018d7c2d76731f09ee2d/proposals/4143-matrix-rtc.md#L772-L801)):

| MSC4143 | On the wire |
| --- | --- |
| `member: { id, membership: "join" }` | `member: { id, user_id, device_id }` with no `membership`. Joined means a valid `application` object is present. |
| `sticky_key` | `msc4354_sticky_key` |
| transport `type: "m.livekit"` (MSC4195) | `"livekit"` |
| slot `m.call#room` | `m.call#ROOM` |
| (no `versions`) | `versions: []`, required by the validator |
| `/rtc/transports` returns `{ "transports": [...] }` | Synapse returns `{ "rtc_transports": [...] }` ([`rest/client/matrixrtc.py` L30-44](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/rest/client/matrixrtc.py#L30-L44)); MSC4519 also says `rtc_transports` |

### 2.3 Leave

- **js-sdk / on the wire**: a sticky `org.matrix.msc4143.rtc.member` with duration 3 600 000 and content
  ([`MembershipManager.ts` L1280-1288](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L1280-L1288)):

  ```json
  { "slot_id": "m.call#ROOM", "msc4354_sticky_key": "2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10" }
  ```

  A content counts as "left" if every key is `slot_id` or `msc4354_sticky_key`
  ([`membershipData/common.ts` L25-27](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/membershipData/common.ts#L25-L27)).
  Element sends this as an MSC4140 **delayed** event, scheduled before the join and restarted periodically. It fires
  on a voluntary hang-up (`/send` action) or when the restarts stop.
- **MSC4143**: `member: { id, membership: "leave" }`, optional `leave_reason: { code: "leave" | "delayed_leave" | "slot_closed", reason }`,
  and `sticky_key` ([L275-298](https://github.com/matrix-org/matrix-spec-proposals/blob/ed8d4dfa9f44eb3bb789018d7c2d76731f09ee2d/proposals/4143-matrix-rtc.md#L275-L298)).
  js-sdk does not recognise this as "left". It fails validation (no `application`), so the member is dropped all the
  same.
- Rocket.Chat should send the js-sdk form with the **same** sticky duration as the join, at least 1 ms after the last
  join or refresh (§1.3).

### 2.4 Refresh and stale-member cleanup

| What | Value | Source |
| --- | --- | --- |
| Sticky duration of join, refresh and leave | 3 600 000 ms | `MEMBERSHIP_STICKY_DURATION_MS` [L96](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L96) |
| Refresh (re-send the same join content) | every `min(membershipEventExpiryMs = 4h, 1h) × n − 5 s`, about 59 min 55 s | [L434-440](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L434-L440) |
| Delayed leave, client-managed | Element Call: `delay_ms 18000`, restart every `4000`; js-sdk default `8000` / `5000` | [EC `ConfigOptions.ts` L302-306](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/config/ConfigOptions.ts#L302-L306), [js-sdk L441-446](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L441-L446) |
| Delayed leave, delegated to the SFU's service | `delay_ms 3600000`, restart `300000`; the service restarts it while the LiveKit participant is connected and sends it on disconnect (SFU webhook plus polling) | [MSC4195 L457-579](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L457-L579) |

Delayed events are purely client-to-own-homeserver (MSC4140). Nothing about them crosses federation: other servers
see only the leave event when it fires, with `origin_server_ts` set to the firing time. Rocket.Chat, which owns its
users' devices, emulates them server-side:

1. On join, send the join sticky event.
2. Re-send it before the 1-hour stickiness runs out, with the same content and duration. Element uses a 5-second
   headroom; a larger one is safer.
3. When the user leaves or vanishes, send the leave form. Vanishing means the LiveKit `participant_left` webhook for
   that identity on Rocket.Chat's SFU, or a missed client heartbeat; Element's delayed leave fires after about 18 s.

Receivers drop a `matrix_2_0` membership when stickiness expires, when a leave supersedes it in the map, when the
sender stops being joined to the room, or when the slot is explicitly closed (§2.5). Content-level expiry does not
apply: `getAbsoluteExpiry()` is `undefined` for these
([`CallMembership.ts` L369-379](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/CallMembership.ts#L369-L379)).

### 2.5 How a receiver decides a membership is active (js-sdk)

`MatrixRTCSession.sessionMembershipsForSlot` ([`MatrixRTCSession.ts` L428-456](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSession.ts#L428-L456), helpers [L942-1055](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSession.ts#L942-L1055)):

1. Take the **current** entry per `(type, sender, msc4354_sticky_key)` from the unexpired sticky store, filtered to
   `org.matrix.msc4143.rtc.member`. This happens **unless the slot is explicitly closed**: an
   `org.matrix.msc4143.rtc.slot` state event whose `state_key` is the slot ID and whose content has
   `status !== "open"` or a mismatching `application.type`. When no slot event exists, sticky memberships still count
   ([L1030](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSession.ts#L1030),
   [`utils.ts` L99-112](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/utils.ts#L99-L112)).
2. Add legacy `org.matrix.msc3401.call.member` state events, skipping any whose `state_key` equals some sticky
   event's `msc4354_sticky_key`.
3. Drop left contents (§2.3). Keep only contents with more than one non-sticky-key field and an `application` field
   ([L972-991](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSession.ts#L972-L991)).
4. Validate with `checkRtcMembershipData`
   ([`rtc.ts` L52-146](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/membershipData/rtc.ts#L52-L146)):
   - `slot_id` is a string starting with `${application.type}#` with exactly one `#`.
   - `member.user_id` is a valid mxid equal to the sender; `member.device_id` and `member.id` are strings.
   - `application.type` is a string without `#`.
   - `transports.published` is an array of objects with a string `type`; `transports.can_subscribe` is an array of
     strings.
   - `versions` is an array of strings.
   - `sticky_key` or `msc4354_sticky_key` is a string; if both are present they are equal.
5. Keep it if the slot ID matches, it has not expired, and the sender's room membership is `join`
   ([L993-1017](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSession.ts#L993-L1017)).

**Spec vs reference implementation**: MSC4143 requires an **open** `m.rtc.slot` for a member to count, and the
sticky event to be currently sticky
([L260-273](https://github.com/matrix-org/matrix-spec-proposals/blob/ed8d4dfa9f44eb3bb789018d7c2d76731f09ee2d/proposals/4143-matrix-rtc.md#L260-L273)).
js-sdk only excludes on an explicitly closed slot. Neither Element Call `main` nor Element Web's `createRoom.ts` or
`models/Call.ts` sends `org.matrix.msc4143.rtc.slot`. js-sdk can (`ensureRtcSlotOpen`,
[L383-399](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSession.ts#L383-L399)),
but no caller was found. Slot content for reference:

```json
// type: org.matrix.msc4143.rtc.slot, state_key: "m.call#ROOM"
{ "status": "open", "application": { "type": "m.call" } }
```

`encryption: { "type": "org.matrix.msc4143.per_member" }` is added in encrypted rooms
([`types.ts` L540-564](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/types.ts#L540-L564)).
Rocket.Chat need not send a slot, and must not require one when reading. Sending a **closed** slot hides every sticky
membership from Element.

## 3. Membership in `compatibility` mode

### 3.1 Event and state key

A **state** event of type `org.matrix.msc3401.call.member`. The state key is built in
[`MembershipManager.ts` L987-999](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L987-L999):

```
stateKey = `${userId}_${deviceId}_${application}${slotIdPart}`
  slotIdPart = "" when application == "m.call" and slot id == "ROOM", else the slot id
if room_version matches /^org\.matrix\.msc(3757|3779)\b/  → stateKey
else                                                      → "_" + stateKey
```

So in ordinary room versions: `_@alice:example.com_ABCDEFGHIJ_m.call`. The `_` is there because state keys starting
with `@` must equal the sender in every room version. With MSC3757 room versions (`org.matrix.msc3757.10`,
`org.matrix.msc3757.11` in [Synapse `rust/src/room_versions.rs` L287-307](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/rust/src/room_versions.rs#L287-L307)),
an `@user…` prefix is owner-checked instead. Receivers ignore the state key: membership data comes only from content
and `sender`.

### 3.2 Join content

**Main** (Element Call `main` + js-sdk `fa4772a`/`develop`;
[`MembershipManager.ts` L1005-1032](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L1005-L1032)):

```json
{
  "application": "m.call",
  "call_id": "",
  "scope": "m.room",
  "device_id": "ABCDEFGHIJ",
  "membershipID": "@alice:example.com:ABCDEFGHIJ",
  "expires": 14400000,
  "m.call.intent": "video",
  "focus_active": { "type": "livekit", "focus_selection": "multi_sfu" },
  "foci_preferred": [
    { "type": "livekit", "livekit_service_url": "https://matrix-rtc.example.com/livekit/jwt" }
  ]
}
```

**Released** (Element Call v0.26.1 + js-sdk `24929be`): identical, except that the transport has
`livekit_alias: <Matrix room ID>` prepended
([EC v0.26.1 `LocalMember.ts` L1020-1031](https://github.com/element-hq/element-call/blob/v0.26.1/src/state/CallViewModel/localMember/LocalMember.ts#L1020-L1031),
[js-sdk `24929be` L788-818](https://github.com/matrix-org/matrix-js-sdk/blob/24929be0e741be6a5d0a7226f1c682e245263b8a/src/matrixrtc/MembershipManager.ts#L788-L818)):

```json
"foci_preferred": [
  { "livekit_alias": "!abc:example.com", "type": "livekit", "livekit_service_url": "https://matrix-rtc.example.com/livekit/jwt" }
]
```

| Field | Value | Notes |
| --- | --- | --- |
| `application` | `"m.call"` | |
| `call_id` | `""` | Read as slot `m.call#ROOM` (the `""`→`ROOM` compatibility hack, [`CallMembership.ts` L219-267](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/CallMembership.ts#L219-L267)) |
| `scope` | `"m.room"` | Deprecated, still sent |
| `device_id` | the device | |
| `membershipID` | `"${userId}:${deviceId}"` | If absent, receivers use the same default ([L81-96](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/CallMembership.ts#L81-L96)) |
| `expires` | `membershipEventExpiryMs × n`; 4 h (`14400000`) on join, 8 h on the first refresh, and so on | Relative to `created_ts`, or to the event's `origin_server_ts` if `created_ts` is absent |
| `created_ts` | absent on the first join; on refresh, the `origin_server_ts` of the first join | |
| `m.call.intent` | `"audio"` or `"video"` | Top level, unlike `matrix_2_0`; omitted when undefined |
| `capabilities` | array | `develop` only, Element Call does not set it |
| `focus_active` | `{ "type": "livekit", "focus_selection": "multi_sfu" }` | "not consumed by the SDK" ([`session.ts` L45-52](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/membershipData/session.ts#L45-L52)). `oldest_membership` was the pre-multi-SFU value, removed by [#5574](https://github.com/matrix-org/matrix-js-sdk/pull/5574). |
| `foci_preferred[0]` | the transport the member **publishes** on | Receivers take `foci_preferred[0]` ([`CallMembership.ts` L427-437](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/CallMembership.ts#L427-L437)) |
| `livekit_alias` | Matrix room ID (Released only) | Dead. The LiveKit room name comes from the JWT (`video.room`), so Element Call `main` stopped sending it. Readers ignore it. |

Refresh: re-send with `created_ts` pinned and `expires` grown, about every 59 min 55 s
([L434-440](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L434-L440),
[L940-967](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L940-L967)).
The content must change on every refresh, because a homeserver turns identical state into a no-op.

### 3.3 Leave

The same state key with empty content `{}`
([`MembershipManager.ts` L968-980](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L968-L980)).
Element schedules it as a delayed state event
([L512-519](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MembershipManager.ts#L512-L519)).

### 3.4 Receiver validity

`checkSessionsMembershipData` requires ([`session.ts` L111-158](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/membershipData/session.ts#L111-L158)):

- `device_id`, `call_id` and `application` as strings.
- `focus_active.type` as a string.
- `foci_preferred`, if present, as an array of objects with a string `type`.
- `created_ts` as a number, if present.
- `scope` and `m.call.intent` as strings, if present.
- `capabilities` as an array of strings, if present.

The membership counts while `now < (created_ts ?? origin_server_ts) + (expires ?? 14400000)` and the sender is
joined ([`CallMembership.ts` L38, L369-411](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/CallMembership.ts#L369-L411)).
Content of the form `{"memberships":[…]}` (pre-2024) is ignored.

## 4. LiveKit participant identity and room name

A receiving Element client maps a LiveKit participant on a member's SFU to that member by **identity string
equality**. Rocket.Chat must mint tokens for its own users with exactly the identity Element derives from the
membership Rocket.Chat published.

### 4.1 What Element expects, per generation

| Membership form | Transport published | Released and Main (deployed) | In flight (js-sdk `develop` + EC PR #4331) | MSC4195 |
| --- | --- | --- | --- | --- |
| compat state event | `livekit_service_url` | `"${sender}:${device_id}"`, plain | same | n/a |
| compat state event | `url` | `"${sender}:${device_id}"` | `H([sender, membershipID ?? "${sender}:${device_id}"])` | n/a |
| `matrix_2_0` sticky | `livekit_service_url` | **`H([member.user_id, member.device_id, member.id])`** | `"${sender}:${member.device_id}"`, plain | n/a |
| `matrix_2_0` sticky | `url` | (not usable: these builds connect only via `livekit_service_url`) | `H([sender, member.id])` | `H([sender, member.id])` |
| `matrix_2_0` sticky | both | `H([user_id, device_id, member.id])` | either `H([sender, member.id])` or `"${sender}:${device_id}"` (both are candidates) | |

`H(arr) = unpaddedBase64(SHA-256(UTF-8(JSON array)))`, standard alphabet. js-sdk uses `JSON.stringify` and
lk-jwt-service uses `serde_json::to_vec`; for string arrays both equal Matrix canonical JSON.

Sources:

- Released/Main: `parseFromEvent` returns `computeRtcIdentityRaw(member.user_id, member.device_id, member.id)` for
  sticky memberships and `` `${sender}:${device_id}` `` for state memberships
  ([`24929be` `CallMembership.ts` L92-103](https://github.com/matrix-org/matrix-js-sdk/blob/24929be0e741be6a5d0a7226f1c682e245263b8a/src/matrixrtc/CallMembership.ts#L92-L103),
  [`rtc.ts` L162-168](https://github.com/matrix-org/matrix-js-sdk/blob/24929be0e741be6a5d0a7226f1c682e245263b8a/src/matrixrtc/membershipData/rtc.ts#L162-L168);
  identical in [v43.0.0](https://github.com/matrix-org/matrix-js-sdk/blob/v43.0.0/src/matrixrtc/CallMembership.ts#L106-L117)
  and [`fa4772a`](https://github.com/matrix-org/matrix-js-sdk/blob/fa4772a4ddd335a5a8bfbf8bb21df49b70f7a999/src/matrixrtc/CallMembership.ts#L106-L117)).
  Element Call matches `p.identity == membership.rtcBackendIdentity`
  ([EC `MatrixLivekitMembers.ts` L115](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/state/CallViewModel/remoteMembers/MatrixLivekitMembers.ts#L115)).
- In flight: `backendIdentities` = `[H([sender, memberId])]` if any LiveKit transport has `url`, plus
  `${sender}:${deviceId}` if any has `livekit_service_url`
  ([`develop` `CallMembership.ts` L142-159](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/CallMembership.ts#L142-L159),
  [`rtc.ts` L148-154](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/membershipData/rtc.ts#L148-L154)).
  EC PR #4331 matches `membership.backendIdentities.includes(p.identity)`. A publisher with a `livekit_service_url`
  transport fetches its token from the legacy `/sfu/get` precisely to get the `@user:device` identity
  ([PR #4331 `src/livekit/auth/openID.ts` L87-100](https://github.com/element-hq/element-call/blob/ddfcde4a0df009577f4b51232aac6ab116efee4a/src/livekit/auth/openID.ts#L87-L100)).
  The 3-tuple hash disappears in that generation.
- MSC4195: `Base64(SHA256(Canonicalize([sender, member.id])))`
  ([L160-182](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L160-L182)).

What this means for Rocket.Chat:

- **compatibility**: publish `{ "type": "livekit", "livekit_service_url": "<https base>" }` and mint
  `@user:server:DEVICE` (`membershipID`). This works for every generation.
- **matrix_2_0**: no single identity satisfies Released/Main and In flight together. For deployed Element Call,
  publish `livekit_service_url` only and mint `H([user_id, device_id, member_id])`. For the MSC and In flight, publish
  `url` and mint `H([user_id, member_id])`. Rocket.Chat↔Rocket.Chat can use either. Keep the derivation selectable.

### 4.2 LiveKit room name

The room name is the issuer's choice; clients read it from the JWT's `video.room`
([EC `openIDSFU.ts` L172-185](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/livekit/openIDSFU.ts#L172-L185)).
The MSC's only rules ([L114-158](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L114-L158)):

- One LiveKit room per slot per SFU.
- All members of a slot in the same LiveKit room.
- The name must be pseudonymous.
- The name may be salted and rotated between sessions.

lk-jwt-service uses `H([room_id, slot_id])` for every endpoint. Legacy `/sfu/get` hard-codes `slot_id = "m.call#ROOM"`,
and Element Call always sends `"m.call#ROOM"`
([`helper.rs` L198-235](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/helper.rs#L198-L235),
[`handler.rs` L863-935](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/handler.rs#L863-L935)).
Every token Rocket.Chat issues for its SFU, to local publishers and to remote subscribers through any endpoint, must
name the same room.

Caution: Element Call decodes the JWT payload with `JSON.parse(global.atob(payloadStr))`. `atob` rejects the
base64url characters `-` and `_`. ASCII payloads containing `>`, `?` or `~` can produce them, so keep the claims
plain ([L177](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/livekit/openIDSFU.ts#L177)).

### 4.3 Test vectors

Verified here with Python (`json.dumps(…, separators=(",",":"), ensure_ascii=False)` + SHA-256 + `base64`, `=`
stripped). The first three match [MSC4195 appendix L851-855](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L851-L855).
The 3-tuple vector matches [lk-jwt-service `helper.rs` L1519-1528](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/helper.rs#L1519-L1528).

| Purpose | Canonical JSON input | SHA-256 (hex) | Unpadded base64 |
| --- | --- | --- | --- |
| Room name (MSC vector) | `["!roomid:example.com","slot1234"]` | `3bce37ed6dfe8e6ccc563a083f7b4dc1b9be5f11d093688aa4e03b6aac37a927` | `O8437W3+jmzMVjoIP3tNwbm+XxHQk2iKpOA7aqw3qSc` |
| Room name, salted (MSC vector) | `["!roomid:example.com","slot123","random123"]` | `20c78377e2b7308a894c8db4117048adea4a92184e46f7f7abc7f1deb96b8539` | `IMeDd+K3MIqJTI20EXBIrepKkhhORvf3q8fx3rlrhTk` |
| Identity, 2-tuple (MSC vector) | `["@alice:example.com","memberABC"]` | `337567b0b5eb91bc480c83573bae2ef0f6731720fd6581624142d1d9db21598b` | `M3VnsLXrkbxIDINXO64u8PZzFyD9ZYFiQULR2dshWYs` |
| Identity, 3-tuple (Released) | `["@alice:example.com","DEVICE123","memberABC"]` | `27e4f8e6d1abbb173e1eb50ea89265c90495df79bbdbc0a67b8fafb7cfd25ab5` | `J+T45tGruxc+HrUOqJJlyQSV33m728Cme4+vt8/SWrU` |
| Room name, real slot | `["!roomid:example.com","m.call#ROOM"]` | `178a0ea6b28506ae891eacb6a98a6ae94410991ee10afc64410a14addd3e49b2` | `F4oOprKFBq6JHqy2qYpq6UQQmR7hCvxkQQoUrd0+SbI` |
| Identity, 2-tuple, UUID member | `["@alice:example.com","2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10"]` | `1da46caf9ad8f73e7628831dc6b9cf3847803c8b7a1c85201d3de3337d9c48f5` | `HaRsr5rY9z52KIMdxrnPOEeAPIt6HIUgHT3jM32cSPU` |
| Identity, 3-tuple, UUID member | `["@alice:example.com","DEVICE123","2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10"]` | `beed9c35f8342662c514c837755a2ff5e8e2949fe45aaff8d33d91b88a4d4d32` | `vu2cNfg0JmLFFMg3dVov9ejilJ/kWq/40z2RuIpNTTI` |
| Identity, 2-tuple over compat `membershipID` | `["@alice:example.com","@alice:example.com:DEVICE123"]` | `4771ab687d7364b7aac2974038fe1caf62e61fcd1720c0a861c63c5e2f79c332` | `R3GraH1zZLeqwpdAOP4cr2LmH80XIMCoYcY8Xi95wzI` |
| Identity, compat (not hashed) | | | `@alice:example.com:DEVICE123` |

## 5. Token issuance

There are three token paths. Released Element Call uses **only the legacy ones**: it calls the JWT service named by
`livekit_service_url` directly with an OpenID token, and never calls the homeserver.

### 5.1 MSC4195 Client-Server endpoint (homeserver-issued)

`POST /_matrix/client/unstable/io.element.msc4195/rtc/livekit/get_token` (stable `/_matrix/client/v1/rtc/livekit/get_token`),
authenticated with the user's access token
([MSC L191-321](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L191-L321), [unstable names L823-833](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L823-L833)).

Body per the MSC and lk-jwt-service `main` (`GetTokenCsRequest`, [`requests.rs` L90-103](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/requests.rs#L90-L103)):

```json
{
  "server_name": "example.com",
  "url": "wss://livekit.example.com",
  "room_id": "!tDLCaLXijNtYcJZEey:example.com",
  "slot_id": "m.call#ROOM",
  "member_id": "2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10"
}
```

Response: `{ "jwt": "<token>" }`. There is no `url`: the client already knows it from the transport.

The body differs across implementations:

| Implementation | Member field |
| --- | --- |
| MSC4195, lk-jwt-service `main` (since [#241](https://github.com/element-hq/lk-jwt-service/commit/ccd0c3f7c64e), 2026-09-30) | `"member_id": "<id>"` |
| lk-jwt-service v0.7.0 (latest release) | `"member": { "id": "<id>", "claimed_device_id": "<dev>" }`; identity is the 3-tuple ([v0.7.0 `requests.rs` L106-117](https://github.com/element-hq/lk-jwt-service/blob/v0.7.0/src/requests.rs#L106-L117), [`helper.rs` L218-222](https://github.com/element-hq/lk-jwt-service/blob/v0.7.0/src/helper.rs#L218-L222)) |
| js-sdk `develop` `_unstable_getLivekitToken` | `member: { id, claimed_device_id? }` ([`LivekitTransport.ts` L120-147](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/LivekitTransport.ts#L120-L147)); switching to `member_id` in open PR [#5588](https://github.com/matrix-org/matrix-js-sdk/pull/5588) |
| Element Call | Does not call it yet. PR #4331 will, with `member_id` ([`csApi.ts`](https://github.com/element-hq/element-call/blob/ddfcde4a0df009577f4b51232aac6ab116efee4a/src/livekit/auth/csApi.ts)). |

Server rules, in the MSC and in lk-jwt-service `main`
([`process_get_token_cs_request` L1015-1116](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/handler.rs#L1015-L1116)):

| Check | Error |
| --- | --- |
| `url`, `room_id`, `slot_id` or `member_id` missing (lk-jwt-service) | 400 `M_BAD_JSON` |
| Requesting user not joined to `room_id` | 403 `M_FORBIDDEN` |
| `server_name` is local (or omitted) and `url` is not this server's SFU | 400 `M_INVALID_PARAM` |
| `server_name` is remote and that server is not joined to the room | 403 `M_FORBIDDEN` |
| Remote server answered 403 `M_FORBIDDEN` or 400 `M_INVALID_PARAM` | relayed as-is |
| Any other remote failure | 502 `M_UNKNOWN` |
| Membership check impossible (lk-jwt-service) | 502 `M_UNKNOWN` |
| LiveKit room creation or token minting failed (lk-jwt-service) | 500 `M_UNKNOWN` |

When `server_name` is local, the server derives the room name and identity (2-tuple in `main`), **creates the
LiveKit room** and mints a token with publish rights. When it is remote, the server relays the request (§5.2).

### 5.2 MSC4195 Server-Server endpoint

`POST /_matrix/federation/unstable/io.element.msc4195/rtc/livekit/get_token` (stable `/_matrix/federation/v1/rtc/livekit/get_token`),
an ordinary federation request signed with `Authorization: X-Matrix origin=…,destination=…,key=…,sig=…`
([`helper.rs` L27-28](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/helper.rs#L27-L28)).
In the Element stack, Synapse checks the X-Matrix signature and proxies the request to lk-jwt-service with
`X-Matrix-Origin: <origin>` ([Synapse `federation/transport/server/appservice_proxy.py` L62-78, L95-117](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/federation/transport/server/appservice_proxy.py#L62-L117),
MSC4512, `experimental_features.msc4512_enabled`). Outbound, lk-jwt-service asks its homeserver to sign and send
the request through `POST /_matrix/client/unstable/io.element.msc4512/appservice/fed_proxy`
([`helper.rs` L1071-1167](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/helper.rs#L1071-L1167)).

Body: the C-S body without `server_name`, plus the required `user_id`
([MSC L275-294](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L275-L294); `GetTokenSsRequest`, [`requests.rs` L111-124](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/requests.rs#L111-L124)):

```json
{
  "user_id": "@alice:alice.example",
  "url": "wss://livekit.bob.example",
  "room_id": "!tDLCaLXijNtYcJZEey:example.com",
  "slot_id": "m.call#ROOM",
  "member_id": "2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10"
}
```

lk-jwt-service v0.7.0 sends `member: {…}` instead of `member_id`. Response: `{ "jwt": "<token>" }`.

Rules ([MSC L296-311](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L296-L311); [`process_get_token_ss_request` L1119-1187](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/handler.rs#L1119-L1187)):

| Check | Error |
| --- | --- |
| A required field is missing | 400 `M_BAD_JSON` |
| `user_id` malformed | 400 `M_INVALID_PARAM` |
| `user_id`'s server ≠ X-Matrix `origin` | 403 `M_FORBIDDEN` |
| This server not joined to `room_id` | 403 `M_FORBIDDEN` |
| `user_id` not joined to `room_id` | 403 `M_FORBIDDEN` |
| `url` is not one of this server's SFUs | 400 `M_INVALID_PARAM` |

On success the server creates the LiveKit room and mints a token with `canPublish: false`, identity
`H([user_id, member_id])`, room `H([room_id, slot_id])`.

### 5.3 Grants

lk-jwt-service `get_join_token` ([`handler.rs` L50-77](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/handler.rs#L50-L77)) against the MSC ([L378-426](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L378-L426)):

| Claim | MSC4195 | lk-jwt-service |
| --- | --- | --- |
| `sub` | participant identity | identity |
| `nbf` / `exp` | now / short | now / now + 1 h |
| `video.room` | room name | `H([room_id, slot_id])` |
| `video.roomJoin` | MUST `true` | `true` |
| `video.roomCreate` | MUST `false` | `false` |
| `video.canPublish` | `true` only for local users | `true` for C-S local and for legacy full-access servers; `false` for S-S and restricted users |
| `video.canSubscribe` | MUST `true` | `true` |
| `video.canUpdateOwnMetadata` | SHOULD `false` | `true` |
| `video.hidden` | **MUST `false`**, so nobody lurks undetected | `false` |

The homeserver (or its service) pre-creates the LiveKit room. lk-jwt-service uses `empty_timeout` 300 s,
`departure_timeout` 20 s and `max_participants` 0 ([`helper.rs` L679-731](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/helper.rs#L679-L731)).
The SFU should run with `room.auto_create: false`.

### 5.4 Legacy OpenID flow (what deployed Element Call uses)

Element Call takes the base URL from the member's transport `livekit_service_url` and POSTs JSON there, from the
browser, cross-origin ([EC `openIDSFU.ts` L93-170, L189-320](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/livekit/openIDSFU.ts#L93-L170)):

| Connection | Mode | Endpoints tried |
| --- | --- | --- |
| Own SFU (publish) | `compatibility` | `/sfu/get` only |
| Own SFU (publish) | `matrix_2_0` | `/get_token` only; failure is fatal (`NoMatrix2AuthorizationService`) |
| Another member's SFU (subscribe) | any | `/get_token` first, then `/sfu/get` on **any** error ([L118-150](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/livekit/openIDSFU.ts#L118-L150)) |

`POST {livekit_service_url}/sfu/get`:

```json
{
  "room": "!abc:example.com",
  "openid_token": {
    "access_token": "SomeT0kenHere",
    "token_type": "Bearer",
    "matrix_server_name": "example.com",
    "expires_in": 3600
  },
  "device_id": "ABCDEFGHIJ",
  "delay_id": "optional",
  "delay_timeout": 3600000,
  "delay_cs_api_url": "https://matrix.example.com"
}
```

`POST {livekit_service_url}/get_token`:

```json
{
  "room_id": "!abc:example.com",
  "slot_id": "m.call#ROOM",
  "openid_token": { "access_token": "…", "token_type": "Bearer", "matrix_server_name": "example.com", "expires_in": 3600 },
  "member": {
    "id": "2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10",
    "claimed_user_id": "@alice:example.com",
    "claimed_device_id": "ABCDEFGHIJ"
  },
  "delay_id": "optional",
  "delay_timeout": 3600000,
  "delay_cs_api_url": "https://matrix.example.com"
}
```

Both return `200 { "url": "wss://livekit.example.com", "jwt": "<token>" }`. The `delay_*` fields are all or none; a
partial set is 400 `M_BAD_JSON`.

In compat mode `member.id` is `"@alice:example.com:ABCDEFGHIJ"`. For subscribe-only connections, Element Call sends
its own membership identity.

lk-jwt-service behaviour ([`process_legacy_sfu_request` L863-935, `process_sfu_request` L937-1012](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/handler.rs#L863-L1012); validation [`requests.rs` L309-400](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/requests.rs#L309-L400)):

| Aspect | `/sfu/get` | `/get_token` |
| --- | --- | --- |
| Identity | `"${sub}:${device_id}"` | `H([sub, member.claimed_device_id, member.id])` |
| Room | `H([room, "m.call#ROOM"])` | `H([room_id, slot_id])` |
| Validation | `room`, `openid_token.access_token`, `openid_token.matrix_server_name` | `room_id`, `slot_id`, all three `member.*`, `openid_token.*` |

Common to both endpoints:

- `sub` comes from the OpenID check. `/get_token` also requires `member.claimed_user_id == sub`; otherwise 401
  `M_UNAUTHORIZED`.
- `canPublish`, and LiveKit room creation, only when `openid_token.matrix_server_name` is in
  `LIVEKIT_FULL_ACCESS_HOMESERVERS`. Everyone else gets a subscribe-only token and needs an existing room.
- **No room-membership check** on these legacy endpoints.
- CORS: every response carries `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST` and
  `Access-Control-Allow-Headers: Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token`. `OPTIONS`
  returns 200 ([L1376-1422](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/handler.rs#L1376-L1422)).
- A body that is not JSON returns 400 `M_NOT_JSON`; an OpenID failure returns 401 `M_UNAUTHORIZED`.

Element Call also POSTs an empty body to `{livekit_service_url}/delegate_delayed_leave` on its **own** transport, and
treats a 404 as "no delegation"
([`LocalMember.ts` L272-320](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/state/CallViewModel/localMember/LocalMember.ts#L272-L320)).

### 5.5 OpenID contract

- Issuing, C-S: `POST /_matrix/client/v3/user/{userId}/openid/request_token`, body `{}`. Response
  ([spec `openid_token.yaml`](https://github.com/matrix-org/matrix-spec/blob/c6a54df511489a9e7f7880b4d55a36ae67405400/data/api/client-server/definitions/openid_token.yaml)):

  ```json
  { "access_token": "SomeT0kenHere", "token_type": "Bearer", "matrix_server_name": "example.com", "expires_in": 3600 }
  ```

- Validating, S-S, **unauthenticated** (no X-Matrix):
  `GET /_matrix/federation/v1/openid/userinfo?access_token=SomeT0kenHere` → `200 { "sub": "@alice:example.com" }`,
  or `401 { "errcode": "M_UNKNOWN_TOKEN", "error": "…" }`. The caller MUST check that `sub` is on the server it asked
  ([spec `server-server/openid.yaml`](https://github.com/matrix-org/matrix-spec/blob/c6a54df511489a9e7f7880b4d55a36ae67405400/data/api/server-server/openid.yaml)).
  lk-jwt-service does not perform that check
  ([`verify_openid_token` L675-701](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/handler.rs#L675-L701)).
- How lk-jwt-service locates `matrix_server_name`'s federation API
  ([`helper.rs` L1240-1298](https://github.com/element-hq/lk-jwt-service/blob/33e385153bfb9caa1d9cc86a92bed3ec7c610adf/src/helper.rs#L1240-L1298)):
  an explicit port is used verbatim; otherwise `GET https://{server_name}/.well-known/matrix/server` and its `m.server`
  (default port 8448); otherwise `https://{server_name}:8448`. **No SRV lookup.** Rocket.Chat's federation must be
  reachable this way for its users to subscribe to Element SFUs.

### 5.6 Transport discovery (C-S, for reference)

`GET /_matrix/client/unstable/org.matrix.msc4143/rtc/transports` →
`{ "rtc_transports": [ { "type": "livekit", "livekit_service_url": "https://…" } ] }`. Synapse serves it from
`matrix_rtc.transports` when `msc4143_enabled` is on
([Synapse `rest/client/matrixrtc.py` L30-44](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/synapse/rest/client/matrixrtc.py#L30-L44);
[EC `docs/self_hosting.md` L72-80](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/docs/self_hosting.md#L72-L80)).
Element Call takes the first entry with `livekit_service_url`, else its config `livekit.livekit_service_url`. Neither
Released nor Main reads `.well-known` `org.matrix.msc4143.rtc_foci`
([`RtcTransportAutoDiscovery.ts` L44-102](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/state/CallViewModel/localMember/RtcTransportAutoDiscovery.ts#L44-L102)).

## 6. Ringing and declining (MSC4075, MSC4310)

### 6.1 Notification event

Type `org.matrix.msc4075.rtc.notification` (stable `m.rtc.invite`). It is sent as a **sticky** event with
`duration_ms = lifetime + 20000` (110 000 by default) when the homeserver advertises `org.matrix.msc4354`, and as a
plain timeline event otherwise. The mode does not matter
([`MatrixRTCSession.ts` L757-813](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSession.ts#L757-L813)):

```json
{
  "slot_id": "m.call#ROOM",
  "m.mentions": { "user_ids": [], "room": true },
  "notification_type": "ring",
  "m.relates_to": { "rel_type": "m.reference", "event_id": "$own_membership_event_id" },
  "sender_ts": 1791374400000,
  "lifetime": 90000,
  "msc4354_sticky_key": "m.call#ROOM",
  "m.call.intent": "video"
}
```

- `m.relates_to.event_id` is the sender's **own membership event**: the sticky `rtc.member` join in `matrix_2_0`, or
  the `call.member` state event in compat.
- `m.call.intent` is present only when the caller's membership has one.
- When it is sent: only by the first member. The join config must carry `notificationType`, and
  `oldMemberships.length === 0` must hold when the own membership appears
  ([L900-925](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/MatrixRTCSession.ts#L900-L925)).
- Ring vs notification: Element Call starts a DM call (`start_call_dm`, `start_call_dm_voice`) with `"ring"`, and
  `waitForCallPickup` / `autoLeaveWhenOthersLeft` on. Everything else defaults to `"notification"`; the plain
  (non-widget) app sends none ([`UrlConfiguration.ts` L170-242](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/UrlConfiguration.ts#L170-L242)).
  The caller gives up on `lifetime` timeout, on a decline from the recipient, or when the recipient joins
  ([`CallNotificationLifecycle.ts`](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/state/CallViewModel/CallNotificationLifecycle.ts)).

**Receiver (Element Web `develop`)** ([`Notifier.ts` L653-725](https://github.com/element-hq/element-web/blob/4d1993cc38ef6f96257bbe693863d56f1bd65b61/apps/web/src/Notifier.ts#L653-L725), [`IncomingCallToast.tsx` L75-86, L178, L304](https://github.com/element-hq/element-web/blob/4d1993cc38ef6f96257bbe693863d56f1bd65b61/apps/web/src/toasts/IncomingCallToast.tsx#L75-L86)):

1. Push rules must yield `notify`.
2. It is skipped if the user is already in the session.
3. It needs `now − sendTs ≤ lifetime`, where `sendTs = sender_ts`, or `origin_server_ts` if they differ by 15 s or
   more.
4. It needs `m.relates_to.rel_type == "m.reference"` and the referenced membership event, fetched from the server if
   necessary. Without it, no toast.
5. It rings (sound) only when `notification_type == "ring"`.

It does **not** check `m.mentions` itself, nor the slot.

js-sdk's `parseCallNotificationContent` implements the full MSC4075 rules, including an **open slot**, but Element
Web does not use it yet ([`types.ts` L266-380](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/types.ts#L266-L380)).

**Push rules** (Synapse, with `experimental_features.msc4075_enabled`): `.org.matrix.msc4075.rule.rtc.invite_for_me`
(the type, plus the user in `content.m\.mentions.user_ids`) and `.org.matrix.msc4075.rule.rtc.invite_for_room` (the
type, plus `m.mentions.room == true`, plus the sender having `notifications.room` power, 50 by default). Both rules
do `notify` with sound `ring` ([`rust/src/push/base_rules.rs` L148-186](https://github.com/element-hq/synapse/blob/2392446370a5f708a5290bb69c5f9ebc37298d41/rust/src/push/base_rules.rs#L148-L186)).
Without the flag, the generic `.m.rule.is_user_mention` and `.m.rule.is_room_mention` apply. A Rocket.Chat caller
without `notifications.room` power is therefore only heard through `user_ids`. For a federated DM, mention the callee
in `user_ids`.

**Spec vs reference implementation** ([MSC4075 L24-52, L119-142, L478-512](https://github.com/matrix-org/matrix-spec-proposals/blob/4d0bdea29b47509238ec5c19852487de93d40647/proposals/4075-rtc-notification-event.md#L478-L512)):

| MSC4075 | On the wire |
| --- | --- |
| type `m.rtc.invite` | `org.matrix.msc4075.rtc.notification` |
| required: `slot_id`, `sender_ts`, `lifetime` (≤ 2 min, 90 s recommended), `m.mentions`, `sticky_key` = `slot_id` | the same, with `msc4354_sticky_key` |
| no `notification_type`, no `m.call.intent`, no relation | all three still sent, and Element Web **requires** the `m.reference` relation |
| valid only with an open `m.rtc.slot` | not enforced by Element Web |
| withdraw = same sticky key, empty content | js-sdk treats a content holding only `msc4354_sticky_key` as withdrawn |

Older form, `org.matrix.msc4075.call.notify` with `{ application, "m.mentions", notify_type: "ring"|"notify", call_id }`:
the type is still declared in js-sdk as deprecated
([`types.ts` L92-104](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/types.ts#L92-L104)).
Nothing in Element Call `main`, Element Web's `Notifier.ts` or js-sdk's session code sends or reads it. Do not send it.

### 6.2 Decline

Type `org.matrix.msc4310.rtc.decline` (stable `m.rtc.decline`, now part of MSC4075). Sticky, `duration_ms = 120000`,
falling back to a plain event without sticky support
([js-sdk `client.ts` L3992-4007](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/client.ts#L3992-L4007)):

```json
{
  "m.relates_to": { "rel_type": "m.reference", "event_id": "$notification_event_id" },
  "msc4354_sticky_key": "$notification_event_id"
}
```

Element Call (the caller) watches **timeline** events of this type whose relation targets its notification and whose
sender is the DM peer ([`CallNotificationLifecycle.ts` L71-80, L148-157](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/state/CallViewModel/CallNotificationLifecycle.ts#L71-L80)).
The original MSC4310 had only `m.relates_to` plus an optional reason
([MSC4310](https://github.com/matrix-org/matrix-spec-proposals/blob/67687dc381f56c626edf6e00a2bd2c5e2d04e56b/proposals/4310-matrixRTC-call-decline.md)).

## 7. E2EE key distribution (brief)

- In an unencrypted room, Element Call runs **unencrypted**. It picks `PER_PARTICIPANT` only when
  `room.hasEncryptionStateEvent()`, otherwise `NONE` (a password in the URL selects `SHARED_KEY`)
  ([`sharedKeyManagement.ts` L103-115](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/e2ee/sharedKeyManagement.ts#L103-L115)).
  MSC4143 forbids MatrixRTC encryption in unencrypted rooms and requires it in encrypted ones
  ([L569-589](https://github.com/matrix-org/matrix-spec-proposals/blob/ed8d4dfa9f44eb3bb789018d7c2d76731f09ee2d/proposals/4143-matrix-rtc.md#L569-L589)).
- In encrypted rooms the keys are Olm-encrypted to-device messages of type `io.element.call.encryption_keys` (stable
  `m.rtc.encryption_key`), sent to each joined member's device
  ([`ToDeviceKeyTransport.ts` L69-102](https://github.com/matrix-org/matrix-js-sdk/blob/2a70f5130c469020e2ff5e64ea2e8a221fd3a448/src/matrixrtc/ToDeviceKeyTransport.ts#L69-L102)).
  The plaintext is:

  ```json
  {
    "keys": { "index": 0, "key": "<unpadded base64, 16 bytes>" },
    "room_id": "!abc:example.com",
    "member": { "id": "<member id>", "claimed_device_id": "ABCDEFGHIJ" },
    "session": { "call_id": "", "application": "m.call", "scope": "m.room" },
    "sent_ts": 1791374400000
  }
  ```

  MSC4143 would have `{ room_id, member_id, media_key: { index, key } }`. Index range 0–255, key length 16 bytes in
  the implementation, 32 bytes in the MSC. LiveKit consumes the key via HKDF, keyring 256, ratchet salt
  `LKFrameEncryptionKey`
  ([MSC4143 L460-497, L791-800](https://github.com/matrix-org/matrix-spec-proposals/blob/ed8d4dfa9f44eb3bb789018d7c2d76731f09ee2d/proposals/4143-matrix-rtc.md#L791-L800);
  [MSC4195 L586-617, L864-865](https://github.com/hughns/matrix-spec-proposals/blob/357dcfa8ac73263b85736e79c46d4ad07cb312c7/proposals/4195-matrixrtc-livekit.md#L586-L617);
  [EC `matrixKeyProvider.ts`](https://github.com/element-hq/element-call/blob/1f07f949b574ce0da7c07252ca2cc9eb80e13b1b/src/e2ee/matrixKeyProvider.ts)).
- In an encrypted room the `matrix_2_0` sticky membership, the notification and the decline are themselves
  Megolm-encrypted (`m.room.encrypted` with a top-level `msc4354_sticky`). A server without room keys cannot read
  them. Compat state events are never encrypted.

## 8. Power levels

Element Web creates rooms with `power_level_content_override.events` set to the Synapse defaults plus
`"org.matrix.msc3401.call.member": 0`. It does this for every room unless `element_call.disable` is set. For video
rooms it also adds `"im.vector.modular.widgets": 100`
([`createRoom.ts` L88-107, L181-206](https://github.com/element-hq/element-web/blob/4d1993cc38ef6f96257bbe693863d56f1bd65b61/apps/web/src/createRoom.ts#L181-L206)):

```json
{
  "events": {
    "m.room.avatar": 50,
    "m.room.canonical_alias": 50,
    "m.room.encryption": 100,
    "m.room.history_visibility": 100,
    "m.room.name": 50,
    "m.room.power_levels": 100,
    "m.room.server_acl": 100,
    "m.room.tombstone": 100,
    "org.matrix.msc3401.call.member": 0
  }
}
```

- `org.matrix.msc4143.rtc.member`, `org.matrix.msc4075.rtc.notification` and `org.matrix.msc4310.rtc.decline` are
  message events, so they need only `events_default` (0 by default). Element sets nothing for them.
- `org.matrix.msc4143.rtc.slot` is a state event at `state_default` (50), so only moderators can open or close slots.
  Element sets nothing for it.
- The room-mention ring path needs `notifications.room` (default 50) for the sender.
- Rooms created by Rocket.Chat that Element users should call from in compat mode need
  `"org.matrix.msc3401.call.member": 0`. Otherwise ordinary members cannot send the state event.

## Open questions / unverified

1. **Element Web beyond the files read.** Only `createRoom.ts`, `models/Call.ts`, `Notifier.ts` and
   `IncomingCallToast.tsx` were read for "no `rtc.slot` is sent" and "`call.notify` is not read". GitHub code search
   was unavailable without authentication.
2. **Element X / matrix-rust-sdk** were not examined. Their sticky/`rtc.member` handling, their identity derivation
   and whether they require an open `rtc.slot` for rings are unknown.
3. **When the In-flight generation ships.** js-sdk #5587 is merged but unreleased; js-sdk #5588 and Element Call
   #4331 are open. Once they ship, deployed Element Call drops the 3-tuple hash. Watch these before freezing the
   `matrix_2_0` identity.
4. **Sticky catch-up to newly joined servers.** Missing in Synapse. Whether a Synapse sends unexpired sticky events
   when Rocket.Chat backfills (`/backfill`, `/get_missing_events`) was not tested. The MSC exempts sticky events from
   history visibility, but Synapse's federation filtering for them was not traced.
5. **Synapse with `msc4354_enabled` off** receiving a sticky PDU from Rocket.Chat: it should accept it as a normal
   event, since unknown top-level keys are preserved. Not traced; js-sdk then sees no stickiness, so the membership is
   invisible to `matrix_2_0` readers.
6. **LiveKit Rust SDK claim set.** The exact JWT claims emitted by `AccessToken::to_jwt()` (for example whether
   `name` or `jti` are added) were not checked. Element reads only `video.room` and `sub`.
7. **Synapse PDU field set for room v11+.** Whether Synapse still emits `origin` or `unsigned.age_ts` on outgoing
   PDUs was not checked. The §1.7 example omits both; both are ignored by v11+ redaction and auth.
8. **`video.hidden`.** MSC4195 says it MUST be `false`; lk-jwt-service complies. Element Call's behaviour towards
   hidden remote subscribers was not checked.
9. **Lowercase `m.call#room`** (MSC4143 text) against upper-case `m.call#ROOM` (every implementation). Assumed to stay
   `ROOM` until the MSC lands.
