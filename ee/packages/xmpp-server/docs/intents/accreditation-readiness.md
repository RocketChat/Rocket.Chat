# Intent: Accreditation readiness and air-gapped operation

Author: Diego Sampaio. Status: draft.

## Problem

Defense buyers accept the server only with evidence: DISA UC XMPP Server-role conformance
(JITC, DoDIN APL) and NATO FMN NISP Text-based Collaboration conformance. None of that
evidence exists, and several defaults work against it:

- without a certificate the server federates in cleartext
  ([configuration-and-lifecycle R3](../specs/configuration-and-lifecycle.md),
  [ADR 0004](../adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md));
- with a certificate, a peer whose certificate does not verify is still admitted through
  dialback over TLS ([s2s-connectivity R5](../specs/s2s-connectivity.md));
- certificate trust is Node's default CA store, so a private PKI is only trusted through
  `NODE_EXTRA_CA_CERTS`, and only dNSName identities are matched
  ([ADR 0005](../adr/0005-peer-certificates-are-matched-on-dnsname-only.md));
- TLS versions and cipher suites are Node's defaults; no spec states them (RFC 7590 defers
  to BCP 195);
- no spec requires FIPS 140 validated cryptography; only a FIPS image variant exists;
- the listener binds IPv4 only (`0.0.0.0`), so an IPv6-only peer cannot connect, though
  outbound resolves AAAA ([s2s-connectivity R1, R8](../specs/s2s-connectivity.md));
- inbound localparts and resources are not validated, so a malformed JID can become a
  username ([addressing](../specs/addressing.md) validates domains only, R4);
- federation events (connections authenticated or refused, identities created, stanzas
  refused) are logged, not audited;
- the FMN Spiral 3 profile mandates about twenty XEPs, and [compliance.md](../compliance.md)
  has no row for most of them, so there is no implement / delegate / exception answer per
  mandated standard; three mandated ones (XEP-0114, XEP-0198, XEP-0115) are excluded with a
  reason a certifier has not seen;
- installation has not been shown to work without internet access.

## Proposed outcome

- A fail-closed mode an administrator can turn on: the server refuses to start without TLS
  material, and refuses any peer that does not authenticate with a certificate that
  verifies against the configured trust anchors.
- The trust anchors for peer certificates are a setting, so a private PKI works without
  environment variables.
- TLS versions and cipher suites follow a stated policy, and the cryptography used for TLS
  and dialback runs on a FIPS 140 validated module when the deployment requires it.
- The server accepts S2S connections over IPv6 as well as IPv4.
- A stanza whose `from` or `to` is not a valid JID is refused with `jid-malformed` and
  creates nothing.
- Federation security events are recorded in an audit trail an accreditor can review.
- Every standard the targeted FMN Spiral and UC XMPP profile mandate has a row in
  [compliance.md](../compliance.md) that says implemented, delegated or excepted, and each
  exception has a written reason.
- The server installs and federates between two networks with no internet access, using
  only an offline package and internal DNS.
- Accreditation evidence exists and is kept current: threat model, security-control
  mapping, a UC XMPP Server-role test plan, and FMN NISP conformance results, each tied to
  the spec requirements that satisfy it.

## Affected users and systems

- Defense and coalition operators; accreditors.
- [configuration-and-lifecycle](../specs/configuration-and-lifecycle.md),
  [s2s-connectivity](../specs/s2s-connectivity.md), [addressing](../specs/addressing.md),
  [compliance.md](../compliance.md), [operations.md](../operations.md); ADR 0004 and ADR 0005
  may be superseded.
- Rocket.Chat packaging for offline installs and the FIPS image, outside this package.
- PROJ-120 scope "Accreditation enablement", S2, and scenarios 7.9 "Reject an S2S connection
  when authentication fails", "Reject a message with a malformed XMPP JID" and 7.11.

## Constraints

- Default behaviour for existing installs does not change unless the administrator opts in,
  or the change is announced as breaking.
- Evidence documents reference requirement ids, so they move with the specs.
- The conformance baseline is pinned to a named FMN Spiral and ADatP-34 edition and to UC
  XMPP 2013; a change of baseline is a change to this intent.

## Open questions

- Which FMN Spiral (3 or 5) and which ADatP-34 edition is the target? The mandated list
  differs between them.
- Which UC XMPP 2013 Server-role requirements apply to an S2S-only server with no C2S?
  The requirement ids and levels have not been read from the DISA document itself.
- Is fail-closed a single switch, or is it the default for new installs?
- FIPS 140-2 or 140-3? The source pages disagree.
- Does validation of localparts mean PRECIS (RFC 7622), out of scope today per
  [ADR 0011](../adr/0011-domain-normalization-is-idna-and-lowercase.md), or only rejecting
  what `@xmpp/jid` cannot parse?
- Should XmppAddr names in certificates be honoured for the defense PKIs that issue them
  ([ADR 0005](../adr/0005-peer-certificates-are-matched-on-dnsname-only.md))?
- Where do the evidence documents live: in this package next to the specs, or with the
  product's accreditation material?
- Does the audit trail belong to this server or to Rocket.Chat's platform audit, and what
  retention does it need?
