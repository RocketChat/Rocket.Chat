# Proposal: enforce the Fuselage spacing scale

## Status

Proposal. Measured on `develop` at `a39b03fe5c`.

## Problem

The design system's spacing scale is `x4`, `x8`, `x12`, `x16`, `x20`, `x24`, `x32` and `x40`. The code does not know about it:

- `fuselage-tokens` has no spacing tokens.
- `spacing()` in `packages/fuselage/src/styleTokens.ts` accepts any `x<n>` through a regular expression, plus any number, read as pixels.
- The margin, padding and gap props of `Box`, `Margins` and every component typed with `BoxProps` are typed `CSSProperties[...]`, so TypeScript accepts any value.

Two consequences:

- **Anything passes.** Typos and off-scale values (`x10`, `padding={10}`) reach production unnoticed.
- **The scale can't be reused as data.** A Tamagui config, a React Native port or a lint rule has nothing to read. The Tamagui pilot had to declare about 400 `x<n>` tokens, each injected as a `:root` custom property, instead of 8.

## Scope

- **In scope:** spacing, meaning `margin*`, `padding*`, `gap`, `rowGap` and `columnGap` on Fuselage components, plus the `Margins` props `all`, `block`, `inline`, `blockStart`, `blockEnd`, `inlineStart` and `inlineEnd`.
- **Not spacing tokens:** sizes (`width`, `height`, `size`, `min*`, `max*`) and `inset*`. They use `x<n>` today (827 uses, 68 distinct values), but those are arbitrary dimensions. The plan turns them into plain pixel values.
- **Allowed besides the scale:** `0`, `'0'`, `'none'` and `'auto'`, plus the negative forms of the scale (`neg-x4`, `-x4`, `-4`).

## What the code uses today

Literal values found by an AST scan of `apps/`, `ee/` and `packages/`. The scan covers JSX props on capitalized components, ternary and `||` branches, and `spacing()` calls.

| | Count |
|---|---|
| Spacing literals | 1,383 |
| On the scale (or zero) | 1,268 |
| ↳ written as tokens (`'x8'`) | 167 |
| ↳ written as numbers (`8`) | 1,043 |
| ↳ zero | 58 |
| **Off the scale** | **115** (108 in apps and other packages, 7 in Fuselage, 4 of those in stories and specs) |
| ↳ written as tokens | 6 |
| ↳ written as numbers or `px` strings | 109 |

Off-scale values by frequency: 2px 40, 10px 36, 36px 8, 28px 7, 6px 5, 14px 4, 5px 3, 96px 2, and one each of 144px, 64px, 60px, 56px, 38px, 30px, 19px, 15px, 7px and 0.75px.

Also seen, but not counted:

- **Strings in spacing props:** `'none'` 82, `'auto'` 34, `'0'` 12, and a handful of rem values (`'1.5rem 1rem'`, `'1.5rem'`, `'0.5rem'`). The rem ones map to the scale.
- **Fuselage's own SCSS on `develop`** uses off-scale steps inside components: `lengths.margin(2)` ×21, `lengths.padding(2)` ×6, `lengths.margin(-2)` ×6, and a few 1px and 28px. These follow component specs, not the public API (see "Internal styles" below).
- **False positives excluded:** `ResponsiveBar padding={0.25}` is a nivo chart prop.
- **Not covered by the scan:** values computed at runtime, css-in-js templates, inline `style` and app SCSS.

## Token families

Spacing, rounding and stroke are separate families, each a closed set:

| Family | Tokens | Status |
|---|---|---|
| Space | `x4`, `x8`, `x12`, `x16`, `x20`, `x24`, `x32`, `x40`, and their negatives | missing; this proposal adds it |
| Radius | `none`, `default` (1px), `small` (2px), `medium` (4px), `large` (8px), `extra-large` (20px), `full` | `fuselage-tokens/border.json`, already typed as `BorderRadius` on the `borderRadius*` props |
| Border width | `none`, `default` (1px), `medium` (2px), `large` (4px), `extra-large` (8px) | `fuselage-tokens/border.json`, already typed as `BorderWidth` |

**Radius** already works the way spacing should:

- Props use the names: `medium` 34 times, `large` 11, `small` 7, `full` 7, `none` 1. Only one `borderRadius={4}` escapes.
- Raw CSS keeps about 30 literal radii: `50%` ×10, `4px` ×10, `2px` ×4, `100%` ×2, `5px` ×2 and `3px` ×1, mostly in app css-in-js and Fuselage SCSS.
- `50%`/`100%` map to `full`, `4px` to `medium` and `2px` to `small`. `5px` and `3px` have no token and need design.

