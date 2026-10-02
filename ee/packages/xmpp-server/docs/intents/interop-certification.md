# Intent: Proven interoperability and Bifrost retirement

Author: Diego Sampaio. Status: draft.

## Problem

The only peer the server is tested against is ejabberd, and the end-to-end suite is run by
hand and is not in CI ([operations.md](../operations.md#running-the-end-to-end-suite)). The
servers the target estate actually runs have never been federated with: Prosody, Openfire
(the only peer the Bifrost QA used), JChat, Isode M-Link, and the boundary products that sit
in front of them (M-Link Edge, the MindLink XMPP Federation Gateway). Peers that predate
RFC 6120 (RFC 3920-era stream headers, dialback-only servers without stream features) are
in that estate too and nothing says how they are treated. Meanwhile the Matrix-bridge XMPP
integration (Bifrost, `Federation_XMPP_*`) is still the documented alternative
([compliance.md](../compliance.md), XEP-0114) although it is not the production path.

## Proposed outcome

- Every implemented requirement in [specs/](../specs/) is proven against Prosody, Openfire,
  ejabberd, Isode M-Link, M-Link Edge and the MindLink gateway (and JChat where obtainable),
  with the results recorded per peer and per requirement. A requirement that fails against
  a peer becomes a `D` entry.
- The behaviour towards RFC 3920-era peers is specified and proven.
- The end-to-end suite runs against each peer automatically.
- The Bifrost XMPP path is retired once native federation covers what it did, with a
  migration note for administrators who use it. What Bifrost did that the native server
  does not yet, per its V1 QA: join a public remote room by name
  ([joining-remote-rooms](joining-remote-rooms.md)), files and media
  ([file-transfer](../specs/file-transfer.md), draft), typing
  ([chat-states](../specs/chat-states.md), draft, DMs only), a remote room's subject
  becoming the channel topic (no spec), read state guessed from chat states (no spec).

## Affected users and systems

- Administrators federating with any of those servers; Rocket.Chat users of the Bifrost path.
- `tests/end-to-end/` and CI; every spec, through new `D` entries;
  [s2s-connectivity](../specs/s2s-connectivity.md) for legacy peers;
  [compliance.md](../compliance.md) (the XEP-0114 note refers to the bridge).
- The Matrix federation appservice and its `Federation_XMPP_*` settings, outside this package.
- PROJ-120 scope "Interop certification & Bifrost decommission".

## Constraints

- Peers are tested in their default S2S configuration and in their hardened one (verified
  certificates required, as Prosody's `s2s_secure_auth`).
- The suite keeps running against servers it does not set up itself, or gains containers
  for the ones that can be distributed; M-Link and JChat may only be available under licence.

## Open questions

- Which versions of each peer, and who provides M-Link, M-Link Edge, MindLink and JChat
  test instances?
- How do M-Link and MindLink authenticate S2S (dialback, SASL EXTERNAL, mandatory verified
  TLS), which certificate names do they expect, and which XEPs do they require of a peer?
  The market research does not say.
- Where are the per-peer results kept: a column per peer in [compliance.md](../compliance.md),
  or a separate interop report?
- Which of the Bifrost gaps above block its retirement, and which are dropped on purpose
  (read state guessed from chat states is weak)?
