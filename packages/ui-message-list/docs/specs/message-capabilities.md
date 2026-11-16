---
status: implemented
adrs: []
code:
  [
    src/Message/contexts,
    src/Message/content,
    src/Message/MessageContentBody.tsx,
    src/Message/MessageContentFallback.tsx,
    src/Message/IgnoredContent.tsx,
    src/Message/MessageCollapsible.tsx,
    src/Message/index.ts,
    apps/meteor/client/providers/MessagesProvider,
  ]
tests:
  [
    src/Message/contexts/contexts.spec.tsx,
    src/index.spec.ts,
    src/Message/MessageContentBody.spec.tsx,
    src/Message/content/Reactions.spec.tsx,
    src/Message/content/UrlPreviews.spec.tsx,
    src/Message/content/Location.spec.tsx,
    src/Message/content/MessageActions.spec.tsx,
    src/Message/content/ThreadMetrics.spec.tsx,
    src/Message/content/Metrics.spec.tsx,
    src/Message/content/actions/MessageAction.spec.tsx,
    src/Message/hooks/useCollapse.spec.tsx,
    apps/meteor/client/providers/MessagesProvider/MessagesProvider.spec.tsx,
    apps/meteor/client/providers/MessagesProvider/actions/useToggleReactionMutation.spec.ts,
    apps/meteor/client/views/room/modals/PinMessageModal/PinMessageModal.spec.tsx,
    apps/meteor/client/views/room/composer/messageBox/MessageBoxReply.spec.tsx,
    apps/meteor/client/views/audit/components/AuditMessageList.spec.tsx,
    apps/meteor/client/views/audit/components/AuditMessageList.display.spec.tsx,
    apps/meteor/client/views/room/modals/PinMessageModal/PinMessageModal.display.spec.tsx,
    apps/meteor/client/views/room/contextualBar/Threads/ThreadList.display.spec.tsx,
    apps/meteor/client/providers/MessagesProvider/MessageVariants.contexts.spec.tsx,
  ]
---

# Spec: Message capabilities and non-attachment message content

## Summary

The package's message components receive everything they need from the app through ten
intent-named React contexts, each with a default that works without a provider, and render
the non-attachment content of a message: markdown body, fallback and ignored content,
reactions, URL previews, a shared location, action links, thread, discussion and broadcast
metrics, and collapsible parts. `apps/meteor` supplies the contexts from one provider,
`MessagesProvider`, mounted wherever messages are shown, and renders the package's content
parts from its own message variants.

## Motivation

See [the intent](../intents/message-capabilities.md). The app's message components read the
app directly, so they cannot be rendered or tested outside it, and the package cannot yet
render any conversation.

## Behaviour

**Contexts and their defaults**

- **R1** Each of the ten message contexts (display, navigation, interactions, toolbar,
  renderers, related data, content, media, selection, editing) MUST have a default value, so
  a message component rendered with no provider renders without throwing and without
  calling anything outside the package.
- **R2** The display default MUST turn every optional presentation off (roles, real names,
  usernames, colors, read receipts, embeds, highlights, KaTeX) and MUST allow interaction.
- **R3** The default of every navigation and interaction capability that acts on the app
  MUST do nothing, except the default `hasReacted`, `canDelete`, `getPermalink` and
  `openExternalLink`, which MUST answer "no", "no", a `#<id>` link and a new `noopener`
  window respectively.
- **R4** The default content context MUST return a message with its source text as a single
  plain paragraph when the message has no parsed markdown, and the default renderers MUST
  draw markdown, previews, UiKit blocks and emoji as light stand-ins.
- **R5** The media default MUST format a byte count with binary units (`1 KB` is 1024 bytes)
  and MUST keep downloads of encrypted files allowed.
- **R6** The package MUST export the contexts, their value types, their `use*` hooks, the
  `MessageActionConfig` types and `createMessageSelectionStore`.
- **R7** A selection store passed to the selection context MUST be what
  `useIsSelectingMessages`, `useIsMessageSelected` and `useToggleMessageSelection` read and
  change; with no store, nothing is selecting and nothing is selected.

