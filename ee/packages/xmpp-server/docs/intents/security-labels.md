# Intent: Security labels

Author: Diego Sampaio. Status: draft.

## Problem

Classified and coalition networks mark every message with a security label and refuse to
deliver it where the recipient is not cleared. Rocket.Chat neither sends nor understands
XEP-0258 labels. A labelled message from a peer is stored without its label, and a hosted
room relays it to its other XMPP occupants rebuilt from the body alone, so the label is
stripped on the way through: the opposite of failing closed. A Rocket.Chat message leaves
without a label. The only thing keeping labelled traffic away today is that the server does
not advertise `urn:xmpp:sec-label:0`, which tells clients not to send labels.

PROJ-120 lists labels as out of scope for its first phase and required in a later release;
the Strategic Foundation page puts them in phase 1. XEP-0258 is mandatory in the FMN
Spiral 3 Text-based Collaboration profile.

## Proposed outcome

- A message can carry a security label both ways, and the label is shown with it.
- The server enforces labels at entry, internally and at exit: a message is delivered only
  where the label permits, in either direction, and a message whose label cannot be
  evaluated is refused, not delivered unlabelled. A message without a label takes the
  policy's default label, which may be a refusal.
- Users, peer servers and domains, and rooms hold clearances. A message leaves for a peer
  only when the peer's clearance covers its label.
- A room has a clearance: a message whose label the room does not permit is refused, and a
  message reaches only the members cleared for its label. A labelled subject change
  relabels the room and removes the members no longer cleared.
- A requester gets the label catalog for a given sender and recipient, filtered to the
  labels the message would pass. The feature is advertised on the server domain and the
  MUC domain.
- The label path does not depend on one label format: ESS labels (RFC 2634) work first,
  and STANAG 4774 / 4778 labels are carried through the same catalog without a protocol
  change.

## Affected users and systems

- Defense and coalition users and their accreditors.
- Every message path: [direct-messages](../specs/direct-messages.md),
  [hosted-muc](../specs/hosted-muc.md), [remote-muc](../specs/remote-muc.md),
  [file-transfer](../specs/file-transfer.md), [service-discovery](../specs/service-discovery.md).
- Rocket.Chat's message and room model: a room today shows every stored message to every
  member; per-member delivery of one message does not exist
  ([ADR 0014](../adr/0014-inbound-message-id-is-derived-from-room-author-and-sender-id.md)
  already anticipates rooms whose members are not all cleared). Remote rooms filter per
  session ([ADR 0009](../adr/0009-one-remote-muc-session-per-local-member.md)) but the
  mirror stores each message once for all members.
- User clearances, which do not exist today.
- Interop: Isode M-Link 19.4+ and Swift 6.1 enforce labels; Prosody `mod_seclabels` serves
  catalogs but does not enforce; ejabberd has no documented support, so the current
  end-to-end harness cannot exercise labels.

## Constraints

- XEP-0258; STANAG 4774 and STANAG 4778 for the NATO label format and binding.
- Fail closed: an unknown or unevaluable label is a refusal.
- A `<securitylabel/>` in a `<presence/>` is a protocol violation and is refused.
- The server keeps its own boundary check even when the policy decision moves elsewhere;
  it is never a pass-through.
- Depends on [federation-authorization](federation-authorization.md): a clearance belongs
  to an authorized identity.

## Open questions

- Is the policy decision point Rocket.Chat's ABAC engine, and which directory provides
  clearances? XEP-0258 leaves the policy engine unspecified.
- Until this ships, should a labelled inbound message be refused (`policy-violation`)
  rather than stored and relayed without its label?
- Are per-peer label mappings (`<equivalentlabel/>`, one policy to another) needed for
  coalition peers?
- Should the marking also be written as the first line of the body for recipients that do
  not understand labels, as Isode does?
- Do labels apply to whole conversations as well as messages?
- May a correction change the label
  ([message-corrections](../specs/message-corrections.md) open questions)? Does a file
  carry its message's label? Is history filtered by the requester's clearance?
- Which release ships it, given PROJ-120 and the Strategic Foundation disagree on the phase?
