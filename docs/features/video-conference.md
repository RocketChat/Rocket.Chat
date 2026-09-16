# Video conferences

How a conference is modelled on the server: who belongs to it, how it ends, and why its chat is a separate
question from the call itself.

This is the model, not the mechanism. Names of functions and constants are deliberately absent — read the code
for those.

## Membership is not presence

A conference holds a list of **members**. Being a member authorizes joining the call, and it never expires.
Being *in* the call is a separate state on the same entry, and the two are recorded independently: a member who
joined and left keeps their membership and their place in the call's history, and can walk back in.

Membership is granted by being called, by being added, or by joining. It is **not** room membership, and it
grants no room access. Someone added to a call started in a DM is a member of that call without ever seeing the
DM. That asymmetry is deliberate, and most of what follows is a consequence of it:

- Access to a conference is membership **or** access to a room the conference lives in. Checking only the room
  refuses people their own call.
- Broadcasting the end of a call has to reach members who have no subscription to walk.
- A notification can only carry a room the recipient can actually open.
- The call's chat may be unreadable to some of the people in the call. See [Chat access](#chat-access).

## Leaving, and how a call ends

A call ends when nobody is left in it. Never because one participant asked — declining and leaving both write
only to the member's own entry.

Departures arrive two ways.

**Reported.** The call window says so as it closes. Fast and accurate, and it usually works — but it needs a
live client talking to a live server, and neither is guaranteed. Reports are also duplicated by design: more
than one thing may notice the same departure, so recording one twice must not move it.

**Inferred.** Everything the report cannot cover: a crashed tab, a closed laptop, a dead battery, or the
workspace being down while the call carries on in the provider. Providers run as separate services, so a call
outlives the workspace that started it, and people leave during the outage with nothing able to say so.

What all of those have in common is that renewals stop. So presence is modelled as a **lease** the call window
keeps renewing, rather than a departure it promises to report.

### Leases

A client in a call renews its lease on a timer. A lease unrenewed for long enough is swept, and the member is
recorded as gone.

Three rules make this honest:

**A departure is stamped with the last evidence, never with the moment of the sweep.** A laptop that closed at
10:00 and is swept at 10:03 left at 10:00. Anything else writes a call history saying people stayed until the
cron happened to run — and a call recovered after a long outage would add the whole outage to everyone's
history.

**A renewal undoes an inferred departure, and only an inferred one.** A lease given up on while the window was
in fact alive was simply wrong, and the window still talking is the correction. A member who *reported* leaving
is never revived this way: a heartbeat still in flight behind them must not put them back in the call.

**A restart waits out a full lease before believing itself.** Read from the database, "everyone left" and "we
were not here to be told" are the same picture — every lease is expired either way. In a multi-instance
workspace this costs nothing, since the instances that stayed up were never absent.

Leases only apply where the call renders inside Rocket.Chat. A call handed off to the provider's own page never
heartbeats, so sweeping it would end a live call; those are cleaned up by the long-running expiry instead.

### The grace period

An emptied call is not ended on the spot. A page-hide fires on a reload exactly as it does on a close, and the
two are indistinguishable, so ending immediately meant refreshing the call window killed the call. Emptiness is
confirmed after a short wait, which a rejoin cancels by simply being back. That also absorbs a network blip.

## Ringing

A ring is one-shot and short-lived. A client gives an incoming ring a few seconds before it gives up, which is
what separates "their phone is ringing right now" from "they were rung and did nothing" — and that distinction
is what decides whether ringing again is offered.

Because a ring can be missed, it cannot be the only way to reach a call. A separate list answers "what is
running that I could join", so a call is reachable without having caught its ring. That list offers a call when
the reader is a member, or is *in* the room it belongs to — room membership rather than room access, so a call
in a public channel they never joined stays out of their sidebar.

Ringing a batch is bounded. The bound is a property of the broadcast, not of the conference: each recipient is
a separate send. Adding participants is capped at the same number, which is what stops an add from silently
ringing only part of itself.

A direct call does not ring at creation. Creating a call is not asking anyone to answer it — the caller is
still choosing a camera, and answering into an empty room is worse than waiting. The ring goes when the caller
actually arrives.

## Chat access

A conference's chat lives in the room the call started in, or in a discussion the chat was moved to. Since
membership grants no room access, some members may be unable to read it.

Surfacing those members is the point. The remedy is a real choice with consequences, so it is offered when it
matters rather than forced on whoever adds a participant, and the caller always names which remedy to apply —
nothing infers one.

Both remedies give something away:

| Remedy | What it costs |
| --- | --- |
| Invite them to the room | Exposes the room's whole history to someone who was outside it |
| Move the chat to a discussion | Leaves the earlier history behind for everyone already there |

Exposing a private room's history is the bigger step, so private rooms and DMs lead with the discussion, and
public rooms — whose history is already open — lead with the invite. A room that cannot take new members leaves
the discussion as the only option. When a room cannot do what was asked, the answer is a refusal rather than
silently doing the other thing.

Deciding who lacks access is mostly one subscription read for every member at once. Rooms whose access can come
from outside their own subscriptions — team-owned channels, discussions inheriting from a parent, rooms
carrying ABAC attributes — are asked one at a time instead: getting one of those wrong is worse than the extra
reads, and conferences are small.

## Naming a call

A group conference has a name of its own, which the creator may set while it runs — only the creator, since a
title anyone could rewrite is one nobody can rely on.

A direct call has no name. It is named after a person, and which person depends on who is looking: whoever
started it, unless that is the viewer, in which case whoever else is on the call. The creator rather than
"the other member", because a direct call can hold more than two people and the one who matters to a newcomer
is whoever brought them in.

The name ordinarily comes from the viewer's own subscription, since a DM is named per side. A member added from
outside the DM has no subscription to read, and the room cannot help — a DM room carries no name of its own —
so naming the call after whoever brought them in answers the question they actually have: who is calling.

## Busy status

Members are marked busy for the duration of a call. It is a *claim* rather than a status: the status it
displaces is stashed and handed back when the claim ends, so someone who set themselves away before the call is
away again after it. A status set during the call is queued the same way rather than displayed.

Claims are keyed, so a conference's claim and a voice call's nest rather than clobbering each other.

The claim is released when the member leaves — including when leaving was inferred. A status left on busy by a
crashed tab is exactly the kind of thing nobody thinks to fix by hand.

Nothing about presence is allowed to fail a join. It is a courtesy; joining is not.