## Where `x2` is used, and why it stays out of the scale

None of the 2px spacing values is a scale step. Each one is something else:

| What it is | Sites | Examples | Fix |
|---|---|---|---|
| **Gap emulation.** Siblings each take 2px so 4px separates them, or a parent takes −2px and its children +2px. | about 22 in apps; most of Fuselage's own (`Messages`, `MessageReactions`, `MessageMetrics`, `Avatar`, `Field`, `Item`) | `RoomAutoComplete.tsx:81/84`, `RoleCell.tsx:60`, `RoomTags.tsx:14`, `AnalyticsPage.tsx:81` (`Margins inline={2}`), `BusinessHoursForm.tsx:105/112`, `RealTimeMonitoringPage.tsx:88-107`, `AttachmentRow.tsx:7` with `AttachmentText`/`AttachmentTitle`, `LinearScaleElement.tsx:38` | `gap='x4'` on the parent. Same pixels, and the negative margins go away. |
| **Room for the focus ring**, so a scroll container doesn't clip it | 6 | `FieldGroup paddingInline={2}` inside `Scrollable` in the three outbound-message forms; `ModalContent marginBlockEnd={2}` in the three create modals | It is the focus ring's width (`borderWidth: medium`). `Scrollable`/`ModalContent` should reserve it themselves, so callers drop the prop. |
| **Optical nudges** | about 7 | `GenericPreview.tsx:9` (icon −2px), `SidebarItemBadges.tsx` ×2 (`InvitationBadge` +2px), `AppRequestItem.tsx:20`/`AppRequestsLoading.tsx:6`, `TemplatePreview.tsx:38`, `AgentInfo.tsx:72` | Alignment (`alignItems`, baseline) instead of a margin; needs a screenshot review. |
| **Icon-to-text gap inside a `Tag`** | 3 | `AppStatus.tsx:171`, `RoomInfoABACSection.tsx:37`, `FeaturesCard.tsx:73` | `x4`, or let `Tag` space its icon itself. |
| **Compact padding inside small components** | Fuselage only | `Tag` and `Badge` (`2px 4px`), `MessageReactions`, `MessageToolbar`, `Table` `border-spacing` | Component internals that follow the spec. Not public spacing. |
| **Stroke compensation** | Fuselage only | `Button` padding `calc(… - 2px)`, `Sidebar` 2px border, `Banner` −2px | `borderWidth('medium')`, so the subtraction follows the border token. |
| **Other families** | Fuselage only | `Tooltip` `border-radius: 2px`, elevation shadow blur 2px | radius `small`; the elevation shadow token. |

So the public space scale stays at the eight steps. Every 2px either becomes `x4` through `gap` with no visual change, moves to the border or radius family, or stays an internal value of a component.

## Plan

Each step is its own pull request and can be reverted alone. Steps 1 and 3 change no pixels.

1. **Declare the scale** (`fuselage-tokens`, `fuselage`):
   - add `spacing.json` to `fuselage-tokens` with the eight steps;
   - export a `SpacingToken` type and the scale as data;
   - make `spacing()` read it.

   Runtime behavior is unchanged.
2. **Fix the 115 off-scale call sites.** This step needs design sign-off, because rounding moves pixels.
   - **2px (40 sites):** handled as described in "Where `x2` is used". Gap emulation becomes `gap='x4'` (same pixels), focus-ring room moves into `Scrollable`/`ModalContent`, and optical nudges get a screenshot review.
   - **Values a step off** (10, 6, 14, 5, 15, 19, 30, 36, 38, 28): round to the nearest step. Proposed: 10→x8 or x12 per site, 6→x4 or x8, 5→x4, 14→x12 or x16, 15→x16, 19→x20, 28→x24 or x32, 30→x32, 36→x32 or x40, 38→x40.
   - **Values above the scale** (56, 60, 64, 96, 144): these are layout offsets, not spacing (`ImageGallery` swiper breakpoints, empty-state offsets). Move them to explicit CSS (css-in-js or a class), outside the spacing props.
   - **Verification:** a screenshot A/B of each changed view.
