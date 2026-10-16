# Intent: Accreditation readiness and air-gapped operation

Author: Diego Sampaio. Status: accepted.

## Problem

Defense buyers ask for evidence that the server conforms to the NATO FMN NISP Text-based
Collaboration profile and that it runs on networks with no internet access. Neither exists,
and several defaults work against a security review:

- without a certificate the server federates in cleartext
  ([configuration-and-lifecycle R3](../specs/configuration-and-lifecycle.md),
  [ADR 0004](../adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md));
- with a certificate, a peer whose certificate does not verify is still admitted through
  dialback over TLS ([s2s-connectivity R5](../specs/s2s-connectivity.md));
- certificate trust is Node's default CA store, so a private PKI is only trusted through
  `NODE_EXTRA_CA_CERTS`;
- a peer certificate names its domain through dNSName entries only, or through the subject
  CN when it has none ([ADR 0005](../adr/0005-peer-certificates-name-a-domain-by-dnsname-srvname-or-xmppaddr.md)):
  the XmppAddr and SRVName names of RFC 6120 §13.7.1.2 are ignored, and a CN that RFC 9525
  no longer recognises is accepted;
- inbound localparts and resources are not validated, so a malformed JID can become a
  username ([addressing](../specs/addressing.md) validates domains only, R4);
- installation has not been shown to work without internet access.

## Proposed outcome

- A single fail-closed switch, on by default for new installs: the server refuses to start
  without TLS material, and refuses any peer that does not authenticate with a certificate
  that verifies against the configured trust anchors. Turning it off shows a warning,
  writes an audit log entry, and leaves a banner by the setting.
- The trust anchors for peer certificates are a setting, so a private PKI works without
  environment variables.
- A peer certificate names a domain through any server identity RFC 6120 §13.7.1.2 defines:
  dNSName, SRVName for `_xmpp-server`, or XmppAddr. The subject CN never names one. A PKI
  that names servers only by XmppAddr federates under fail-closed.
- A stanza whose `from` or `to` is not a well-formed JID (an empty or oversize part, a
  character RFC 7622 forbids) is refused with `jid-malformed` (type `modify`) and creates
  nothing. Localparts are compared under the UsernameCaseMapped profile of RFC 8265. A
  Rocket.Chat username that cannot be carried even with XEP-0106 escaping is not federated.
- The server installs from an offline package and federates between two networks with no
  internet access, using internal DNS only.
- FMN NISP conformance evidence exists and is kept current, each item tied to the spec
  requirements that satisfy it.
- The security review is closed: a threat model of the S2S connection, code and dependency
  scanning, a penetration test of the federation endpoint and a configuration review, with
  every high or critical finding fixed. The security team runs it and shares the final
  report.

## Affected users and systems

- Defense and coalition operators; reviewers of the deployment; the security team.
- [configuration-and-lifecycle](../specs/configuration-and-lifecycle.md),
  [s2s-connectivity](../specs/s2s-connectivity.md), [addressing](../specs/addressing.md),
  [operations.md](../operations.md); ADR 0004 may be superseded, ADR 0005 is, and
  [ADR 0011](../adr/0011-domain-normalization-is-idna-and-lowercase.md), which leaves
  PRECIS out of scope, changes for localparts.
- Rocket.Chat packaging for offline installs, and the audit log, outside this package.

## Constraints

- Default behaviour for existing installs does not change unless the administrator opts in,
  or the change is announced as breaking.
- Evidence documents live in this package next to the specs, versioned with the code, and
  reference requirement ids, so every claim traces from a standard's requirement through
  the spec and the code to the test that proves it against real peers.
- UsernameCaseMapped is implemented in this package rather than taken from a third-party
  one: the npm options are stale or brand new, and the review will scrutinise vendored
  Unicode code.

## Open questions

- **Q1** ~~Is fail-closed a single switch, or is it the default for new installs?~~ Both:
  one switch, on by default for new installs: see Proposed outcome.
- **Q2** ~~Does validation of localparts mean PRECIS (RFC 7622), out of scope today per
  [ADR 0011](../adr/0011-domain-normalization-is-idna-and-lowercase.md), or only rejecting
  what `@xmpp/jid` cannot parse?~~ Structural validation plus a UsernameCaseMapped
  comparison: see Proposed outcome and Constraints.
- **Q3** ~~Where do the evidence documents live: in this package next to the specs, or with
  the product's accreditation material?~~ Next to the specs: see Constraints.
- **Q4** ~~What does "security review closure" in S2 cover, and who runs the review?~~ See
  Proposed outcome.
- **Q5** ~~Should XmppAddr names in certificates be honoured for the defense PKIs that issue
  them ([ADR 0005](../adr/0005-peer-certificates-name-a-domain-by-dnsname-srvname-or-xmppaddr.md))?~~ Yes,
  with SRVName, and without the CN: see Proposed outcome. Under fail-closed an unmatched
  name refuses the peer instead of falling back to dialback, and Node already exposes both
  names, which removes the cost ADR 0005 rejected them for.
