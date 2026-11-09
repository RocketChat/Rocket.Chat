# Proposal: `Box` and `Stack` stay out of screens

## Status

Proposal, not accepted. It extends the rule in [Layout in the app](../frontend/layout.md) and builds on [ADR-0011](../adr/0011-fuselage-components-take-no-styling-props.md). Measured on `develop` at `669feb71db8` with `scripts/analyze-box-usage.mjs`. Nothing below was checked visually; every step that moves layout is proven with a Storybook A/B before it merges (see "How a step is verified").

## Decision

`Box` and `Stack` are the material a layout container is built from. A screen composes named containers and never builds its own layout with either.

- **`Box` and `Stack` are one rule.** A raw `Stack` in a screen means a container is missing, exactly as a raw `Box` does. Replacing a `Box` with a `Stack` moves the layout decision from one primitive to another and leaves it in the screen.
- **`Text` follows the same line.** `Text` with a `fontScale` and a `color` repeated across screens is a text component that does not exist yet (section title, hint, caption). `Text` stays for running text.
- **The style lives in the component.** What a reader of a screen sees is `<UserCell>`, `<EmptyState>`, `<FormFooter>`, not the flex, gap and truncation behind them.
- **A parent spaces its children.** A `Box` whose only job is to give a Fuselage component a margin points to a parent that does not space its children. The parent gets the `gap`; the wrapper goes away.
- **Where a container lives is unchanged.** `layout/` next to the screen, then `apps/meteor/client/components/`, then `packages/ui-client`, then Fuselage, as the reuse grows.

The CI gate changes with it: `scripts/scan-raw-layout.mjs` counts `Stack` too, and its limit starts at today's total, so a `Box` replaced by a `Stack` no longer lowers the count.

## What the code does today

`node scripts/analyze-box-usage.mjs` scans `apps/meteor/client`, `apps/meteor/ee/client` and the `ui-*` packages the client renders (not `packages/fuselage`, whose `Box` is component implementation, and not the UiKit playground). It skips `layout/` folders, stories and specs.

| Measure                                                  | Count               |
| -------------------------------------------------------- | ------------------- |
| `<Box>` in the scanned scope                             | 1782                |
| `<Stack>` in the scanned scope                           | 74                  |
| Raw elements `scan-raw-layout` allows in `views` (CI)    | 1110                |
| `<States>` rendered directly, outside `GenericNoResults` | 60 files            |
| `<Margins>`                                              | 31 uses in 30 files |

`Stack` is barely used, so the rule lands before a `Box`-to-`Stack` migration builds a second backlog.

## What the uses point to

Each detector in the script names the replacement its uses point to. The counts are of sites the detector matches, so a site can match more than one, and a detector that misses a shape undercounts. `--detector <name>` prints every `file:line`.

| Detector            | Sites | Files | Points to                                   |
| ------------------- | ----- | ----- | ------------------------------------------- |
| `spacing-wrapper`   | 111   | 92    | `gap` on the parent container               |
| `nested-box`        | 55    | 44    | one element instead of two                  |
| `skeleton-block`    | 33    | 20    | a skeleton for a block of lines             |
| `narrow-column`     | 23    | 23    | a `PageContent` variation or a `PageColumn` |
| `icon-label`        | 21    | 21    | an icon-and-label component                 |
| `empty-state-frame` | 12    | 12    | one state component (see candidate 2)       |
| `user-cell`         | 11    | 11    | one shared user cell                        |
| `virtualized-list`  | 10    | 10    | a virtualized list container                |
| `modal-paragraph`   | 9     | 8     | `ModalContent` spacing its paragraphs       |
| `margins`           | 31    | 30    | `gap` on the parent container               |

Beyond these, most of the rest is a layout used once, which belongs in a `layout/` folder next to its screen and needs no shared component.

## Candidates

Each candidate below says what the sites look like, what already exists, the contract proposed, and what is still undecided. A proposed contract is a starting point for review with design, not a settled API.

