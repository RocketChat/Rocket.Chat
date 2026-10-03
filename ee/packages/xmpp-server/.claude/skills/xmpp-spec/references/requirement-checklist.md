# What a requirement must pass

Each `R` in a spec is held to the four rules in `docs/README.md` ("Writing a spec"). One
good and one bad example per rule, from this package's domain.

## 1. Visible from outside the package

A peer, a client, a database query or an event listener can see it. Refactors, module
names and internal state are not requirements.

- Bad: "The router dispatches MUC stanzas to `MucService`."
- Good: "A `groupchat` message to `<room>@<MUC domain>` from a JID that is not an occupant
  is answered with `not-acceptable`."

## 2. Names the case

Who sends what, to whom, in which state. If two engineers could write different tests for
it, it is too broad.

- Bad: "Presence is relayed."
- Good: "An `unavailable` presence from a remote occupant removes them from the room, is
  broadcast to the remaining remote occupants, and removes their Rocket.Chat subscription."

## 3. Says MUST or SHOULD

MUST is what the code is held to and a test proves. SHOULD is what the code does when
nothing prevents it, and a test may skip when the condition is absent.

- Bad: "The server tries to reconnect."
- Good: "After a connection is lost the server SHOULD reconnect with exponential back-off,
  and MUST stop after the configured number of attempts."

## 4. Cites the standard with a section

When the requirement implements a standard, name the section, so a reviewer can check the
reading. A requirement that is a Rocket.Chat decision rather than a standard says so.

- Bad: "Invitations follow XEP-0045."
- Good: "A remote JID added as a member receives a mediated invitation (XEP-0045 §7.8.2)
  from the room on behalf of the inviter."

## Shape

Numbered `R1`, `R2`, … in one list, grouped by bold situation headings, never renumbered.
Several narrow requirements beat one broad one: tests cite them one at a time, and a
defect points at exactly one.
