# XML is handled with `ltx` and `@xmpp/jid`, not `@xmpp/xml`

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/xml/`, `src/types/ltx.d.ts`, `package.json`

## Decision

Stanzas are `ltx` `Element`s, built with the package's own `xml()` helper and framed by a
`StanzaParser` built on ltx's SAX parser. JID escaping uses `@xmpp/jid`. `@xmpp/xml` is not a
dependency. The CommonJS parts of both libraries that the package touches are typed in
`src/types/ltx.d.ts`.

## Why

`@xmpp/xml` wraps `ltx` for the client stack, and the server needs the lower layer directly:
a streaming SAX parser that can be reset after STARTTLS, and hooks to reject DOCTYPE, entity
declarations, comments, CDATA and processing instructions before an element is built
(RFC 6120 §11.1). Going through the wrapper would mean reaching into its internals anyway.
`@xmpp/jid` is kept because its escaping tables are correct and tested.

### Alternatives rejected

- **`@xmpp/xml` throughout.** Hides the parser; the hardening would have to be bolted on from
  outside.
- **A hand-written parser.** More control, more surface for bugs in the part of the stack a
  hostile peer talks to first.

## Consequences

- Test helpers that use `@xmpp/client` (which depends on `@xmpp/xml`) convert between the
  two element types at the edge; that is confined to `tests/end-to-end/helper/`.
- Upgrading `ltx` means re-checking `ltx.d.ts` and the hardening cases in
  `StanzaParser.spec.ts`.
