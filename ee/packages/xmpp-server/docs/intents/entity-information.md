# Intent: Profiles and entity information over S2S

Author: Diego Sampaio. Status: draft.

## Problem

A remote client asking about a Rocket.Chat user or this server learns nothing. Queries for
a user's vCard (XEP-0054), last activity (XEP-0012), the server's software version
(XEP-0092) or time (XEP-0202) are answered `service-unavailable`
([s2s-connectivity R12](../specs/s2s-connectivity.md)). Remote users show no avatar and a
name that is their latest nick or their bare JID ([addressing R10](../specs/addressing.md)),
and Rocket.Chat users show no avatar or real name in XMPP clients. All four XEPs are
mandatory in the FMN Spiral 3 Text-based Collaboration profile, and the Bifrost QA listed
display names and avatars among what users noticed.

## Proposed outcome

- A remote entity querying a local user's vCard receives their Rocket.Chat name and avatar.
- Remote users' names and avatars, when their server publishes them, are shown in
  Rocket.Chat.
- The server answers software-version, entity-time and last-activity queries, each within
  what the administrator allows to be disclosed.

## Affected users and systems

- Users on both sides; accreditors checking the FMN mandated set.
- [service-discovery](../specs/service-discovery.md) (new features), [addressing](../specs/addressing.md)
  R10 (names), [presence](../specs/presence.md) (last activity relates to status).
- Rocket.Chat user profiles and avatars.

## Constraints

- Disclosure is a security decision in this market: the server version and a user's last
  activity can be hidden.
- The names shown must keep remote users distinguishable
  ([ADR 0006](../adr/0006-remote-users-are-local-users-keyed-by-bare-jid.md)).

## Open questions

- vcard-temp (XEP-0054, with XEP-0153 avatar hashes in presence) only, or also PEP-based
  avatars and nicknames (XEP-0084, XEP-0172, XEP-0292), which need PubSub (XEP-0060, also
  mandated)? Is PEP in scope for an S2S-only server at all?
- Which wins for a remote user's display name: their published vCard or nickname, or the
  nick they last used in a room?
- Is Jabber Search (XEP-0055, mandated) wanted, and over which directory?