### 1. Parents own the spacing

**Sites.** 111 `spacing-wrapper` sites. The wrapped component, by count: `Field` 36, `Callout` 23, `ButtonGroup` 16, `Throbber` 12, `States` 8, `Divider` 6, `Accordion` 6, `Tag` 4. Most are in `views/omnichannel` (23), `views/admin` (21), `views/room` (19) and `views/audit` (11). Plus 31 `Margins`.

```tsx
<Box marginBlockStart={8}>
	<ButtonGroup stretch>…</ButtonGroup>
</Box>
```

**Exists.** `FieldGroup` already spaces its fields (`rcx-field-group__item`, a 24px block-start margin). `PageContent`, `ModalContent` and the `Contextualbar` sections do not space their children. `Margins` injects the same spacing from outside.

**Proposed.** Give `PageContent`, `ModalContent` and the `Contextualbar` section a `gap` between children, so a `Callout`, a `ButtonGroup` or a paragraph sits where the parent puts it.

**Decide.**

- The default `gap` of each parent, against the spacing scale (`yarn lint:spacing`). A parent that today has no gap and gets one changes every screen that uses it.
- Children that already carry their own margin, which would double up.
- Whether the gap is a default or an opt-in variation, one container at a time.

### 2. One component for an empty, error or not-found state

**Sites.** 60 files render `<States>` directly. 6 of them wrap it in the same flex-centre frame `GenericNoResults` already contains: `DeviceManagementTable`, `DeviceManagementInfoWithData`, `BusinessHoursDisabledPage`, `RoomE2EENotAllowed`, `NotSubscribedRoom`, `AppErrorPage`. Another 8 give it a `marginBlockStart` wrapper (`views/marketplace/AppsPage`).

**Exists.** `GenericNoResults` (69 uses): icon, title, description, one button or one link, no icon variation. `GenericError`: danger icon, title, a button and an error report, no description. `NotFoundState` and `ConferenceErrorState` in the packages build the same frame again.

**Proposed.** One state component that takes what these four take: icon with a `variation`, title, description, actions, and a way to fill its parent. `GenericNoResults` and `GenericError` become presets of it.

**Decide.** The name and whether it replaces `GenericNoResults` or sits under it; what `fill` means when the parent is not a fixed-height region.

### 3. A shared user cell

**Sites.** 11, among them `UsersInRoleTableRow`, `UserPresenceTabRow`, `CannedResponsesTable`, `ManagersTable`, `QueueListTable`, `ReadReceiptRow`. A related cell in `views/admin/moderation/helpers/UserColumn.tsx` nests four `Box`.

```tsx
<Box display='flex' alignItems='center'>
	<UserAvatar size='x24' username={username} />
	<Box display='flex' withTruncatedText marginInline={8}>…
```

**Proposed.** A `UserCell` in `apps/meteor/client/components/` taking the avatar size, name, username and an optional second line, truncating by itself.

**Decide.** Whether the name's weight and colour are fixed or a variation; how it differs from `UserInfo` in `packages/ui-client`, which is the contextual bar header.

### 4. A narrow page column

**Sites.** 23, all `maxWidth='x580'` or `'x600'` with `width='full'`, among them `AccountSecurityPage`, `EmailInboxForm`, `IncomingWebhookForm`, `EditDepartment`, `WebhooksPage`, and the `ui-account` views `AccessibilityView`, `PreferencesView`.

**Proposed.** A `PageContent` variation (a `narrow` width) or a `PageColumn` container, so a page form states "narrow" and not a width.

**Decide.** One width or two (`x580` and `x600` both appear); whether it centres by itself.

### 5. Icon and label

**Sites.** 21: a flex row with centred items and an `Icon` (`UserStatusText`, `NavBarSearchInputAddon`, `CountMACCard`, `CallHistoryTableStatus`).

**Proposed.** Decide after reading the 21; some are a `Button` or `Chip` in disguise and need no new component.

### 6. Skeleton for a block of lines

