# Adapting the templates to a package

The process is the same in every spec-first package. What changes is the vocabulary: what a
user of the package can observe, what its requirements cite, and which suite proves what.
Write those parts as plain statements about this package. Three kinds of package, with the
answers that work for each.

## A library (`packages/password-policies`, `packages/message-parser`)

**Observable**: the values exported functions return, the errors they throw (type and
message key), the exported types. Not: which helper is called, internal caching.

**A good requirement**: "**R3** With `minLength` set, `validate()` on a shorter password MUST
throw a `PasswordPolicyError` whose `error` is `error-password-policy-not-met` and whose
`details` include `error-password-policy-not-met-minLength`."

**Sources cited**: usually the product decision (link the intent) or "a package decision".
A parser cites its grammar or the format it follows.

**Testing**: one jest suite, colocated `src/**/*.spec.ts`, run by CI through `testunit`. It
can observe everything the package exposes, so it is the cheapest suite for every
requirement.

**Architecture lines in AGENTS.md**: the entry point, the one or two modules that matter, who
imports the package (`apps/meteor` server, the client, other packages).

## A UI package (`packages/ui-avatar`, `packages/ui-voip`)

**Observable**: what the user perceives and the contract with the parent: the rendered
accessibility tree (roles, names, states), visible text, focus movement, keyboard behaviour,
the callbacks the component calls and with what. Not: DOM structure, class names, which hook
holds state.

**A good requirement**: "**R2** When `onClose` is given, pressing Escape while focus is inside
the dialog MUST call it once, and focus MUST return to the element that opened the dialog."

**Sources cited**: the design (link the Figma frame or the intent), WCAG success criteria by
number for accessibility requirements, Fuselage component contracts.

**Testing**: jest with Testing Library for behaviour (query by role and name, never by
class), Storybook stories as the visual fixtures, `jest-axe` for automated accessibility
checks. Say which of these CI runs; visual regression may run only in its own workflow.

**Repository rules to mention**: `docs/frontend/` (layout containers, no styling props on
Fuselage components, keyboard models for lists, i18n).

## A service (`ee/packages/xmpp-server`, `ee/packages/presence`)

**Observable**: messages on the wire, documents written to the database, events emitted on
the broker, HTTP responses, settings it reads. Not: in-memory state, module boundaries.

**A good requirement**: "**R5** When a user's last session disconnects, the service MUST
emit `presence.status` with `status: 'offline'` for that user within 5 seconds, and MUST NOT
emit it while another session of theirs is connected."

**Sources cited**: protocol standards with section numbers (RFCs, XEPs), upstream API
documentation, or the ADR that fixed a behaviour.

**Testing**: unit tests for the pure parts, integration tests that run the service in
process, end-to-end tests that need a running Rocket.Chat or third-party services. The last
usually cannot run in CI; the README says so and the PR states it was run locally.

**Indexes**: a service that implements standards benefits from XMPP's compliance matrix: one
row per standard, its status, the spec that owns it. It mirrors spec frontmatter (add a
`standards` key to the spec template) and is never edited on its own. Add it only when the
package implements more than one or two external standards.

## The "Why spec-first" paragraph

One paragraph, in the engineer's words. It answers: who depends on this package behaving in
a particular way, what decides whether it is right, and what went or would go wrong with
behaviour that lives only in the code. XMPP's: other servers implement the same standards
independently, so whether a stanza is right is decided by RFCs and by what Prosody, ejabberd
and Openfire accept, not by our code.

Avoid generic benefits ("improves quality", "helps AI"). If the engineer cannot say why,
write down what they said and add an open question to the report.

## The seed eval

`prompt.md` is one or two sentences an engineer might type, asking for the feature to be
built: "Can you make validate() also reject passwords found in a breach list? Use the
HaveIBeenPwned range API." Not "write an intent for...": the eval proves that the agent
starts with an intent on its own. Choose a feature no spec will cover soon, so the case stays
valid.