**Content: body**

- **R8** `MessageContentBody` MUST render the markdown of a message through the renderers
  context, inside an element with role `document` whose role description is the translation of `message_body`.
- **R9** `MessageContentFallback` MUST render the translated "message could not be displayed"
  text, with the id it is given.
- **R10** `IgnoredContent` MUST render a button named by the translation of `Message_Ignored`
  that calls `onShowMessageIgnored` once, on click and on Enter, without the click reaching
  the message around it.

**Content: reactions**

- **R11** `MessageReactionList` MUST show one reaction per emoji of the message with its
  emoji and count, plus an add-reaction button named by the translation of `Add_Reaction`.
- **R12** Activating a reaction MUST call `toggleReaction` with the message and the emoji
  name; the button that adds a reaction MUST call `openReactionPicker` with the message.
- **R13** A reaction MUST be shown as pressed according to `hasReacted` for that emoji.
- **R14** A reaction's tooltip MUST list the people who reacted, as usernames, or as real
  names when real names are on, without fetching the message when it needs no more than
  usernames. Someone who reacted after the tooltip was last shown MUST be listed, with their
  real name when real names are on, the next time it is shown, also when that person had already
  reacted with another emoji of the message.

**Content: previews, location and actions**

- **R15** `MessageUrlPreviews` MUST show the page metadata of a URL as a link preview, resolve
  a relative preview image against the page origin, and skip a URL that has neither metadata
  nor a media content type. The link around a link preview's cover image MUST be named by the page's
  title, or by its URL when the page has no title; the app's cover link had no name before.
- **R16** A media URL preview MUST be collapsible by the viewer.
- **R17** `MessageLocation` MUST link to the shared location, and MUST render nothing when
  the message has no coordinates.
- **R18** `MessageActionLinks` MUST render one button per action, and clicking one MUST call
  `runActionLink` with the message and the action's method id.

**Content: metrics**

- **R19** `MessageThreadMetrics` MUST show the reply count, the participants, the time of
  the last reply and a reply button that is primary while the thread has unread replies and
  secondary once read, for a large and a small variant.
- **R20** `MessageThreadMetricsFollow` MUST show followed or not followed and call
  `followThread` or `unfollowThread` when activated; `MessageThreadMetricsUnreadBadge` MUST
  show the unread, the mention-all and the "mentions you" states;
  `MessageThreadMetricsParticipants` MUST show up to two avatars with a `+N` count of the
  others, or a user icon with the follower count when there are no avatars to show.
- **R21** `MessageDiscussionMetrics` MUST open the discussion room when activated and MUST
  invite a reply when the discussion is empty.
- **R22** `MessageBroadcastMetrics` MUST call `replyBroadcast` with the message when its reply
  button is activated.
- **R23** `MessageCollapsible` MUST hide and show its content from its toggle, starting from
  the state the viewer's preference asks for, and the state MUST be remembered across
  mounts by the provider of the related-data context when one keys it.

**Content: accessibility and exports**

- **R24** Every story of the content parts MUST pass an axe check with no violations.
- **R25** The package MUST export the content parts under the `Message`-prefixed names
  `MessageLocation`, `MessageReactionList`, `MessageActionLinks`, `MessageUrlPreviews`,
  `MessageThreadMetrics`, `MessageThreadMetricsFollow`, `MessageThreadMetricsParticipants`,
  `MessageThreadMetricsUnreadBadge`, `MessageDiscussionMetrics`, `MessageBroadcastMetrics`
  and `MessageCollapsible`, and `MessageContentBody`, `MessageContentFallback` and
  `IgnoredContent` under their own names.

**The app's provider**

- **R26** `MessagesProvider` MUST give the display context the app's settings and the
  viewer's preferences (roles, real name, username, colors, avatars, read receipts, embeds,
  highlight words, KaTeX, auto-link domains, date and time formats), and MUST set
  `allowsInteraction` from its prop, true by default.
