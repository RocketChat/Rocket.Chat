# Intent: Proven interoperability and Bifrost retirement

Author: Diego Sampaio. Status: accepted.

## Problem

The end-to-end suite runs against ejabberd set up by hand, and against Openfire 5.1 in its
default configuration through the compose stack (`yarn test:e2e:stack`,
[operations.md](../operations.md#running-the-end-to-end-suite)). Prosody, ejabberd in
compose, a hardened S2S profile and per-peer results are not covered, so running the suite
against any other peer still means building that environment from scratch. Meanwhile the
Matrix-bridge XMPP integration (Bifrost, `Federation_XMPP_*`) is still the documented
alternative ([compliance.md](../compliance.md), XEP-0114) although the project decided it
is not the production path and will be decommissioned.

## Proposed outcome

- One command brings up Rocket.Chat, the XMPP server service and a chosen peer (Prosody,
  Openfire or ejabberd) from a compose file, already configured to federate with each other,
  and runs the end-to-end suite against that peer.
- Every implemented requirement in [specs/](../specs/) is proven against Openfire first,
  then Prosody and ejabberd, this way, with the results recorded per peer and per
  requirement. A requirement that fails against a peer becomes a `D` entry.
- The Bifrost XMPP path is retired and native federation becomes the only XMPP offering,
  with a migration note for administrators who use Bifrost.

## Affected users and systems

- Engineers running the suite; administrators federating with those servers; Rocket.Chat
  users of the Bifrost path.
- `tests/end-to-end/` and [operations.md](../operations.md#running-the-end-to-end-suite);
  every spec, through new `D` entries; [compliance.md](../compliance.md) (the XEP-0114 note
  refers to the bridge, and an Interop section links the per-peer results).
- The Matrix federation appservice and its `Federation_XMPP_*` settings, outside this package.

## Constraints

- The compose setup runs on a developer's machine; it is not part of CI.
- The suite keeps working against servers it did not set up, as it does today.
- Openfire, the server the one named prospect runs and the load-test reference in
  [scale-and-availability](scale-and-availability.md), is proven at the latest release of
  its current stable line (5.1 today). Prosody and ejabberd follow at the latest release of
  theirs (13.0 and 26.x today). A version a customer or partner reports running is added to
  the list. Prosody 0.12, out of support since June 2026, is not tested.
- Each peer is exercised in its default S2S configuration and in its hardened one (verified
  certificates required, as Prosody's `s2s_secure_auth`).
- Proprietary servers (Isode M-Link, MindLink, and JChat, which cannot be freely obtained to
  test against) are out of scope for this phase. JChat is checked later through a partner.
- Results live in this package as `docs/interop/<peer>.md`, one file per peer, linked from
  [compliance.md](../compliance.md) with the version and date last proven. Each records the
  peer version with its image digest, the S2S profile, the Rocket.Chat commit, the date and
  who ran it, and one row per requirement (test, result, the `D` entry for a failure),
  generated from the test reporter output rather than typed by hand.
- Inside the compose setup each container gets network aliases for its domain and its
  `conference.` subdomain, and there are no SRV records: both sides fall back to A records
  on port 5269. An init container generates a private CA per run and issues the
  certificates every service trusts; no certificate or key is committed.

## Open questions

- **Q1** ~~Which versions of Prosody, Openfire and ejabberd?~~ The latest stable release
  of each, Openfire first: see Constraints.
- **Q2** ~~Where are the per-peer results kept: a column per peer in
  [compliance.md](../compliance.md), or a separate interop report?~~ One file per peer:
  see Constraints.
- **Q3** ~~How are certificates and name resolution provided inside the compose setup: a
  generated private CA, `XMPP_DNS_OVERRIDES`, or the compose network's DNS?~~ Network
  aliases and a private CA per run: see Constraints.
- **Q4** ~~What does Bifrost cover that native federation does not yet, and is that a
  blocker for retiring it?~~ Nothing that blocks retiring it: see Proposed outcome.
- **Q5** ~~Does JChat, which is in the estate but not in scope, count as
  proprietary?~~ Yes: see Constraints.