3. **Codemod on-scale numbers to tokens:** 1,043 sites, such as `marginBlockEnd={8}` → `marginBlockEnd='x8'`, and `'0.5rem'` → `'x8'`. Same values, no visual change. One commit per package.
4. **Sizes stop being tokens.** Codemod the 827 `x<n>` size values to numbers (`width='x120'` → `width={120}`) and `inset*` the same way. Keep the `full`/`sw`/`sh` keywords or replace them with `100%`/`100vw`/`100vh`. No visual change.
5. **Reject invalid values** (Fuselage, semver major for the published package):
   - **Types:** a `SpacingValue` type (`SpacingToken`, its `neg-`/`-` forms, `0`, `'0'`, `'none'` and `'auto'`) for the spacing props of `StylingProps`, `Margins` and the `BoxProps` they reach. Numbers and arbitrary strings stop type-checking. Sizes keep accepting numbers and CSS strings.
   - **Runtime:** in development, `spacing()` warns once per off-scale value, which catches values computed at runtime and untyped callers. The production behavior is unchanged.
   - **Internal styles:** component internals that follow a spec off the scale (the 2px gaps) use an internal helper, not the public `spacing()`, so the public type stays strict.
   - **Changeset:** major for `@rocket.chat/fuselage`, since it narrows public prop types.
6. **Tamagui pilot:** rebase on top. Its `space` tokens become the eight steps plus their negatives, and its `size` tokens go away.

7. **Radius cleanup:**
   - the one `borderRadius={4}` becomes `'medium'`;
   - the about 30 raw CSS radii move to `borderRadius()` / `lengths.border-radius()` (`50%`/`100%` → `full`, `4px` → `medium`, `2px` → `small`);
   - `5px` and `3px` go to design.
8. **Stroke compensations** in Fuselage (`Button`, `Banner`, `Sidebar`) read `borderWidth('medium')` instead of a literal `2px`.

## Decisions needed

- Rounding direction for 10px, 14px, 28px and 36px (per site, or one rule)?
- Should numbers equal to a step (`8`) stay accepted as an alias of the token? Accepting them keeps step 3 optional, but leaves two spellings of the same value.

## Appendix: every off-scale site

Generated from the scan; locations are `file:line` on `develop` at `a39b03fe5c`.

