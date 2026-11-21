# What a requirement must pass

Each `R` is held to the four rules in the package's `docs/README.md` ("Writing a spec"),
which also says what counts as observable in that package. One bad and one good example per
rule, from different kinds of package.

## 1. Visible from outside the package

Someone using the package can see it: a value returned, an error thrown, an element rendered,
a message sent, a document stored, an event emitted. Refactors, module names and internal
state are not requirements.

- Bad: "Validation is delegated to `PolicyRule` instances."
- Good: "With `minLength` set, `validate()` on a shorter password MUST throw a
  `PasswordPolicyError` whose `details` include `error-password-policy-not-met-minLength`."

## 2. Names the case

Who does what, with which input, in which state. If two engineers could write different tests
for it, it is too broad.

- Bad: "The avatar handles missing images."
- Good: "When the image URL fails to load, the avatar MUST show the user's initials, and its
  accessible name MUST stay the username."

## 3. Says MUST or SHOULD

MUST is what the code is held to and a test proves. SHOULD is what the code does when nothing
prevents it; a test may skip when the condition is absent.

- Bad: "The service tries to reconnect."
- Good: "After the connection drops the service SHOULD reconnect with exponential back-off,
  and MUST stop after the configured number of attempts."

## 4. Cites its source

When the requirement comes from a standard, an upstream API or a product decision, name it
precisely enough for a reviewer to check the reading. A requirement that is the package's own
decision says so.

- Bad: "Invitations follow XEP-0045."
- Good: "A remote JID added as a member receives a mediated invitation (XEP-0045 §7.8.2)."
- Good: "Focus returns to the trigger when the dialog closes (WCAG 2.4.3; a package decision
  for which element)."

## Shape

Numbered `R1`, `R2`, … in one list, grouped under bold situation headings, never renumbered.
Several narrow requirements beat one broad one: tests cite them one at a time, and a defect
points at exactly one.
