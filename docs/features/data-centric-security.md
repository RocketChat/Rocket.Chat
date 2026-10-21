# Data-centric security (DCS)

Confidentiality labels on individual messages, clearances on users and rooms, and the policy that decides which
reaches which. This is the message-level sibling of ABAC (`ee/packages/abac`), which labels whole rooms.
The engine is `@rocket.chat/dcs` (`ee/packages/dcs`); it is pure, with no database or settings access, so the
app layers compose it.

## Mapping to the standards

| Rocket.Chat | Standard element |
|---|---|
| `SecurityPolicy` (parsed SPIF) | Open XML SPIF `spif:SPIF`, namespace `http://www.xmlspif.org/spif` |
| `ISecurityLabel.policyId` | SPIF `securityPolicyId@id`; STANAG 4774 `PolicyIdentifier@URI` as `urn:oid:<id>` |
| `ISecurityLabel.classification` | SPIF `securityClassification@lacv`; STANAG 4774 `Classification` carries its `name` |
| `SecurityCategory` (`tagSetId`, `tagType`, `lacv`) | SPIF `securityCategoryTagSet@id` / `securityCategoryTag@tagType` / `tagCategory@lacv`; STANAG 4774 `Category@TagName` is the tag set name and `GenericValue` the category name |
| `SecurityCategoryTagType` | SPIF `restrictive`, `permissive`, `enumerated`+`enumType`, `tagType7` (informative); STANAG 4774 `Type` keeps only RESTRICTIVE / PERMISSIVE / INFORMATIVE |
| `ISecurityClearance` | X.509 Clearance attribute (RFC 5755) and STANAG 4774 `ConfidentialityClearance` |
| `SecurityLabelDisplayMarking` | XEP-0258 `displaymarking` (`fgcolor`, `bgcolor`) |
| `SecurityLabelCatalogItem` | XEP-0258 catalog `item` (`selector`, `default`) |

Labels store identifiers (OIDs and `lacv`s), never names or markings. Names are looked up in the policy whenever
they are needed, so a translator to STANAG 4774 XML or to ESS needs only the label and its policy.

## Clearances on rooms

A room's `securityClearance` is the range of labels the room may carry, so sending a message checks the same
function twice: the sender's clearance and the room's clearance must both cover the label. This follows the XMPP
security-label model, where clearances belong to users and channels alike. `defaultSecurityLabel` sets what users
should expect in the room, and it is what the room banner shows. It doesn't label any content.

## Access decision (`canAccess`)

The CMBAC access control decision function. A clearance covers a label when all of these hold:

1. Label and clearance are both under the policy being evaluated. Equivalent policies are not mapped yet, so a
   label under another policy is denied.
2. The classification is one the clearance lists. This is a set, not a ceiling: a SECRET-only clearance does not
   cover UNCLASSIFIED, as in the X.509 `classList`.
3. Every restrictive (and enumerated-restrictive) category of the label is held.
4. For each permissive (and enumerated-permissive) **tag** the label uses, at least one of its values is held. Two
   permissive tags in one tag set are evaluated separately.
5. Informative categories are ignored.

A category the policy does not define denies access. So does a category held under a different tag type, because
`tagType` is part of a category's identity: an ESS label encodes each type in its own bitmap.

## Label validity (`validateLabel`)

Checked when a label is **applied**. It returns every violation rather than stopping at the first:

- an unknown or obsolete classification or category (obsolete values stay readable but can't be applied)
- a category repeated in the label
- more than one value of a tag marked `singleSelection`
- a category combined with one of its `excludedClass` classifications or its `excludedCategory` categories
- a `requiredCategory` of the classification or of a category that is not met (`all`, `oneOrMore`, `onlyOne`)

`operation` counts `categoryGroup`s, not categories: a group is met when the label holds any one of its categories.
So `onlyOne` over the groups "Releasable To" and "Context" accepts two Releasable To values, but not one value
from each group. `categoryGroup` and `excludedCategory` may reference a tag set by name or by id. A reference with
no `lacv` (or with `all="true"`) means every category of that tag set with the given tag type.

## Markings (`displayMarking`)

Rendered in this order: policy name, classification, then categories grouped by tag in SPIF declaration order.
The order of categories in the label doesn't matter. Tag qualifiers supply the prefix, separator (default `/`) and
suffix. Root qualifiers supply the separator between parts (default a space), plus an overall prefix and suffix.
Background color is the classification `color`, and the text color is whichever of black and white contrasts more.

Two readings of the SPIF that differ from the surevine/spiffing reference implementation:

- A `markingData` without location codes applies at **every** location. spiffing treats it as `pageBottom` only,
  which renders NATO's TOP SECRET as "NATO TOP SECRET" in page headers instead of "COSMIC TOP SECRET".
- A `replacePolicy` phrase only replaces the policy name. The element's own phrase is the first applicable
  non-`replacePolicy` entry, so a French "TRES SECRET" and the untagged "COSMIC" combine into "COSMIC TRES SECRET".

`noNameDisplay` or `noMarkingDisplay` on any applicable entry hides the element itself, including on the entry that
replaces the policy name. That's how NATO's Context categories render "NATO/KFOR CONFIDENTIAL" with no trailing "KFOR".
Language lookup goes from the requested `xml:lang` to its base language and then to untagged markings
(`fr-CA` → `fr` → untagged).

## Catalog (`buildCatalog`)

Following XEP-0258, the catalog is a configured list of labels, filtered per request: an entry is offered only when
it is valid and every clearance passed (typically the sender's and the room's) covers it. All label combinations are
never enumerated. `defaultCatalogEntries` gives one uncategorized label per non-obsolete classification, for
policies with no configured catalog. Entries such as SECRET that require categories drop out of it.

## Parsing (`parseSpif`, `PolicyRegistry`)

The parser fails closed. Anything it can't interpret (an unknown marking code, a dangling reference, a duplicate
`lacv`, a DOCTYPE) throws `SpifError`, and `PolicyRegistry.replaceAll` swaps a whole set of policies at once, so a bad
reload keeps the previous policies. DOCTYPEs are rejected outright because SPIFs never need them and they are the
entity-expansion vector.

Not read yet: `equivalentPolicies`, SPIF signatures (`keyIdentifier`, `originatorDN`), `tag7Encoding`, and
`markingQualifier` location codes. Qualifiers apply at every location.

## Conformance

The engine has been run against the test suite of surevine/spiffing (MIT): its food, TLP and UK-demo policies, and
the NATO policy with the ADatP-4774 Table 17 labels. Every validity, marking and access-decision case it can express
passes. Cases outside this engine are skipped: BER and STANAG 4774 XML inputs, equivalent-policy translation, and
clearance markings. One spiffing fixture, `food-policy.xml`, has a mismatched closing tag that spiffing's parser
tolerates. This parser rejects it.

## Roadmap

1. Typings (`core-typings`) ✔
2. Engine: SPIF parsing, access decision, validation, markings, catalog ✔
3. STANAG 4774 XML serialization and STANAG 4778 binding: XML-DSig with an administrator-configured X.509 key
4. Model methods and indexes for labels and clearances
5. Settings, policy loading at startup, license gate (`abac` module), checks on send and edit
6. Checks on every read path; uncleared readers get a withheld placeholder with no content and no label
7. REST: catalog per room, policies, clearance administration
8. Client: label picker, per-message badges, room banner