### 2px (40)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/components/RoomAutoComplete/RoomAutoComplete.tsx:81` | Box | `marginInline` | `2` |
| `apps/meteor/client/components/RoomAutoComplete/RoomAutoComplete.tsx:84` | Box | `marginInline` | `2` |
| `apps/meteor/client/components/UserAutoCompleteMultiple/UserAutoCompleteMultiple.tsx:111` | UserAvatarChip | `marginBlock` | `2` |
| `apps/meteor/client/components/message/content/Action.tsx:6` | IconButton | `marginInline` | `2` |
| `apps/meteor/client/components/message/content/attachments/structure/AttachmentRow.tsx:7` | Box | `marginInline` | `-2` |
| `apps/meteor/client/components/message/content/attachments/structure/AttachmentRow.tsx:7` | Box | `marginBlockEnd` | `2` |
| `apps/meteor/client/components/message/content/attachments/structure/AttachmentText.tsx:14` | Box | `marginInline` | `2` |
| `apps/meteor/client/components/message/content/attachments/structure/AttachmentTitle.tsx:6` | Box | `marginInline` | `2` |
| `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:218` | ModalContent | `marginBlockEnd` | `2` |
| `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateDirectMessage.tsx:67` | ModalContent | `marginBlockEnd` | `2` |
| `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:169` | ModalContent | `marginBlockEnd` | `2` |
| `apps/meteor/client/sidebar/badges/SidebarItemBadges.tsx:21` | InvitationBadge | `marginBlockStart` | `2` |
| `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAutocomplete.tsx:48` | Box | `marginInline` | `2` |
| `apps/meteor/client/views/admin/permissions/PermissionsTable/RoleCell.tsx:60` | Margins | `inline` | `2` |
| `apps/meteor/client/views/admin/subscription/components/cards/FeaturesCard.tsx:73` | Box | `marginInlineEnd` | `2` |
| `apps/meteor/client/views/directory/RoomTags.tsx:14` | Margins | `inline` | `2` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequestItem.tsx:20` | Box | `marginBlockStart` | `2` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequestsLoading.tsx:6` | Box | `marginBlockStart` | `2` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatus.tsx:171` | Icon | `marginInlineEnd` | `2` |
| `apps/meteor/client/views/marketplace/components/AccordionLoading.tsx:8` | Skeleton | `margin` | `'2px'` |
| `apps/meteor/client/views/navigation/sidebar/badges/SidebarItemBadges.tsx:19` | InvitationBadge | `marginBlockStart` | `2` |
| `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:72` | Box | `marginBlock` | `2` |
| `apps/meteor/client/views/omnichannel/analytics/AnalyticsPage.tsx:81` | Margins | `inline` | `2` |
| `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursForm.tsx:105` | Box | `marginInlineEnd` | `2` |
| `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursForm.tsx:112` | Box | `marginInlineStart` | `2` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/MessageForm.tsx:83` | FieldGroup | `paddingInline` | `2` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/RecipientForm.tsx:189` | FieldGroup | `paddingInline` | `2` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/RepliesForm.tsx:121` | FieldGroup | `paddingInline` | `2` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/TemplatePreview.tsx:38` | Box | `marginBlockEnd` | `2` |
| `apps/meteor/client/views/omnichannel/realTimeMonitoring/RealTimeMonitoringPage.tsx:88` | ChatsChart | `marginInlineEnd` | `2` |
| `apps/meteor/client/views/omnichannel/realTimeMonitoring/RealTimeMonitoringPage.tsx:93` | ChatsPerAgentChart | `marginInlineStart` | `2` |
| `apps/meteor/client/views/omnichannel/realTimeMonitoring/RealTimeMonitoringPage.tsx:102` | AgentStatusChart | `marginInlineEnd` | `2` |
| `apps/meteor/client/views/omnichannel/realTimeMonitoring/RealTimeMonitoringPage.tsx:107` | ChatsPerDepartmentChart | `marginInlineStart` | `2` |
| `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/ABAC/RoomInfoABACSection.tsx:37` | Box | `marginInlineStart` | `2` |
| `apps/meteor/client/views/room/modals/FileUploadModal/GenericPreview.tsx:9` | Icon | `marginInlineStart` | `-2` |
| `apps/meteor/client/views/teams/contextualBar/channels/AddExistingModal/RoomsAvailableForTeamsAutoComplete.tsx:49` | Chip | `marginBlock` | `2` |
| `packages/fuselage-ui-kit/src/elements/LinearScaleElement.tsx:38` | Button | `marginInline` | `2` |
| `packages/fuselage/src/components/Contextualbar/ContextualbarIcon.tsx:7` | Icon | `paddingInline` | `2` |
| `packages/fuselage/src/components/Label/LabelInfo.tsx:10` | Box | `marginInline` | `2` |
| `packages/fuselage/src/components/Sidepanel/SidepanelHeader.tsx:10` | Divider | `marginBlockStart` | `-2` |

### 10px (36)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/sidebar/sections/NowPlayingSection.tsx:41` | Box | `marginBlockEnd` | `10` |
| `apps/meteor/client/sidebar/sections/SidebarCard.tsx:13` | Box | `padding` | `10` |
| `apps/meteor/client/views/admin/integrations/NewZapier.tsx:65` | Box | `marginBlockStart` | `10` |
| `apps/meteor/client/views/admin/moderation/helpers/ReportReason.tsx:10` | Box | `marginBlock` | `10` |
| `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupStepOneModal.tsx:89` | Field | `paddingBlockStart` | `10` |
| `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupStepTwoModal.tsx:97` | Field | `paddingBlockStart` | `10` |
| `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceTokenModal.tsx:93` | Field | `paddingBlockStart` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:62` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:74` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:81` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:94` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:104` | IconButton | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:113` | IconButton | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:125` | Button | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilterContextualBar.tsx:38` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilterContextualBar.tsx:44` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilterContextualBar.tsx:48` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilterContextualBar.tsx:52` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilterContextualBar.tsx:64` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/DateTimeModal.tsx:54` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/DateTimeModal.tsx:58` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/ExportLogsModal.tsx:104` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/ExportLogsModal.tsx:143` | Box | `marginInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/components/RadioDropDown/RadioDownAnchor.tsx:34` | Box | `paddingInlineEnd` | `10` |
| `apps/meteor/client/views/marketplace/components/ScreenshotCarouselAnchor.tsx:107` | Box | `paddingBlock` | `10` |
| `apps/meteor/client/views/omnichannel/analytics/AnalyticsPage.tsx:100` | Box | `padding` | `10` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/components/OutboundMessageWizardSkeleton.tsx:13` | Box | `marginBlockStart` | `10` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/components/OutboundMessageWizardSkeleton.tsx:17` | Box | `marginBlockStart` | `10` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/components/OutboundMessageWizardSkeleton.tsx:21` | Box | `marginBlockStart` | `10` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/components/OutboundMessageWizardSkeleton.tsx:25` | Box | `marginBlockStart` | `10` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/components/OutboundMessageWizardSkeleton.tsx:29` | Box | `marginBlockStart` | `10` |
| `apps/meteor/client/views/omnichannel/directory/components/AgentField.tsx:44` | AgentInfoDetails | `marginInlineStart` | `'x10'` |
| `apps/meteor/client/views/omnichannel/directory/components/ContactField.tsx:53` | AgentInfoDetails | `marginInlineStart` | `10` |
| `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:191` | Field | `marginBlockStart` | `10` |
| `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:200` | Field | `marginBlockStart` | `10` |
| `packages/fuselage/src/components/Margins/Margins.spec.tsx:11` | Margins | `all` | `'10px'` |

### 36px (8)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/account/security/ChangePassphrase.tsx:104` | Box | `marginBlockStart` | `36` |
| `apps/meteor/client/views/account/security/EndToEnd.tsx:10` | Divider | `marginBlock` | `36` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:48` | Box | `marginBlockStart` | `'36px'` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:50` | CollapsibleRegion | `marginInlineStart` | `36` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequests.tsx:60` | Box | `paddingBlockStart` | `36` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequests.tsx:68` | Box | `paddingBlockStart` | `36` |
| `apps/meteor/client/views/marketplace/AppsPage/AppsPageContentSkeleton.tsx:7` | Box | `marginBlockEnd` | `36` |
| `apps/meteor/client/views/marketplace/AppsPage/AppsPageContentSkeleton.tsx:11` | Box | `marginBlockEnd` | `36` |