- **R27** `MessagesProvider` MUST turn a message into what is displayed with the viewer's
  parsing options and the conversation's translations, parsing a given message object once
  per options, and MUST describe an emoji as the app renders it, naming no sprite for an emoji
  the app cannot render.
- **R28** `MessagesProvider` MUST carry out the interactions through the app: reacting through
  `chat.react` only for a logged-in viewer, and opening the reaction picker only for one;
  quoting, replying, sending and replying to a broadcast through the room's chat where one is open;
  following and unfollowing a thread, with an error toast when it fails; opening the forward modal;
  and opening the reaction picker with a way to learn that it closed, which it reports also when it could not open.
  The interactions context offers these and no capability the package does not read (`thread-message-list` R53); the menu
  entries of the toolbar (pin, star, mark unread, translate, edit, delete, report, reactions, read receipts, discussions) are carried
  out by the app's own action hooks (`message-toolbar` R24).
- **R29** `MessagesProvider` MUST route navigation through the app's router: open a room, open
  a thread, jump to a message, resolve a permalink, open a direct message, run an action
  link and open an external link.
- **R30** `MessagesProvider` MUST give the renderers context the app's markdown, markdown
  preview, UiKit message block and emoji components.
- **R31** `MessagesProvider` MUST provide the selection it is given and no selection when it is
  given none, so a place without a selection never joins the room's.
- **R32** The app MUST mount `MessagesProvider` in every place that renders message parts:
  the room's list, a thread's list, the pinned, starred and mentions tab, search, the
  threads list, audit, moderation's reported messages, contact history, the forward, pin and
  report modals and the composer's quote; the read-only ones MUST pass
  `allowsInteraction={false}`.
- ~~**R33** Wherever the app's old list context is provided, the display context MUST be
  provided from the same settings, so the highlight words and the real-name preference that
  `GazzodownText` reads agree with the list around it.~~ Retired: [message-variants](message-variants.md) deletes the old
  list context, so there is nothing left to agree with.

**Messages in the app**

- **R34** The message variants (the app's, and the package's since [message-variants](message-variants.md)) MUST render the body, ignored content, fallback,
  reactions, URL previews, location, action links and the thread, discussion and broadcast
  metrics with the package's components, and a message MUST look and behave as it did
  before, except where R15 and R36 to R40 name: markdown with mentions, channels, highlights, KaTeX,
  emoji and colors; reactions that add, remove and name who reacted; link previews; action
  links; thread metrics with follow and unread; discussion metrics; broadcast replies.
- ~~**R35** The app MUST NOT keep its own copy of a content part the package provides, or of a
  hook that only those copies used.~~ Retired: it is not observable from outside the package.
  The plan carries it as a step of the work.

**Read-only places and the threads list follow the viewer's display settings** (a deliberate change,
decided by the user at review: before, these places read the old list context's defaults, which were
empty or off, or mounted no provider)

- **R36** In the audit, in moderation's reported messages, in contact history, in the forward, pin
  and report modals, in the composer's quote and in the threads list's previews, a message body
  MUST highlight the viewer's highlight words. Where the place passes the message's mentions (audit,
  moderation, contact history), a user mention MUST show the real name the message carries when the
  viewer's `UI_Use_Real_Name` setting is on. The modals and the quote pass no mentions and show
  usernames; the threads list's previews resolve no mentions.
- **R37** The audit MUST show a message that has no stored markdown parsed with the viewer's hex
  color and KaTeX settings. Its custom auto-link domains were already applied by the base.
  Moderation, contact history, the modals and the quote show stored markdown or plain text, so
  these options do not apply to them.
- **R38** The audit, moderation's reported messages, contact history and the forward modal MUST
  apply the viewer's attachment preferences (collapse media by default, load media automatically,
  save mobile bandwidth) to the attachments they show, size them at most 360 by 360 and resolve
  their URLs against the site URL, the CDN prefix and the path prefix of the server, as the lists
  do. Before, they mounted no attachment provider: attachments were sized 368 by 368, took no
  preference and kept their URLs as they came, without the path prefix, which a server under a
  sub-path could not serve. The pin modal and the composer's quote already did all of this; the
  report modal shows no attachments.
