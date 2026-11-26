# Outlook server-to-server integration

## What the feature does

Rocket.Chat can already show a user their Outlook calendar, but only if that user signs in to Exchange
themselves, from the Rocket.Chat Desktop App, with their own credentials. Coverage is therefore whatever
each person happened to do. Someone who never opened that dialog has no calendar, no busy status and no
meeting reminders.

Three limits come with that model, and the first two are not gaps but walls:

- **It is the desktop app only.** Someone who works from the browser or the phone has no way to connect
  their calendar at all, and sees only whatever their own desktop app has already brought in.
- **Each user has to type their domain username and password into it.** Plenty of managed fleets cannot
  do that: people sign in with single sign-on or a smart card and do not know their own password, or
  policy forbids entering domain credentials in anything but Windows itself.
- **Microsoft 365 workspaces are out.** The desktop app authenticates the way an on-premises Exchange
  Server expects, which Exchange Online no longer accepts.

This integration replaces the per-user sign-in with **one connection an administrator configures once**.
The workspace holds the credentials, Exchange is read on behalf of each user, and nobody is ever asked to
authenticate to Outlook again.

One connection then serves two different things, which is why they are built together rather than as two
integrations:

- **Calendars**, so the calendar panel lists a user's meetings for the day and their status turns to busy
  while one is running, without that user signing in anywhere. The sync keeps a window that covers today
  and tomorrow by default, so the next day is already there before anyone asks for it. An administrator
  can widen it to a week.
- **Personal contacts**, so an incoming call from an external number can be matched to a name instead of
  ringing as a bare phone number. Contacts are a feature of Rocket.Chat in their own right: a user can
  create, edit and delete their own, and that works with or without Exchange. What this integration adds
  on top is the Outlook address book, **read only**. Synced contacts can be searched and called like any
  other, but they are changed in Outlook, not here.

## What an administrator sees

Everything lives under **Admin → Outlook Calendar**, in a settings card named **Microsoft Exchange**. It
requires a premium license that includes the `outlook-calendar` module.

1. **Pick the mode.** `Legacy` keeps today's behaviour, where each user signs in from the desktop app.
   `Server-to-server` switches to the admin-configured connection.
2. **Pick where Exchange lives.** `Exchange Online (Microsoft Graph)` for Microsoft 365, or
   `Exchange on-premises (EWS)` for an Exchange Server the organisation runs itself. The fields change
   with the choice, so only the ones that apply to that world are shown.
3. **Fill in the credentials, and grant them the access they need.** This is the part that is done on
   Microsoft's side rather than here, and the connection cannot work until it is.
   - **Graph**: the tenant, client id and client secret of an app registration in Microsoft Entra ID. It
     needs **application** permissions with admin consent, not delegated ones, because it reads mailboxes
     with no user present: `Calendars.Read` for calendars and `Contacts.Read` for contacts. An app-only
     credential reaches every mailbox in the tenant by default, so narrow it to the intended ones with an
     **application access policy**.
   - **EWS**: the endpoint URL, a service account and its authentication method, and optionally the
     certificate of a private certificate authority. The service account needs the
     **ApplicationImpersonation** role, scoped to the mailboxes it should reach, because it reads each
     user's mailbox on their behalf rather than its own.
4. **Press Test connection.** It reports what is wrong in the admin's terms: credentials rejected,
   settings incomplete, the endpoint not reachable, impersonation not granted. It does not report success
   until a complete round trip has happened.

After that there is nothing per user to do. Every user whose verified Rocket.Chat email address matches a
mailbox is covered from the next sync onwards.

### Who gets synced

A user is included when their Rocket.Chat email address is **verified** and names their Exchange mailbox.
Users without a verified address are skipped and counted, never treated as a failure of the run, so one
unmappable account cannot stop the sync for everyone else.

## What a user sees

Nothing to set up, which is the point.

- **The calendar bar lists their meetings**, including ones that already happened earlier today, and keeps
  up as meetings are added, moved or cancelled in Outlook. A meeting deleted in Outlook disappears here.
- **Their status turns busy while a meeting is running**, and goes back on its own when it ends. A meeting
  marked Free in Outlook does not make them busy.
- **Reminders arrive** for upcoming meetings, if they have calendar notifications enabled.
- **No Outlook sign-in is ever requested.** In server-to-server mode the desktop app stops offering it,
  because the workspace no longer needs anything from the user to read their calendar.
- **An unknown number resolves to a name.** When a call comes in from a number saved in their Outlook
  contacts, the caller shows as that person, and the call history shows names instead of digits.
- **Their Outlook contacts are searchable in Rocket.Chat**, alongside contacts they create by hand here.

Contacts are **private to each user**. A person's Outlook contacts are visible only to them: nothing is
shared across the workspace, and no administrator view of them exists.

## What does not change

- **Events a user created in Rocket.Chat are never touched** by any of this. They stay editable and
  deletable as before.
- **The legacy desktop integration keeps working** for workspaces that stay in `Legacy` mode. Switching
  modes is the only thing that decides which one is in charge, and the two can never both write.
- **Events that came from Outlook cannot be edited or deleted in Rocket.Chat.** The sync owns them: it
  re-reads the window on every run, so an edit would silently revert and a deletion would come straight
  back. They are changed in Outlook.

## What ships when

| Phase | What it adds | What a user notices |
| --- | --- | --- |
| 1 | The connection itself: both providers, the admin settings, Test connection | Nothing yet. Only an administrator sees anything, and only the connection test |
| 2 | Calendar sync, on a schedule and on demand, and busy presence | Meetings and busy status appear without signing in |
| 3 | Personal contacts, the contacts list, caller identification | Incoming calls and call history show names, contacts become searchable |

## Two worlds, two mechanisms

The integration speaks to Exchange two different ways because there is no single way that works
everywhere, and an administrator does not get to choose which one applies:

- **Exchange Online** must be Microsoft Graph. Microsoft begins disabling EWS for Exchange Online on
  1 October 2026 and retires it permanently on 1 April 2027.
- **Exchange Server on-premises** has no Graph at all, so it must be EWS, which stays supported and is not
  affected by that retirement.

For an air-gapped deployment the on-premises path carries a guarantee worth stating plainly: **when the
EWS provider is selected, the integration never attempts to reach any Microsoft cloud endpoint.** Not for
telemetry, not to check whether something is reachable. It is enforced where connections are opened, not
left as an intention.

## Limits worth knowing

- **A workspace running in FIPS mode cannot use NTLM**, because the algorithms the protocol requires are
  not approved there. Basic authentication over HTTPS remains, if the Exchange server accepts it.
- **Only the user's default calendar is read.** A secondary calendar they created, or a subscribed one, is
  out of scope. Contacts, by contrast, are read from every address book the user has.
- **Past events are kept on purpose** and are not removed when they fall out of the sync window.

## Where the decisions are written down

Why there are two providers, how each one detects what changed, why EWS is spoken without a SOAP library,
how channel binding is implemented and what is deliberately accepted as a risk are all recorded in
[ADR 0008](../adr/0008-outlook-server-to-server-integration.md).
