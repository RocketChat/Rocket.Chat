# Scheduled conferences

A conference can be booked before anyone starts it, so that a calendar invitation can carry its link — and, optionally, a number SIP devices can dial. Today the booking comes from an Outlook add-in; nothing in the model is specific to Outlook.

Scheduled conferences only exist on the internal Pexip provider.

## Booking

The add-in asks two things, identifying the person booking by email address:

1. **What may this person book?** Booking needs an active user with that address, Pexip enabled, a room named in *Pexip → Persistent Chat → External room*, and the `schedule-conference` permission. Reserving a SIP number also needs *Add SIP alias* on and the `schedule-conference-sip-alias` permission. An address that belongs to nobody may book nothing.
2. **Book it.** The request — the requester's address, the invitees' addresses, an optional title, and whether to reserve a number — is stored as it arrived, together with the booking's discussion, created right away off the external room and owned by the requester. It is named after the title, or gets the usual dated conference-chat name. No conference exists yet. The answer is the link, the number if one was asked for, and the text to put in the invitation.

The invitation text comes from one of two templates under *Pexip → Outlook Add-in*, one for bookings with a number and one without, so each workspace words it its own way. They are filled in on the server; `{url}` and `{sipAlias}` stand for the link and the number.

Asking for a number the person may not have is refused outright, rather than booked without one.

> Both requests are currently answered without authentication, for a demonstration. Anyone can book on behalf of any address; the rate limit is the only brake.

## The booking is never consumed

A booking is not a conference. It is the recipe every conference started from it is built from, and it is kept for good:

- the link keeps working after a conference ends — the next person to follow it starts a fresh one;
- every conference started from it shares the booking's discussion, so the conversation carries over from one meeting to the next. If that room has been deleted, the next conference gets a new one, which then takes its place;
- a reserved number stays reserved forever. Ordinary conferences borrow a number for their lifetime and give it back when they end; a booked number is never handed to any other conference, and never reserved twice.

At most one conference runs for a booking at a time.

## Starting the conference

The first of these to happen starts the conference; every later one joins it:

- someone signed in to Rocket.Chat follows the link;
- someone opens the alias link (`/conference/<number>?scheduled=1`) for a booked number;
- a SIP device dials the booked number.

Whichever it is, the conference is built **on the requester's behalf**: they are its creator, and therefore its host, even if they are the last to arrive. Everyone else is a guest — any signed-in user who has the link may join.

The conference lists the requester and every invitee with an account as members from the moment it starts, so it shows who has not arrived yet. The conference hangs off the external room and uses the booking's discussion. Invitees whose address belongs to an active user are added to it when the conference starts, and anyone else is added when they join. The invitee list is matched against users each time a conference starts, so someone who gets an account after the booking is still picked up. Nobody is rung.

The title is the booking's, or the number when it has none; with neither, the room names the conference, as for any untitled one. A booking without a number never gets one, even on a workspace that gives every other conference a temporary number.

## The Outlook add-in

The add-in ships with the workspace: a task pane under `/outlook-addin/` and a manifest the workspace generates at `/outlook-addin/manifest.xml`, pointing at itself. The manifest is the XML kind, because on-premises Exchange accepts no other, and it asks only for what every supported Exchange Server's webmail offers. An Exchange admin installs it from that URL, through the Exchange admin center or `New-App -Url`.

In a meeting the organizer is editing, a button opens the task pane. It asks the workspace what the organizer may book, offers a dial-in number only when they may have one, and on confirmation books the meeting with the event's attendees and subject. It then appends the workspace's invitation text to the end of the event body. The pane speaks the workspace's default language.

## Showing the add-in inside Outlook on the web

Outlook on the web shows an add-in inside an iframe, while the workspace refuses to be framed by anyone. The add-in's own pages, under `/outlook-addin/`, are the exception, and only for the webmail origins listed in *Pexip → Outlook Add-in → Outlook on the Web Addresses*. With none listed they stay as unframeable as everything else. Those pages may also load Office.js from Microsoft's CDN, which is the only place an add-in is allowed to load it from.

## Not covered yet

- Editing or cancelling a booking: once made, it never changes.
- Invitees without an account can only take part by dialling the number; the link requires signing in.
