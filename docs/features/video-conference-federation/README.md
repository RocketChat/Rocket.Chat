# Video conferences in federated rooms (MatrixRTC)

> **Status: proof of concept.** Rocket.Chat ↔ Rocket.Chat first; the wire formats are the ones Element Call,
> matrix-js-sdk, Synapse and lk-jwt-service use, so other Matrix servers and clients can join later. The exact
> event and endpoint formats are in [protocol.md](protocol.md).

A LiveKit call in a federated room is one **MatrixRTC session** shared by every homeserver in the room. Rocket.Chat
is a homeserver: it announces in the room, on behalf of its users, who is in the call, and reads the same
announcements from other servers. Rocket.Chat users never speak the Matrix client-server API; the server does it
for them.

## Media: one SFU per homeserver

Every member publishes on **their own homeserver's SFU** and watches the members of other homeservers on theirs
(Element Call's "multi-SFU"):

```
 rc1 users ──publish──▶ livekit1 ◀──subscribe── rc2 users
 rc2 users ──publish──▶ livekit2 ◀──subscribe── rc1 users
```

- Nothing relays media between servers. A Rocket.Chat client opens one LiveKit connection to its own server's SFU
  (publish and subscribe) and one subscribe-only connection per other SFU that has members in the call.
- On every SFU the session uses the same LiveKit room, `liveKitRoomAliasFor(matrixRoomId, slotId)`
  (`src/matrixrtc/derive.ts` in `@rocket.chat/federation-matrix`). The slot is `m.call#ROOM`: one call per room.
- A member publishes under a **LiveKit identity derived from their membership**, which is how every client maps a
  track to a member. A non-federated call keeps `mc-<callId>` and identity `user._id`.

## Signalling: memberships in the Matrix room

Two forms, chosen by `Federation_Service_MatrixRTC_Mode` for what this server sends; both are always read:

| Mode | Membership | SFU tokens for other servers' members |
| --- | --- | --- |
| `matrix_2_0` (default) | sticky event (MSC4354), fresh `member.id` per join | homeserver to homeserver: MSC4195 federation `get_token` |
| `compatibility` | state event `org.matrix.msc3401.call.member` per device | OpenID token checked against the member's homeserver, at the lk-jwt-service-style endpoint the membership names |

Rings are `rtc.notification` events (MSC4075) and declines `rtc.decline` (MSC4310), both as timeline events.

## Data model

- **`IMatrixRTCMembership`** (`rocketchat_matrix_rtc_memberships`): one device's presence in one session, local or
  remote. It holds the member's transport (SFU address or token service), their LiveKit identity, their homeserver,
  the event that announced them and when the membership stops counting (`expiresAt`). A user is in a federated call
  while any of their memberships counts.
- **`IVideoConference.federation`** `{ mrid, slotId }`: the session a conference mirrors.
- **`IVideoConferenceUser.federation`** `{ serverName, transport, livekitIdentity, local }`: where a roster member
  publishes, taken from their latest membership. This is what a client uses to know which connection carries whose
  media.

Remote members are on the roster as the federated users that stand for them (`IUserNativeFederated`), like members
of a federated room.

## Session ↔ conference

- A conference in a federated room mirrors the room's session for as long as **any** membership, local or remote,
  counts. When the last one goes, the conference ends as any conference does when it empties.
- A membership arriving for a session with no running conference here starts one. The conference is created
  by the remote member, with the usual call message in the room.
- A call message (`t: 'videoconf'`) is not sent to Matrix. Other servers learn of the call from the memberships,
  and Matrix clients show their own call banner.
- Presence of local members still comes from their leases (heartbeat). Presence of remote members comes from their
  memberships: a leave or the membership expiring. The lease sweep leaves remote members alone.

## Outbound (this server's users)

- **Join**: the first `join` or `callConfig` for a local user creates their membership. That means a device id
  generated for the join, a fresh member id and this server's SFU as the transport. The membership is announced in
  the mode's form. Repeated calls return the same membership. (`FederationMatrix.joinRTCSession`)
- **Refresh**: while the lease is renewed, the announcement is re-sent before it expires (sticky events last at most
  an hour; compatibility memberships carry `expires`).
- **Leave**: leaving, or the lease running out, sends the leave form and removes the membership. This server plays
  the role Matrix clients give to delayed events: it knows when its user is gone.
- **Ring**: a call in a federated DM rings the remote callee with an `rtc.notification` (`ring`) that mentions them
  and relates to the caller's membership. (`FederationMatrix.notifyRTCSession`)
- **Decline**: a local user turning down a remote ring sends `rtc.decline` relating to that notification.
  (`FederationMatrix.declineRTCSession`)

## Inbound (other servers' members)

The federation SDK emits `homeserver.matrix.event` for every accepted event; the MatrixRTC handler takes the
membership, notification and decline types. A membership is upserted, the session's conference is found or
started, and the member's roster entry is joined or left. A ring that mentions local users rings them. An expired
membership counts as a leave.

## Tokens

| Who | For which SFU | How |
| --- | --- | --- |
| Local user | this server's | `video-conference.callConfig`: publish + subscribe, identity from their membership, `federation` block in the answer |
| Local user | another server's | `video-conference.federatedToken` → this server asks that server (`FederationMatrix.getRemoteLiveKitToken`): MSC4195 federation `get_token` for a Matrix 2.0 membership, or an OpenID token from this server at the membership's token service for a compatibility one |
| Remote user | this server's | MSC4195 federation `get_token` (signed by their homeserver), or OpenID at this server's lk-jwt-service-compatible endpoint, checked through `/_matrix/federation/v1/openid/userinfo` |

Tokens for members of other servers are **subscribe-only and hidden**. They watch this SFU but never appear on it
or publish on it. The member must be joined to the Matrix room. Token minting stays with the LiveKit provider
(`apps/meteor/ee/server/lib/livekit`), reached from the federation package through `IMatrixRTCLiveKitIssuer`.

## Client

- `callConfig` gives the own SFU and, for a federated call, `federation.serverName`. The roster gives every
  member's `federation` entry.
- The client opens one subscribe-only connection per `(serverName, transport)` of joined remote members, with a
  token from `video-conference.federatedToken`, and closes it when those members are gone.
- A participant is shown only when their identity matches a roster member's `livekitIdentity` on that connection.
  The name and avatar come from the roster, not from the identity.
- Hands, reactions and mute requests go over the data channel of the member's own SFU, which other servers'
  members watch.

## Settings

| Setting | Purpose |
| --- | --- |
| `Federation_Service_MatrixRTC_Enabled` | Allows calls in federated rooms. Public, so the call button can follow it. |
| `Federation_Service_MatrixRTC_Mode` | `matrix_2_0` or `compatibility`: the form this server announces memberships in. |

LiveKit must be configured as for any native call ([native-video-conference](../native-video-conference/README.md)).

## Known limitations (PoC)

- **No end-to-end encryption.** Encrypted Matrix rooms send call keys as Olm to-device messages, and Rocket.Chat
  users have no Matrix devices. Calls work only in unencrypted rooms.
- **One membership per user on the roster.** A user on two devices shows once, with the latest device's transport.
- OpenID tokens issued for remote SFUs live in memory, which suits a single instance only.
- Hands, reactions and mute requests are Rocket.Chat's own data-channel messages; Element Call does not read them.
