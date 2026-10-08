# ADR 0005 — Outlook server-to-server integration

## Introduction

The Outlook server-to-server integration has to reach Exchange in two environments that share almost nothing at the transport layer.

**Exchange Online (cloud).** Microsoft begins phased EWS disablement on 1 October 2026 and retires it permanently on 1 April 2027. Any cloud path must be Microsoft Graph, which accepts only OAuth 2.0 and supports neither NTLM nor Basic.

**Exchange Server (on-premises).** Graph is not available. EWS remains supported and is unaffected by the retirement. Authentication is NTLM or Basic, and Exchange 2019 CU14 and later, along with Exchange Server Subscription Edition, enable Extended Protection by default. Extended Protection requires NTLMv2 with a channel binding token.

This is not a choice between two APIs. Each world has exactly one supported mechanism, so both are built, and the abstraction that lets one sync engine drive both is the deliverable.

Four questions had to be answered before any of it could be written:

1. How EWS requests get built and read, given that EWS is SOAP with no JSON API.
2. How the on-premises connection is authenticated, given that Extended Protection makes channel binding mandatory and no maintained Node library implements it.
3. How the cloud connection is authenticated, given that the repo's existing OAuth code implements user login rather than app-only access.
4. How one sync engine reconciles calendars through two delta models that report changes in incompatible ways.

A constraint runs across all of it: when the EWS provider is selected, the integration makes zero outbound connection attempts to any Microsoft cloud endpoint. That guarantee is binary and a single unguarded call breaks it.

---

## Decision

- ###  No EWS or SOAP library. Requests are literal templates, responses are parsed with `@xmldom/xmldom`

EWS communication reduces to two jobs: build a request XML document, read a response XML document. There is no SDK and no client object, so the only real question is who writes the XML.

The operation set is small and frozen against one server product. A SOAP stack earns its weight across dozens of operations with evolving contracts, not across a handful of fixed ones, where it mostly contributes a dependency tree.

`ews-javascript-api`, which the desktop app ships, is unmaintained. Its last release was 0.15.3 in May 2024 and it never reached 1.0. Adopting an abandoned library to speak a protocol Microsoft is actively retiring is a poor trade on its own, and it would also have added roughly seven transitive packages to the server: `@ewsjs/xhr` with its `axios`, `http-cookie-agent` and `tough-cookie`, plus `base64-js`, `uuid`, and the legacy `moment` and `moment-timezone`. In an air-gapped, security-reviewed deployment every package is audit surface, and reducing that surface is part of what this project delivers.

The library was not rejected over authentication. Its transport is pluggable through `ConfigurationApi.ConfigureXHR`, so it could have ridden on top of our own transport. It lost on dependency weight and on being abandoned.

`@xmldom/xmldom` is already a production dependency of `apps/meteor`, used by the SAML response parsers, so parsing costs nothing new.

Calendar uses `SyncFolderItems` as a change probe, `FindItem` with a `CalendarView` to expand recurring series over the window, and `GetItem` for the detail that `FindItem` returns by id only. Contacts use `FindFolder` to enumerate address books, `SyncFolderItems` per folder, `GetItem` for the detail, and `GetAttachment` for photos. `ResolveNames` verifies the service account during Test Connection.

Both calendar operations address `DistinguishedFolderId Id="calendar"` directly. An earlier draft resolved the folder id with `FindFolder` first, which returns the _subfolders_ of the parent it is given and therefore produced an unrelated, usually empty folder; the operation was removed rather than fixed.

Contacts cannot be reached that way, because a contact folder other than the main one is a subfolder of the contacts root and a distinguished-folder request never sees it. They are rarer than that makes them sound, and the next decision explains why, but missing one costs the whole address book inside it and says nothing while doing so, which is what the enumeration buys for one request per user per run.

That listing has to filter on `FolderClass`, and this part is EWS only. Exchange keeps its own contact folders under the same root, among them the Recipient Cache that feeds autocomplete and a copy of the GAL, and every one of them is a `ContactsFolder`, so the type does not separate them. The class does: a real address book is exactly `IPF.Contact`. Graph needs no equivalent, because `/contactFolders` lists only the user's own.

