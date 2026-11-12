# Plan: Message capabilities and non-attachment message content (from specs/message-capabilities.md, 2026-11-12)

Status: approved.

The package half is copied from the frozen reference (`message-list-ref`): contexts and test
helper from `a7d7c91b0e0`, content parts from `e9f081a1aca`, provider from `78155034d47`, each at
the reference's tip. The app half is adapted to the base: the old list and variants stay, so the
provider is added beside the old list context and the variants switch to the package parts.
`useMergedRefsV2` is not involved. `develop`'s behaviour wins where it differs from the
reference (auto-link domains from the setting, `hideUsernames`, the base's `MessageHeader`).

## Files that change

Package `packages/ui-message-list`:

- `package.json`, `yarn.lock`: dependencies, added in the commit whose code imports them.
- `src/Message/contexts/**`: new, the ten contexts, `MessageAction` types and the fake renderers.
- `tests/utils/mockMessageProviders.tsx`: new, wraps a component in every context with spies.
- `src/Message/contexts/contexts.spec.tsx`: new, proves the defaults and the selection store.
- `src/Message/MessageContentBody.tsx`, `MessageContentFallback.tsx`, `IgnoredContent.tsx`,
  `MessageCollapsible.tsx`, `MessageContentBody.spec.tsx` (new spec): body parts.
- `src/Message/content/**` except `attachments/`: reactions, URL previews, location, action
  links, metrics, collapsible content, their stories and specs.
- `src/Message/content/attachments/structure/{AttachmentDownload,AttachmentDownloadBase,
AttachmentEncryptedDownload,AttachmentSize,AttachmentTitle}.tsx`: the collapsible's download and
  size controls (Q3); the rest of the folder arrives with attachments.
- `src/Message/hooks/{useCollapse,useOembedLayout}.ts`, `lib/{buildImageURL,isValidLink,
normalizeUsername}.ts`: what the parts use. `normalizeUsername` is used by the reaction tooltip.
- `src/Message/index.ts`, `src/index.ts`, `src/index.spec.ts` (new): exports.

`packages/mock-providers`: `src/fixtures/{createFakeMessage,sequence,index}.ts`, `src/index.ts`,
`src/tests/fixtures.spec.ts`, `package.json`: the message fixture the specs and stories use.

App `apps/meteor`:

- `package.json`, `vite/vite.config.mts`, `yarn.lock`: the package dependency.
- `client/providers/MessagesProvider/{MessagesProvider.tsx,index.ts,
messageSelectionFromStore.ts,normalizeMessage.ts,useMessage{Display,Navigation,Interactions,
RelatedData,Content}Value.ts*}`, `renderers/{MessageMarkup,MessagePreviewMarkup}.tsx`,
  `MessagesProvider.spec.tsx`: new. No `useMessageToolbarValue`, no `useMessageMediaValue`, no
  editing value (Out of scope).
- `client/components/message/hooks/useNormalizedMessage.ts`: uses `normalizeMessage`; from the mounting
  step it reads the content context, and the switch step stops calling it (deleted with the copies).
- `client/components/GazzodownText.tsx`, `GazzodownText.spec.tsx`: read highlights and real names
  from the display context.
- `client/views/room/MessageList/providers/MessageListProvider.tsx`: also provides the display
  context (R33); `MessageListProvider.spec.tsx` new.
- Mount points (R32): `views/room/MessageList/MessageList.tsx`, `contextualBar/Threads/components/ThreadMessageList.tsx`,
  `contextualBar/Threads/ThreadList.tsx`, `contextualBar/MessageListTab.tsx`,
  `contextualBar/MessageSearchTab/MessageSearchTab.tsx`, `views/audit/components/AuditMessageList.tsx`,
  `views/admin/moderation/UserMessages.tsx`,
  `views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx`,
  `views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx`,
  `views/room/modals/{ForwardMessageModal,PinMessageModal,ReportMessageModal}`,
  `views/room/composer/messageBox/MessageBoxReply.tsx`. The lists reach it through
  `MessageListProvider`.
- `client/components/message/variants/**`: render the package parts.
- Deleted: the app's copies of the content parts and the hooks only they used. `useMessageBroadcast` and
  `useOembedLayout` stay: the variants still use them.
- The spec and this plan (Design, `code`, `tests`, status) are last.

## Order of work

Each step is one commit and builds and passes on its own.

1. Enabling: `createFakeMessage` in mock-providers, with its spec. No requirement; the specs of
   step 3 need it.
2. Package, contexts (R1 to R7): copy `contexts/**` and `mockMessageProviders`, add `contexts.spec.tsx`
   and `src/index.spec.ts` (R6), export from `src/Message/index.ts`. Dependencies: `core-typings`,
   `message-parser`, `icons`, `ui-contexts`, `mock-providers` (dev) and the test tooling.
3. Package, content (R8 to R25): copy the body parts, `content/**` without `attachments/` and the
   five download/size controls, hooks and libs; add `MessageContentBody.spec.tsx` (R8 to R10); name
   each existing spec test with its `(R<n>)`; export under the prefixed names. Dependencies added here:
   `fuselage`, `fuselage-hooks`, `ui-client`, `ui-avatar`, `react-query`, `@react-aria/toolbar`,
   `dompurify`.
4. App, enabling refactor: extract `normalizeMessage` from `useNormalizedMessage`. Behaviour unchanged.
5. App, the provider (R26 to R31, R33): add the dependency, the vite entry, `MessagesProvider` with
   its value hooks, renderers and selection adapter, the display bridge in `MessageListProvider`,
   and `GazzodownText` reading the display context. Extend `MessagesProvider.spec.tsx` to navigation,
   content and renderers, and add the `MessageListProvider` agreement spec.
6. App, mounting (R32, R36 to R39): mount the provider at every place in the spec; the read-only ones pass
   `allowsInteraction={false}`; `useNormalizedMessage` reads the content context, so the audit parses
   with the viewer's options. A changeset records the read-only look.
7. App, switch and delete (R34; it also carries the retired R35): the variants, the threads list and the outside consumers of
   `MessageContentBody`, `ThreadMetrics*` and `MessageCollapsible` read the package parts; delete the
   app's copies and the hooks nothing uses, `useNormalizedMessage` among them. What the app's attachments still import (`Action`,
   `CollapsibleContent`, `MessageCollapsible`, `useCollapse`, `useIsCollapsibleToggled`,
   `location/*`, which the share-location modal also imports) stays until attachments arrive. Split into several commits if one
   is too large to review. Done when no file in the app still carries a copy of a content part the
   package provides, except what the app's attachments and the share-location modal import; the
   meteor typecheck and a search of `components/message` show it. This is not a requirement: it
   is not observable from outside the package.
8. Docs: spec Design, `code`, `tests`, status; plan `done`.

## Risks

- The two lists of display settings (old list context, new display value) could drift: R33 and its
  spec compare them. `hideUsernames` and highlights are the fields to watch.
- `GazzodownText` now reads the display context: a place that renders markdown without any provider
  loses highlights and real names it never had. R32 lists the places.
- The package's `MessageContentBody` has no fallback when the provider is missing; the fake
  renderer shows plain text. Every place that renders message markdown must be under a provider.
- The app's attachments keep rendering through the app's collapsible until attachments arrive; if
  work stops after step 7 both copies of a few small parts exist.
- The interactions value wires the toolbar's mutations although the toolbar value is not provided
  yet; they are unused until the toolbar arrives.
- A part of R34 (look and behaviour) cannot be proven in jsdom: manual check in a room.

## Proof

| Requirement | Proven by                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1          | `src/Message/contexts/contexts.spec.tsx`, "renders every context default without a provider (R1)"                                                                                                   |
| R2          | `src/Message/contexts/contexts.spec.tsx`, "turns presentation off and allows interaction by default (R2)"                                                                                           |
| R3          | `src/Message/contexts/contexts.spec.tsx`, "keeps app-acting capabilities inert by default (R3)"                                                                                                     |
| R4          | `src/Message/contexts/contexts.spec.tsx`, "normalizes a plain message into one paragraph by default (R4)"                                                                                           |
| R5          | `src/Message/contexts/contexts.spec.tsx`, "formats file sizes in binary units by default (R5)"                                                                                                      |
| R6          | `src/index.spec.ts`, "exports the contexts and hooks (R6)"                                                                                                                                          |
| R7          | `src/Message/contexts/contexts.spec.tsx`, "reads and toggles the selection store (R7)"                                                                                                              |
| R8          | `src/Message/MessageContentBody.spec.tsx`, "renders markdown through the renderers context (R8)"                                                                                                    |
| R9          | `src/Message/MessageContentBody.spec.tsx`, "renders the fallback text with its id (R9)"                                                                                                             |
| R10         | `src/Message/MessageContentBody.spec.tsx`, "reveals ignored content on click and Enter (R10)"                                                                                                       |
| R11         | `src/Message/content/Reactions.spec.tsx`, "should show each reaction with its emoji and count (R11)"                                                                                                |
| R12         | `src/Message/content/Reactions.spec.tsx`, "should toggle a reaction through toggleReaction (R12)", "should open the reaction picker for the message (R12)"                                          |
| R13         | `src/Message/content/Reactions.spec.tsx`, "should ask whether the viewer reacted with each reaction (R13)"                                                                                          |
| R14         | `src/Message/content/Reactions.spec.tsx`, the two `ReactionTooltip` tests (R14)                                                                                                                     |
| R15         | `src/Message/content/UrlPreviews.spec.tsx`, the first three tests and "names a link preview by its title, or by its URL when the page has none (R15)"                                               |
| R16         | `src/Message/content/UrlPreviews.spec.tsx`, "should collapse a media preview on demand (R16)"                                                                                                       |
| R17         | `src/Message/content/Location.spec.tsx`, both tests (R17)                                                                                                                                           |
| R18         | `src/Message/content/MessageActions.spec.tsx`, "should run the action link of the clicked button (R18)"                                                                                             |
| R19         | `src/Message/content/ThreadMetrics.spec.tsx`, "Main component" and "Reply button" tests (R19)                                                                                                       |
| R20         | `src/Message/content/ThreadMetrics.spec.tsx`, the follow, unread badge and participants tests (R20)                                                                                                 |
| R21         | `src/Message/content/Metrics.spec.tsx`, the two discussion tests (R21)                                                                                                                              |
| R22         | `src/Message/content/Metrics.spec.tsx`, "should reply to a broadcast message through replyBroadcast (R22)"                                                                                          |
| R23         | `src/Message/hooks/useCollapse.spec.tsx`, the four tests (R23)                                                                                                                                      |
| R24         | the `stories` axe test of every content spec, "(R24)"                                                                                                                                               |
| R25         | `src/index.spec.ts`, "exports the content parts under their prefixed names (R25)"                                                                                                                   |
| R26         | `apps/meteor/client/providers/MessagesProvider/MessagesProvider.spec.tsx`, "display" tests (R26)                                                                                                    |
| R27         | same file, "content" tests (R27)                                                                                                                                                                    |
| R28         | same file, "interactions" tests (R28)                                                                                                                                                               |
| R29         | same file, "navigation" tests (R29)                                                                                                                                                                 |
| R30         | same file, "renderers" test (R30)                                                                                                                                                                   |
| R31         | same file, "selection" tests (R31)                                                                                                                                                                  |
| R32         | not testable in jsdom without rendering every screen: the meteor typecheck for the required props, `ThreadList.spec.tsx`, and the manual check                                                      |
| R33         | `apps/meteor/client/views/room/MessageList/providers/MessageListProvider.spec.tsx`, "agrees with the display context (R33)"                                                                         |
| R34         | the app's variant specs (`RoomMessage.spec.tsx`, `SystemMessage.spec.tsx`, `ThreadMessage.spec.tsx`) and the manual check; look and behaviour need a browser                                        |
| R36         | `AuditMessageList.display.spec.tsx` (highlight and real name), `PinMessageModal.display.spec.tsx` and `ThreadList.display.spec.tsx` (highlight), (R36); the other places by the manual check        |
| R37         | `AuditMessageList.display.spec.tsx`, "parses a message without stored markdown with the viewer's hex color setting (R37)" and "... KaTeX setting (R37)"                                             |
| R38         | `AuditMessageList.display.spec.tsx`, "gives attachments the viewer's preferences (R38)" and "sizes attachments and resolves their URLs as the lists do (R38)"; the other places by the manual check |
| R39         | `ThreadList.display.spec.tsx`, "shows a preview without resolving mentions (R39)" and "names the follow button by the followed state alone (R39)"                                                   |
| R40         | `apps/meteor/client/components/message/variants/RoomMessage.contexts.spec.tsx`, "shows the metrics of a thread when interaction is allowed and hides them when it is not (R40)"                     |