- **R39** In the threads list, a preview MUST show the thread's main message as markdown without
  resolving its mentions, and the follow button's name MUST be the followed or not-followed state
  alone; the unread state shows as the badge beside the button, as before.
- **R40** The app's room message MUST NOT show the thread metrics of a thread's main message where
  the place does not allow interaction, even when a chat is open there. Rooms and threads show them
  as before.

## Design

The package owns the ten contexts (`src/Message/contexts`). Each is a value type, a default, a
provider-less hook and a `use*` accessor, so a component asks for an intent and the default keeps it
working in stories and jsdom. Content parts read only those contexts, the packages the package may
depend on (`ui-client`, `ui-contexts`, `core-typings`, `message-parser`) and their own props.

The app owns `MessagesProvider` (`apps/meteor/client/providers/MessagesProvider`). One `use*Value`
hook per context builds its value from the app: settings and preferences for display, the router for
navigation, the chat, modals, mutations and the REST API for interactions, stores and queries for
related data, the parser and the translations for content, and gazzodown, UiKit and emoji for the
renderers. A message fetched by id takes a revision of what the caller reads from it, and a copy fetched for another
revision is not reused, so what the app caches never outlives what is shown. The editing value is not built
yet and keeps its default; the media value is built, see [message-attachments](message-attachments.md), and
so is the toolbar's, see [message-toolbar](message-toolbar.md).

The lists mount `MessagesProvider` with the room and subscription they already have; the places outside the
lists mount their own, read-only ones with `allowsInteraction={false}`. The variants and attachments read the
package's content parts (the variants are the package's since [message-variants](message-variants.md)). The app's copies are gone; the
collapsible parts, the collapse hooks, the download and size files and the location map went with
the attachments (see [message-attachments](message-attachments.md)).

Notes for later branches:

- `display.showUsername` is only "the viewer does not hide usernames". The old `getAuthorUsername`
  conditions (real names on, and the name differing from the username) belong to the parts that show a
  name, which [message-variants](message-variants.md) R12 states and `getAuthorUsername` carries out.
- The exported `MessageCollapsible` with `hasDownload` on an encrypted link downloads through the
  media context, which the app provides from `MessagesProvider` since
  [message-attachments](message-attachments.md).

## Out of scope

- Attachments, including quotes, files and the media value of the provider: a later
  capability. The media context keeps its default, which no content part here needs beyond
  the file size and download controls the collapsible shows.
- ~~The toolbar and its actions: the toolbar context keeps its default until the toolbar
  arrives.~~ Done by [message-toolbar](message-toolbar.md).
- ~~The message variants, their header, avatar and status parts, and the editing context: the
  app's variants stay and read the app's own editing state.~~ Done by [message-variants](message-variants.md).
- The list, scrolling and virtualization.

## Known defects

None.

## Open questions

- **Q1** Whether the media context is provided by the app in this round, or stays at its
  default until attachments arrive. Assumed: it stays at its default (see Out of scope). Answered
  later: the app provides it (message-attachments R14 to R20).
- **Q2** Whether the selection and editing contexts are provided by the app in this round.
  Assumed: the selection adapter `messageSelectionFromStore` and the provider's `selection` prop
  exist (R31), but no mount passes a selection and only the spec uses the adapter until the
  variants arrive; editing is not provided. Answered later: the app provides both, the room's
  selection to the room's list, tabs and search and the editing context from the store that jumps and
  editing write to ([message-variants](message-variants.md) R47, R48).
- **Q3** Where the download and size controls the collapsible needs live while attachments
  are absent. Assumed: with the collapsible, in the package's attachment structure folder.
- **Q4** Whether the threads list switches to the package parts in this round. Assumed: yes
  (R32, R34).

## References

- [Intent](../intents/message-capabilities.md)
- WCAG 2.1 AA, for R24 (a package decision for how it is checked: axe over the stories)