**EWS reports failure through two independent channels, and handling only the first is how a partial failure gets read as success:**

1. A SOAP fault, when the whole request was rejected. These arrive with HTTP 500, so the transport cannot tell them from a genuine server error and deliberately passes 5xx bodies through to the parser.
2. A per-item `ResponseCode` inside an HTTP 200, when some items succeeded and others did not.

One shared parser handles both for every operation, and maps recognised codes to typed errors so Test Connection can distinguish a wrong password from a missing impersonation role.

Three guards were added after tests proved each necessary. Well formed HTML is also well formed XML, so a proxy error page returned with HTTP 200 parses cleanly, matches nothing, and reads as "the mailbox has no events"; the parser asserts the root element is a SOAP envelope. The fault element is matched by local name rather than by prefix, because Exchange sends `s:Fault` and a lookup for `soap:Fault` never saw it. And a fault carries its `ResponseCode` in the errors namespace rather than the messages one, so both are scanned; without that, an impersonation failure against an unknown mailbox parsed as a successful sync of zero events.

**A fourth guard came out of the contact work, and it is the only one that fails silently.** EWS ignores a `FieldURI` it will not serve rather than rejecting it. Dictionary properties are the case that bites: `contacts:EmailAddresses` and `contacts:PhoneNumbers`, in the plural, are not requestable that way, and a request carrying them returns `NoError` with those elements simply absent. There is no fault and no response code to catch, so the silence reads as "this contact has no email". They are only served through `IndexedFieldURI` naming the singular plus a `FieldIndex`, one request entry per slot, which is why the template enumerates them; that is safe to hardcode because the EWS schema is closed and Exchange 2019 is the last on-premises version to define it. Ordinary item properties, `item:Categories` and `item:Attachments` among them, are unaffected.

- ### Vendor the NTLM message layer, and write channel binding by hand

`@rocket.chat/server-fetch` cannot carry NTLM, for two independent reasons. The handshake is three messages that must travel on the same TCP connection, and `fetch` models requests as independent with no connection affinity. And the channel binding token is a hash of the certificate of the connection carrying the handshake, which requires `tlsSocket.getPeerCertificate()`, and `fetch` abstracts the socket away.

`@ewsjs/ntlm-client` is MIT licensed, has zero dependencies, and is 742 lines across five files, so taking it costs nothing on the audit-surface axis that decided the SOAP question above. NTLM message construction is cryptographic code, and borrowing a working implementation is lower risk than writing one. Vendoring rather than depending on it means a security reviewer can read all of it in one sitting, and it is the only way to reach the channel binding insertion point.

**Channel binding is ours** because it needs two things from different layers at the same time: the certificate, which lives in the socket, and a field inside the NTLM message, which the encoder builds. Well-layered libraries keep those apart, so the feature falls into the gap between them. That is a consequence of correct design rather than an oversight, which is why no library does both.

Two further reasons the gap was never filled. On Windows nobody had to implement it, because SSPI does channel binding transparently and the Microsoft ecosystem never produced a reference implementation for anyone to port. And off Windows almost nobody needed it until 2024, when Extended Protection became the default in Exchange 2019 CU14. The libraries predate the requirement.

**Only the NTLMv2 paths are kept from the vendored source.** The library implements both versions and selects between them from the flags the server negotiated. Keeping only version 2 costs no compatibility. The version is not negotiated by the protocol at all, which MS-NLMP section 3.3.2 states explicitly: it must be configured on both client and server beforehand. The client picks the algorithm, and no `LmCompatibilityLevel` setting refuses NTLMv2, since the levels only ratchet toward stricter. NTLMv2 is therefore accepted anywhere NTLM works. NTLMv1 is also structurally incompatible with the requirement driving this work: its response carries no AV_PAIR list, so there is nowhere to put a channel binding token. Supporting NTLMv1 and supporting Extended Protection are mutually exclusive, and keeping DES-based code we could never exercise would be a liability rather than a compatibility win.