### 28px (7)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/admin/viewLogs/AnalyticsReports.tsx:18` | Box | `paddingBlockEnd` | `28` |
| `apps/meteor/client/views/audit/components/AuditForm.tsx:63` | Box | `marginBlockStart` | `28` |
| `apps/meteor/client/views/marketplace/AppExemptModal.tsx:42` | Box | `marginBlockEnd` | `28` |
| `apps/meteor/client/views/marketplace/components/PrivateAppInstallModal/PrivateAppInstallModal.tsx:46` | Box | `marginBlockEnd` | `28` |
| `apps/meteor/client/views/omnichannel/analytics/Overview.tsx:60` | Box | `paddingBlock` | `28` |
| `apps/meteor/client/views/omnichannel/modals/EnterpriseDepartmentsModal.tsx:56` | Box | `marginBlockEnd` | `28` |
| `apps/meteor/client/views/omnichannel/realTimeMonitoring/counter/CounterRow.tsx:12` | Box | `paddingBlock` | `28` |

### 6px (5)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:106` | Margins | `inline` | `6` |
| `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:112` | Margins | `inline` | `6` |
| `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:118` | Margins | `inline` | `6` |
| `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDownAnchor.tsx:52` | Box | `marginInlineEnd` | `6` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessagePreview/PreviewItem.tsx:20` | Box | `marginInlineStart` | `6` |

### 14px (4)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/admin/integrations/NewZapier.tsx:66` | Margins | `blockEnd` | `14` |
| `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDownAnchor.tsx:35` | Box | `paddingInlineStart` | `14` |
| `apps/meteor/client/views/marketplace/components/RadioDropDown/RadioDownAnchor.tsx:35` | Box | `paddingInlineStart` | `14` |
| `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:208` | Field | `marginBlockStart` | `14` |

### 5px (3)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/admin/moderation/helpers/ReportReason.tsx:12` | Box | `marginBlock` | `5` |
| `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:136` | Box | `marginBlock` | `'5px'` |
| `packages/fuselage/src/components/Throbber/Throbber.stories.tsx:60` | Button | `marginInlineEnd` | `'5px'` |

### 96px (2)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/components/ImageGallery/ImageGallery.tsx:36` | spacing() | `spacing()` | `'x96'` |
| `packages/fuselage/src/components/Tooltip/Tooltip.stories.tsx:100` | Box | `paddingInline` | `'x96'` |

### 0.75px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/marketplace/components/ScreenshotCarousel.tsx:56` | Box | `marginBlock` | `'-0.75px'` |

### 7px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDownAnchor.tsx:34` | Box | `paddingInlineEnd` | `7` |

### 15px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/omnichannel/modals/ForwardChatModal.tsx:154` | Field | `marginBlock` | `15` |

### 19px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:128` | Callout | `marginBlockEnd` | `19` |

### 30px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessagePreview/OutboundMessagePreview.tsx:100` | Box | `marginBlockStart` | `30` |

### 38px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/marketplace/components/ScreenshotCarousel.tsx:89` | Box | `marginInline` | `38` |

### 56px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `packages/fuselage/src/components/Tooltip/Tooltip.stories.tsx:100` | Box | `paddingBlock` | `'x56'` |

### 60px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/components/ImageGallery/ImageGallery.tsx:36` | spacing() | `spacing()` | `'x60'` |

### 64px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/views/marketplace/AppsPage/UnsupportedEmptyState.tsx:16` | Box | `marginBlockStart` | `64` |

### 144px (1)

| Location | Component | Prop | Value |
|---|---|---|---|
| `apps/meteor/client/components/ImageGallery/ImageGallery.tsx:36` | spacing() | `spacing()` | `'x144'` |
