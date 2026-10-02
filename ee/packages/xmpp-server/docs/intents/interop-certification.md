# Intent: Proven interoperability and Bifrost retirement

Author: Diego Sampaio. Status: draft.

## Problem

The only peer the server is tested against is ejabberd. The end-to-end suite runs against
servers someone has already set up by hand, with DNS, certificates and registration
configured to match ([operations.md](../operations.md#running-the-end-to-end-suite)), so
running it against another peer means building that environment from scratch. Prosody and
Openfire, the open servers most of the target estate federates through, have never been
federated with. Meanwhile the Matrix-bridge XMPP integration (Bifrost, `Federation_XMPP_*`)
is still the documented alternative ([compliance.md](../compliance.md), XEP-0114) although
the project decided it is not the production path and will be decommissioned.

## Proposed outcome

- One command brings up Rocket.Chat, the XMPP server service and a chosen peer (Prosody,
  Openfire or ejabberd) from a compose file, already configured to federate with each other,
  and runs the end-to-end suite against that peer.
- Every implemented requirement in [specs/](../specs/) is proven against Prosody, Openfire
  and ejabberd this way, with the results recorded per peer and per requirement. A
  requirement that fails against a peer becomes a `D` entry.
- The Bifrost XMPP path is retired once native federation covers what it did, with a
  migration note for administrators who use it.

## Affected users and systems

- Engineers running the suite; administrators federating with those servers; Rocket.Chat
  users of the Bifrost path.
- `tests/end-to-end/` and [operations.md](../operations.md#running-the-end-to-end-suite);
  every spec, through new `D` entries; [compliance.md](../compliance.md) (the XEP-0114 note
  refers to the bridge).
- The Matrix federation appservice and its `Federation_XMPP_*` settings, outside this package.
- [PROJ-120](https://rocketchat.atlassian.net/wiki/spaces/RnD/pages/1307803678/PROJ-120+Native+XMPP+Server+Experience)
  §2 "Recommended Path: Native Server vs. Bridge" (Bifrost decommissioned), §4 in scope
  "Interop certification & Bifrost decommission", and §4 out of scope "Full compatibility
  with proprietary XMPP servers".

## Constraints

- The compose setup runs on a developer's machine; it is not part of CI.
- The suite keeps working against servers it did not set up, as it does today.
- Each peer is exercised in its default S2S configuration and in its hardened one (verified
  certificates required, as Prosody's `s2s_secure_auth`).
- Proprietary servers (Isode M-Link, MindLink) are out of scope for this phase.

## Open questions

- **Q1** Which versions of Prosody, Openfire and ejabberd?
- **Q2** Where are the per-peer results kept: a column per peer in
  [compliance.md](../compliance.md), or a separate interop report?
- **Q3** How are certificates and name resolution provided inside the compose setup: a
  generated private CA, `XMPP_DNS_OVERRIDES`, or the compose network's DNS?
- **Q4** What does Bifrost cover that native federation does not yet, and is that a blocker
  for retiring it?
- **Q5** Does JChat, which the page lists in the estate but not in scope, count as
  proprietary?