**We own the HTTPS agent**, which the handshake requires anyway for connection affinity and the certificate. That makes it the natural home for the air-gap invariant, because it is where connections are actually opened rather than where URLs are built. An earlier draft placed the check where the request URL was assembled, which compared the endpoint hostname against itself and was therefore dead code. Enforcing it in the agent's `createConnection` refuses any host other than the configured endpoint, including from a future code path nobody has written yet.

**Basic authentication is a separate, trivial path** for servers without Extended Protection. No handshake, no binding.

- ### One page contract, three coverage states

Everything a provider returns from a list operation is a `Page`, and the field the sync engine actually reasons about is `coverage`:

| `coverage`  | What the page is                                         | May absence be read as deletion? |
| ----------- | -------------------------------------------------------- | -------------------------------- |
| `'full'`    | everything in the scope                                   | yes                              |
| `'delta'`   | only what changed, deletions included                     | no                               |
| `'partial'` | a `full` the provider could not finish                    | never                            |

The scope is the time window for events and the folder for contacts.

- ### Calendar sync: one anchored window, two delta models

Both providers read a bounded window. It starts at midnight of the current day rather than at `now`, and it is capped at seven days, defaulting to two.

The anchoring is not cosmetic. A Graph `deltaLink` bakes `startDateTime` and `endDateTime` into itself and ignores the window passed alongside it, so a start that moved every run would mint a new cursor every run and the delta would never be reused. Anchoring to the day makes the window identical across every run of that day. Starting at midnight rather than at `now` also means an event that already happened today is still refreshed, which is what the desktop integration does.

**Graph's delta is the source of truth.** `calendarView/delta` expands occurrences server side and reports removals explicitly as `@removed`, so nothing is inferred. The first call of the day carries no cursor, reads the whole window and returns a `deltaLink`; every call after that returns only what changed. A Graph page is therefore always `coverage: 'delta'`, and the window prune never runs for it.

**EWS's delta cannot be used as a source, so it is used as a probe.** This is Microsoft's own recommendation rather than our inference, and the documentation states both the rule and the reason:

> SyncFolderItem does not include any calendaring logic, so you should use the EWS Managed API FindAppointments method or the EWS FindItem operation with the CalendarView element for calendar synchronization.
>
> — [Mailbox synchronization and EWS in Exchange](https://learn.microsoft.com/en-us/exchange/client-developer/exchange-web-services/mailbox-synchronization-and-ews-in-exchange)

The reason is the storage model. Exchange keeps a recurring series as a single master item holding the pattern and its exceptions, so `SyncFolderItems`, being a folder delta, reports that master, whose `Start` is only the first occurrence. Deleting one occurrence does not produce a deletion at all: it writes an exception onto the master, which is reported as an update, so an event already stored would never be removed. [Access a recurring series by using EWS in Exchange](https://learn.microsoft.com/en-us/exchange/client-developer/exchange-web-services/how-to-access-a-recurring-series-by-using-ews-in-exchange) documents that behaviour directly. See also [Calendars and EWS in Exchange](https://learn.microsoft.com/en-us/exchange/client-developer/exchange-web-services/calendars-and-ews-in-exchange) and the [SyncFolderItems operation](https://learn.microsoft.com/en-us/exchange/client-developer/web-service-reference/syncfolderitems-operation) reference.

Microsoft also states that the Graph delta is the newer implementation and accounts for recurrence properly. That is why Graph can apply its delta directly and EWS cannot, and the asymmetry between the two providers is the API's, not ours.

When the probe reports anything, `FindItem` with a `CalendarView` asks Exchange to expand the whole window and `GetItem` fills in the detail, and that result is returned as `coverage: 'full'`. The caller reconciles: whatever it holds inside the window and did not receive has been removed. This is what the desktop integration has always done, and reusing its reconciliation rather than inventing one is deliberate.

Letting Exchange expand the window is the convenience the probe design buys, and it is where timezones stop being avoidable. A pattern reads "every Monday at 10:00 in W. Europe Standard Time", which is 09:00 UTC in winter and 08:00 UTC in summer, with switchover dates varying by zone and by year. Expanding it correctly needs the IANA timezone database plus a mapping from the Windows zone names Exchange uses onto it, and then recurrence arithmetic with moved, cancelled and trailing occurrences.

|                                 | Graph                                                   | EWS                                                           |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| What the cursor answers about   | the changes in one window                               | the changes in the calendar folder                            |
| Cursor discarded when           | the window moves at midnight, Exchange rejects it, or the mailbox or provider changed | Exchange rejects it, or the mailbox or provider changed |
| How a deletion arrives          | explicitly, as `@removed`, or by a series re-expansion  | never; inferred from absence                                  |
| `coverage`                      | always `'delta'`                                        | `'full'` when the snapshot finished, `'partial'` when it did not |
| Requests when nothing changed   | 1                                                       | 1                                                             |
| Requests when something changed | 1 per page, plus one per series master a page omitted   | 3 at minimum: probe, list, detail, plus one list per extra page |

The alternative for EWS was to drop the delta entirely and fetch the window every run, which is the desktop's model unmodified. It was rejected for the quiet case: with the probe, a run where nothing changed costs one request instead of three. Neither option reduces the floor below one request per mailbox per run, since calendar data is per mailbox in both APIs and no batching spans mailboxes.

Only the default calendar folder is read, in both providers. A secondary calendar a user created is out of scope. Note that this is not a choice on the Graph side either: `/users/{id}/calendarView` addresses the default calendar, and reaching another one requires naming it explicitly.

- ### The EWS calendar snapshot has to be paged, and a snapshot that could not finish must never prune

`CalendarView` cannot be paged the way the rest of EWS is. It takes no `Offset` and cannot be combined with `IndexedPageItemView`, so the only way to continue is to reopen the window with `StartDate` set to the last occurrence received, which requires `calendar:Start` in the `ItemShape` so that cursor exists at all. Reopening at the same instant rather than one millisecond later is the safe rounding direction: duplicates collapse on the id set that is being built anyway, whereas skipping loses an event outright.

Paging is not optional. `EWSFindCountLimit` caps a single Find at 1000 items under the default throttling policy, asking for more has no practical effect, and the server truncates **silently**, signalling it only through `IncludesLastItemInRange="false"` on the response. An administrator who lowered the limit truncates sooner. The budget is per user and shared across concurrent requests.

This is where `'partial'` earns its place. The first implementation read one page, assumed it was the whole window, and reported a complete snapshot. The caller then pruned: `deleteImportedOutsideSet` removes everything stored inside the window that is not in the keep set, and the window starts at midnight of the current day. A mailbox with more than 1000 occurrences in the window would have had everything past the first page deleted on every run. The page now reports `'partial'` when the loop ends without the server confirming it reached the last item, and a partial read prunes nothing.

- ### Graph returns recurring occurrences as stubs, and reports a series as a whole

Verified against a live tenant rather than inferred. A `calendarView/delta` page for a recurring series carries the `seriesMaster` **plus** one item per `occurrence`, and the occurrences are stubs: they arrive with `id`, `type`, `seriesMasterId`, `start` and `end`, and no `subject` and no `isCancelled`. The keys are absent, not empty. Everything descriptive stays on the master, whose `start` equals the first occurrence's.

Imported naively, that produces exactly what it sounds like: a named duplicate of the first occurrence, and every occurrence stored untitled. `$select` is not supported on `calendarView/delta`, so asking Graph for the missing fields is not available.

The provider resolves the page before the sync engine sees it. The master is dropped, because what happens in the window are its occurrences. Each occurrence is read on top of its master, with the occurrence's own values winning, which is exactly what an `exception` is and needs no separate case. A master missing from the page is fetched once from `/users/{mailbox}/events/{id}`, because an occurrence can arrive on a later page or alone in an incremental round; a failed fetch leaves the occurrences untitled rather than losing the page.

**Deletion is reported at the level of the series, never of the occurrence**, which is the second half of the same behaviour:

- Deleting **one occurrence** resends the master as changed, together with only the occurrences that survive. The deleted one is simply absent. There is no `@removed` for it.
- Deleting the **whole series** sends a single item: the master, with `@removed` and no `type`.

Two mechanisms handle it. Stored events carry `seriesMasterId`, so a removal matches either an event's own `externalId` or the series it belongs to, and the provider never has to know which kind of id it was handed. And a page names the series whose expansion it carried in full, which the sync engine accumulates across pages and applies once at the end of a completed run: anything stored for those series and missing from the run is gone. A run that stopped early, on the page cap or a missing cursor, prunes nothing, for the same reason a `'partial'` EWS snapshot does not. Only a master that came in the page itself counts as re-expanded; one fetched to fill in a subject says nothing about the occurrences the page left out.

One consequence worth recording because it is not obvious: converting a single event into a recurring one **keeps its id** and turns that item into the series master. The row already stored under that id stops being an event in its own right the moment the occurrences appear, so the series prune clears it along with the occurrences the re-expansion dropped.

- ### The legacy desktop integration is untouched

The existing client-to-server integration keeps working exactly as before, and the two are kept from colliding by an explicit mode setting rather than by convention. In server mode the Exchange URL is withheld from `getUserInfo`, which leaves a fresh desktop setup with no sync target. That alone is not enough, because a client configured before the switch has it cached, so the server also refuses the writes.

Those refusals split along what the question actually is, which is why there are two errors rather than one:

- **`create` with an `externalId`, and `import`, are refused while `Exchange_Mode` is `server`**, with `error-calendar-managed-by-server-sync`. There is no stored event to inspect at that point, and the question is whether the workspace still accepts an import at all.
- **`update` and `delete` are refused for any event whose `source` is `'outlook'`**, with `error-calendar-event-owned-by-outlook-sync`, and with no reference to the setting. The sync re-sets every field it owns and re-reads the whole window on its next run, so an edit would silently revert and a deletion would come straight back. Gating that on the setting left a hole: turn the mode off, edit, turn it back on, and the change is lost with no feedback.

An event the desktop imported carries an `externalId` and no `source`, so it stays fully editable, as does a user's own manually created event. This is pre-existent.

- ### Contacts sync is per folder, and local contacts are first class

Contacts are read per address book rather than per mailbox, in both providers, because both scope the contact delta token to one folder. Graph's listing starts with a synthetic `default` folder standing for the main address book, since `/users/{id}/contacts` addresses that one alone and a user's own address books need `/contactFolders/{id}/contacts`. A folder that stops being listed has its contacts and their photos dropped, which is the only way a deleted address book ever leaves.

**Folders are transport, categories are the interface**, which is the move Microsoft itself made rather than a preference of ours. Outlook on the web replaced contact folders with categories and migrated the existing ones, stamping each contact with a category named after the folder it was in, so a folder is now a desktop-era container that still exists in the store while the interface everyone sees is tags. Our UI filters on those categories, which are per-item strings rather than a hierarchy and can be several per contact. The folder stays on the record because the sync and the photo crossing address by it, not because anyone browses by it.

The practical consequence is that in a workspace living in Outlook on the web the enumeration finds only the default folder, and the extra request is all it costs. Folders turn up where Outlook desktop has been in use, which is also where the categories we read were born.

**Contacts enumerate their folders and calendars do not, and that is on purpose.** Both APIs can address either default container directly, so the difference is a choice rather than a limitation, and it rests on two things. A secondary calendar is often not the user's own schedule: a subscribed holiday calendar, a team calendar, birthdays. Feeding those into what the product shows as your next meeting would be noise. A second contact folder is the user's own address book, only filed elsewhere, so leaving it out drops something they would expect to find. And the two fail differently. A missing event is noticed, because the user knows about the meeting and it is not there. A missing contact is not: an unknown number rings, and nobody connects that to an address book that never synced. The silent half is the one worth a request per user per run.

**Phone numbers are normalized to E.164 on ingest**, into a field beside the raw value, because the number as stored is a display string and the reverse lookup for caller ID needs a key. A number that cannot be resolved to a country is stored raw with no key, and simply never matches.

**A contact's photo is filed under the contact.** An earlier design keyed it by the mailbox owner plus the folder plus the external id, which meant a contact created in Rocket.Chat could never have one, and forced the avatar route to derive that triple from a contact it had already loaded. Keying by contact id removes the derivation and the limitation together, and it is what a future link between a contact and a workspace user would need anyway. The cost moved to the sync, which crosses the external key a photo arrives under to the contact it belongs to, one query per folder and only when photo sync is enabled.

**A photo never arrives with its contact**, in either provider, and that is what makes avatars the expensive half of the sync. Everything else about a contact, categories included, comes in the same payload as the contact. The photo takes a second round trip: Graph reads `photo/$value` per contact, and EWS takes two, one `GetItem` to find the attachment marked `IsContactPhoto` and a `GetAttachment` to pull the bytes. That is why photo sync is a setting of its own rather than part of the contact read, and why turning it on changes the cost of a folder rather than adding to it at the margin.

Photos are streamed rather than collected: an earlier implementation asked for every attachment in a folder in a single request and held the result, which reached about a gigabyte on a large address book.

- ### NTLM is an accepted risk

Exchange on-premises with impersonation is reached over NTLM or Basic, and some deployments expose nothing else, so it is required rather than chosen. Kerberos is not implemented; adding it would be a third value of the auth method setting with its own configuration block, and it would not remove the need for NTLM. Hardened domains can refuse NTLM entirely through the "Network security: Restrict NTLM" policy, which MS-NLMP names as `STATUS_NTLM_BLOCKED`. That is a documented limitation of the on-premises path.

**MD4 and HMAC-MD5 are an accepted risk** on the same grounds. Both are mandated by MS-NLMP section 3.3.2, and a stronger hash produces a value the domain controller does not compute, so authentication fails. The citation is recorded in the source so scanner findings are not reopened on every pass.

**A workspace running in FIPS mode cannot use NTLM at all**, which follows from those same algorithms rather than from a policy we chose. The FIPS provider refuses MD4 and HMAC-MD5 outright, so the handshake is impossible rather than discouraged, and no setting changes that: MS-NLMP defines NTLMv2 over them. The transport refuses the combination when it is constructed, as `ntlm-unavailable`, so Test Connection names the cause instead of failing later inside the handshake with an OpenSSL error nobody can act on. Exchange Online is unaffected, since Graph is a bearer token over TLS and computes nothing itself.

Basic over HTTPS stays available there, and is the only method we offer in that deployment. Basic performs no cryptography of its own, so everything in play belongs to TLS and therefore to the validated provider. What it costs is that the service account password crosses the wire on every request rather than never, which is acceptable when TLS terminates at Exchange and is not when a load balancer terminates it, because that balancer then sees the credentials in clear. The same topology already decides whether Extended Protection can work, recorded under Known limitations.

A deployment that runs FIPS **and** has Basic disabled on the EWS virtual directory, which hardening guides routinely require, has no path we support today. Kerberos is the FIPS-approved alternative for on-premises Exchange and is out of scope, so this is a limit of the current scope rather than a defect to work around.

- ### The plaintext client secret is an accepted risk

Settings follow the existing convention rather than a bespoke encryption scheme, because the hard part is key management and a one-off would give administrators a false read on how the rest of the product behaves. The platform-wide direction is to make secrets read-none write-many, which supersedes anything this integration would have built for itself. The mitigation available today is reducing what the credential can reach, which is what `ApplicationAccessPolicy` scoping is for.

- ### Data retention

The integration stores users' calendar events and their personal contacts, with no per-user consent moment: enrollment follows from having a verified email that matches a mailbox. Because a workspace running this has to stay GDPR compliant, managing what was ingested is the integration's responsibility rather than the mailbox's: what is stored for a user has to be listable and removable on the Rocket.Chat side, so an erasure request is satisfied without depending on Exchange. The retention period itself is the workspace's policy, not a setting of the integration.

---

## Impact and Consequences

- ### The two providers share an abstraction, not a transport

| Concern             | Microsoft Graph                                           | EWS                                                        |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| Protocol            | REST over HTTPS, JSON                                     | SOAP over HTTPS, XML                                       |
| Authentication      | OAuth 2.0 client credentials                              | NTLMv2 with channel binding, or Basic                      |
| HTTP client         | `@rocket.chat/server-fetch`                               | Bespoke `https.Agent`                                      |
| Air-gap enforcement | `{ ignoreSsrfValidation: false, allowList: [...] }`       | `AllowlistedAgent.createConnection` refuses any other host |
| Calendar delta      | `calendarView/delta`, opaque `deltaLink`                  | `SyncFolderItems` as a probe, then a `CalendarView` snapshot |
| Cursor scope        | The requested window                                      | The calendar folder                                        |
| Page `coverage`     | always `'delta'`                                          | `'full'`, or `'partial'` when the snapshot ran out of pages |
| Calendar deletion   | `@removed`, or a series re-expansion that drops it        | Absence from a complete window snapshot                    |
| Recurrence          | Expanded, but occurrences arrive as stubs of their master | Expanded in full by `CalendarView`                         |
| Contact scope       | `default` plus each `contactFolder`                       | Each `IPF.Contact` folder under the contacts root          |
| Contact photos      | `photo/$value` per contact                                | `GetAttachment` on the `IsContactPhoto` file attachment    |
| Per-mailbox scoping | `ApplicationAccessPolicy`, configured on Microsoft's side | `ExchangeImpersonation` SOAP header                        |
| Credential          | Client secret, tenant-wide, reachable from the internet   | Service account, usually network restricted                |

Graph needs no custom HTTP agent, unlike its EWS sibling. It is a bearer token over ordinary HTTPS, so `server-fetch` handles it and we inherit its proxy support for free.

- ### What we take on permanently

The rejected library would have given us EWS timezone handling, and that is the part of hand-rolled EWS most likely to produce subtle bugs. Times wrong by an hour, twice a year, for some users, in some regions, is the worst class of defect to diagnose. We take it on deliberately, containing it by requesting UTC explicitly, pinning `RequestServerVersion`, and never inferring a timezone.

We also own XML namespace correctness and fault parsing permanently. The templates carry explicit `soap:`, `m:` and `t:` prefixes, and the tests that assert the generated XML are what keep them honest. Version drift as Subscription Edition receives updates becomes a failing test in the lab rather than a support ticket, provided the server version stays pinned.

We also own the recurrence reconciliation on the Graph side. Nothing about "a page carried this series in full" is enforced by the API; it is read from the presence of the master in the response. If Graph ever sends a changed occurrence without its master, the reconciliation would prune its siblings. The guard is that only a master present in the page counts, and that a run which stopped early prunes nothing, but the invariant is ours to keep.

---

## Known limitations

- **TLS offloading is unsupported by protocol.** If a load balancer terminates TLS and re-encrypts to Exchange, the certificate the client bound to is not the one Exchange compares against, and Extended Protection rejects the handshake. This is a documented Microsoft constraint of Extended Protection rather than a defect here, and it applies to any NTLM client in that topology. The deployment requirement is to pass TLS through to Exchange, or to disable Extended Protection. It is recorded from the protocol rather than reproduced in the lab, because the outcome is determined and the remedy is not ours. The failure surfaces as `authentication-failed`, which is indistinguishable from a wrong service account password, so support checks Extended Protection first when a load balancer is in the path.

- **A changed primary email orphans previously imported events.** Changing a user's email replaces the address rather than adding one. If the new address is unverified the user stops being a sync candidate, so nothing runs and nothing prunes, and the events from the previous mailbox remain. The user cannot remove them either, because they carry `source: 'outlook'` and the per-user delete refuses those outright. If the new address is verified, the next complete window read prunes what falls inside the window and leaves anything beyond it.

- **A deleted Graph occurrence is only noticed when its series is re-expanded.** Graph never reports an occurrence as removed, so the reconciliation depends on the master being resent. A page that stops early, on the page cap or a missing cursor, prunes nothing and leaves the stale occurrence until a later run completes.

- **Contact categories and photos cannot be set from the on-premises Outlook Web App.** Both are ordinary EWS writes, `item:Categories` through `UpdateItem` and a `ContactPicture.jpg` file attachment through `CreateAttachment`, and both work against Exchange 2019. What the on-premises OWA does not have is the interface for either, so a lab without Outlook desktop or a mobile ActiveSync client has to set them over raw SOAP. Exchange Server SE does not change this: SE RTM is code equivalent to Exchange 2019 CU15, so it ships the same OWA.

- **MD4 is not available from Node.** `crypto.createHash('md4')` throws on Node 22 with OpenSSL 3.5, because MD4 moved to the legacy provider. NTLM cannot work without it, so the module ships a pure JavaScript implementation pinned to the RFC 1320 appendix A.5 vectors plus the canonical NTLM hash of `password`. The desktop app never hit this because Electron bundles its own OpenSSL. Anything server-side does.

---

## Extras

- ### The channel binding insertion point

The binding hash goes into an AV_PAIR with identifier `0x000A` inside the NTLMv2 response blob **before that blob is hashed**, which is why it cannot be bolted on from outside a library.

MS-NLMP section 3.3.2 makes the ordering explicit. `ServerName`, which is the AV_PAIR list, sits inside `temp`, and `temp` is inside the HMAC that produces `NTProofStr`:

```
Set temp to ConcatenationOf(Responserversion, HiResponserversion, Z(6), Time,
                            ClientChallenge, Z(4), ServerName, Z(4))
Set NTProofStr to HMAC_MD5(ResponseKeyNT,
                            ConcatenationOf(CHALLENGE_MESSAGE.ServerChallenge, temp))
```

Extending the target info buffer with our AV_PAIR before the list terminator is enough. The existing code then sizes, copies and HMACs the blob correctly with no further change.

The hash algorithm is chosen from the certificate's own signature algorithm, per RFC 5929 section 4.1, except that MD5 and SHA-1 upgrade to SHA-256. RSASSA-PSS carries its hash in the algorithm parameters rather than in the OID, and those parameters are not inspected: a PSS certificate signed with SHA-384 or SHA-512 therefore computes the wrong binding. This is recorded rather than fixed, because a PSS-signed certificate for TLS server authentication is rare and the failure is visible as an authentication error.

- ### The weak algorithms are the specification, not a choice

`NTOWFv2` is defined by MS-NLMP section 3.3.2 as:

```
HMAC_MD5( MD4(UNICODE(Passwd)), UNICODE(ConcatenationOf( Uppercase(User), UserDom )) )
```

The specification's language is normative: the response keys **MUST** be encoded using these specific one-way functions. NTLMv2 uses them at three fixed points: MD4 derives the NT hash from the password, HMAC-MD5 derives the per-user response key from that hash, and HMAC-MD5 again computes the response proof over the server challenge. The domain controller recomputes the same values from its stored NT hash, so there is no version of this that uses a modern hash.

Worth noting for whoever reviews the scanner finding: the username in that expression sits in the HMAC's **message** position, not the key position. It acts as a domain separator so the same password on two accounts derives different keys. The secret is the NTLM hash, which is the key.

- ### Improvements made while vendoring

| Change                                                        | Why                                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Ported to TypeScript                                          | Consistency with the rest of the module                                                                             |
| Client nonce from `crypto.randomBytes`                        | Upstream used `Math.random`, which is not a cryptographically secure source and should never have been used for one |
| `new Buffer()` replaced with `Buffer.alloc` and `Buffer.from` | 17 uses of a deprecated API                                                                                         |
| NTLMv1 and DES paths removed                                  | See the decision above                                                                                              |
| MD4 from our own implementation                               | Node no longer provides it                                                                                          |