**Sites.** 33 in 20 files: two or more `Skeleton` in one `Box` or `Stack`, for example `EditIntegrationsPageWithData`, `HistoryContent`. `PageSkeleton` and `ContextualbarSkeleton` cover only a page and a contextual bar.

**Proposed.** A skeleton that takes a line count.

### 7. Virtualized list container

**Sites.** 10 (`RoomList`, `SidePanelInternal`, `CannedResponseList`, `ContactInfoHistory`, `BannedUsers`, `MessageListTab`, `MessageSearchTab`, `TeamsChannels`, `ContactInfoChannels`, `AbacRoomMembershipPreview`): a flex box that grows and clips, around `VirtualizedScrollbars` and `Virtuoso`.

**Proposed.** One container for "a virtualized list that fills the space it is given".

### 8. Loading footer and form actions

Part of candidate 1's count, but each is a component, not a `gap`.

- **Loading footer.** 12 sites wrap a `Throbber` in the same padding (`ContactHistoryMessagesList`, `ContactInfoChannels`, `ContactInfoHistory`). `InfiniteListAnchor` already lives in `apps/meteor/client/components/`.
- **Form actions.** 16 sites wrap a `ButtonGroup` in a margin (`EditCustomEmoji`, `AccountProfilePage`, `ActionAttachtment`). Page forms have no footer equivalent of `ModalFooter`.

### 9. Mechanical clean-up

- **`nested-box` (55).** A `Box` whose only child is another `Box`, such as `Box withTruncatedText > Box is='span' fontScale='p2m'`. Most collapse into one element.
- **`margins` (31).** `Margins` injects props into the first `Box`-based child. The parent's `gap` replaces it.
- **`modal-paragraph` (9).** `Box is='p' marginBlockEnd={16}` around a paragraph. Candidate 1 resolves it once `ModalContent` spaces its children.

## Rollout

Each step is one pull request with one concern that can be reverted alone, per [change-organization.md](../change-organization.md). The first lands before any screen moves.

1. **The rule.** `scan-raw-layout` counts `Stack`, its limit set to the new total; `layout.md` and ADR-0011 drop the wording that offers `Stack` as the answer in a screen. No screen changes.
2. **Parents space children,** one container per pull request (`PageContent`, then `ModalContent`, then the `Contextualbar` section), each with its Storybook A/B. The wrappers it makes unnecessary go in the same pull request, and the limit drops by that many.
3. **The state component** (candidate 2), then its 14 direct sites.
4. **The user cell** (candidate 3) and its 11 sites.
5. **Loading footer and form actions** (candidate 8).
6. **Narrow column, skeleton block, virtualized list** (candidates 4, 6, 7).
7. **Mechanical clean-up** (candidate 9), with the codemod in its own commit.

## How a step is verified

- **Visual.** The `storybook-ab` skill builds a before and after story per call site and compares screenshots and element geometry across widths, browsers and themes. A change that moves a margin is not done until that shows no difference, or the difference is listed and accepted.
- **Count.** `node scripts/scan-raw-layout.mjs --max <n>` and `node scripts/analyze-box-usage.mjs` show the number a step removed. The limit in `.github/workflows/ci-code-check.yml` drops in the same pull request.
- **Types and tests.** `yarn tsc` in `apps/meteor` after the last edit, and the specs of every file touched.

## Not covered

- `packages/fuselage` internals and `apps/uikit-playground`: `Box` there is component implementation or tooling, not screen layout.
- `div`, `span` and `section` that screens render directly. `scan-raw-layout` counts them; this proposal only extends the same rule to `Stack`.
- Styling applied through `className` and app CSS, which no scanner sees.
- The analysis script matches shapes by prop names, so it misses a layout built through a spread or computed props.

## Regenerate the numbers

```bash
node scripts/analyze-box-usage.mjs                              # counts per detector
node scripts/analyze-box-usage.mjs --detector user-cell         # every file:line
node scripts/analyze-box-usage.mjs --json box-usage.json        # all sites
```
