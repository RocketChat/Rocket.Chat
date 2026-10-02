# Intent: Accreditation readiness and air-gapped operation

Author: Diego Sampaio. Status: draft.

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
- inbound localparts and resources are not validated, so a malformed JID can become a
  username ([addressing](../specs/addressing.md) validates domains only, R4);
- installation has not been shown to work without internet access.

## Proposed outcome

- A fail-closed mode an administrator can turn on: the server refuses to start without TLS
  material, and refuses any peer that does not authenticate with a certificate that
  verifies against the configured trust anchors.
- The trust anchors for peer certificates are a setting, so a private PKI works without
  environment variables.
- A stanza whose `from` or `to` is not a valid JID is refused with `jid-malformed` and
  creates nothing.
- The server installs from an offline package and federates between two networks with no
  internet access, using internal DNS only.
- FMN NISP conformance evidence exists and is kept current, each item tied to the spec
  requirements that satisfy it, and the security review is closed.

## Affected users and systems

- Defense and coalition operators; reviewers of the deployment.
- [configuration-and-lifecycle](../specs/configuration-and-lifecycle.md),
  [s2s-connectivity](../specs/s2s-connectivity.md), [addressing](../specs/addressing.md),
  [operations.md](../operations.md); ADR 0004 and ADR 0005 may be superseded.
- Rocket.Chat packaging for offline installs, outside this package.
- [PROJ-120](https://rocketchat.atlassian.net/wiki/spaces/RnD/pages/1307803678/PROJ-120+Native+XMPP+Server+Experience)
  §2 expected outcome ("designed for air-gapped deployments and accreditation-ready
  environments"), §4 in scope "Accreditation enablement" (air-gapped packaging, FMN NISP
  conformance evidence), §5 S2 "Accreditation-ready", and the scenarios §7.9 "Reject an S2S
  connection when authentication fails" and "Reject a message with a malformed XMPP JID",
  §7.11 "Deploy the XMPP capability in an air-gapped environment" and "Federate between
  isolated authorized networks".

## Constraints

- Default behaviour for existing installs does not change unless the administrator opts in,
  or the change is announced as breaking.
- Evidence documents reference requirement ids, so they move with the specs.

## Open questions

- **Q1** Is fail-closed a single switch, or is it the default for new installs?
- **Q2** Does validation of localparts mean PRECIS (RFC 7622), out of scope today per [ADR
  0011](../adr/0011-domain-normalization-is-idna-and-lowercase.md), or only rejecting what
  `@xmpp/jid` cannot parse?
- **Q3** Where do the evidence documents live: in this package next to the specs, or with
  the product's accreditation material?
- **Q4** What does "security review closure" in S2 cover, and who runs the review?
- **Q5** Should XmppAddr names in certificates be honoured for the defense PKIs that issue
  them ([ADR 0005](../adr/0005-peer-certificates-are-matched-on-dnsname-only.md))?
