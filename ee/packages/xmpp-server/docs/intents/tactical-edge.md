# Intent: Federation over constrained and disrupted links

Author: Diego Sampaio. Status: draft.

## Problem

The server assumes a stable IP network between peers. Tactical deployments federate over
links that are slow, intermittent or one-way: HF radio, satellite, emission-controlled
periods, data diodes. Peers there use a set of XEPs nothing in this package names:
zero-handshake S2S (XEP-0361), S2S over STANAG 5066 (XEP-0365), federated MUC
(XEP-0289), stream compression (XEP-0138), EXI (XEP-0322), and stream management
(XEP-0198, not planned). A peer that only speaks these cannot federate with
Rocket.Chat. The Strategic Foundation page places them in a later phase, and the market
research lists most of them as high priority, some as gates where HF links are in scope.

## Proposed outcome

A decision for each of these standards, recorded in [compliance.md](../compliance.md), and
for the ones taken up, a server that federates over the link types they target without
losing messages silently.

## Affected users and systems

- Deployed and tactical units; coalition peers running Isode M-Link on constrained links.
- [s2s-connectivity](../specs/s2s-connectivity.md), [hosted-muc](../specs/hosted-muc.md),
  [connection-recovery](connection-recovery.md), [interop-certification](interop-certification.md).

## Constraints

- Out of the first PROJ-120 phase.
- A data diode cannot carry a two-way handshake such as dialback
  ([ADR 0004](../adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md)).

## Open questions

- Which link types does the end product commit to, and when?
- Is federating through a boundary product (M-Link Edge, a cross-domain guard) enough, so
  that Rocket.Chat itself never speaks the constrained-link protocols?
- Does federated MUC replace or sit beside the per-member remote sessions of
  [ADR 0009](../adr/0009-one-remote-muc-session-per-local-member.md)?
