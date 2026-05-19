# React `useEffect` Anti-Pattern Audit

**Generated:** 2026-05-19 (updated after deep-scan round 2)
**Source rubric:** https://react.dev/learn/you-might-not-need-an-effect
**Scope:** `apps/meteor/client`, `packages/ui-*`, `packages/fuselage-ui-kit`, `packages/web-ui-registration`, `ee/apps`, `ee/packages`
**Machine-readable companion:** [`react-effect-audit.json`](./react-effect-audit.json)

## TL;DR

- **EE (`ee/apps`, `ee/packages`):** no React surface — backend services only.
- **`apps/meteor/client`:** ~436 files use `useEffect`. After round-2 deep scan (4 sub-chunks) + carve-outs: **~63 actionable findings**.
- **`packages/ui-*` + adjacent:** ~21 actionable findings.
- **Grand total post-filter:** **84 findings** across 12 anti-pattern codes (E1–E12).
- **Highest-impact 🔴 bugs:** `CreateChannelModal` (3 chained derived-state Effects), `useDecryptedMessage` (race), `AppsRoute` (mounted-flag anti-pattern), `OutgoingWebhookHistoryPage` (gated mutation in Effect), `UserStatusMenu` (notify parent), `useInfoSlots` (derived state array), `UserPresenceProvider` (derived status), `useMediaSessionInstance` (Effect chain + gated fetch), `useDesktopNotifications` + `useEmailVerificationWarning` (notifications in Effect), `useDownloadFromServiceWorker` + `useSingleFileInput` (notify parent).

## Coverage

- **Round 1** (broad): 27 raw apps/meteor + 31 packages + 0 ee.
- **Round 2** (deep, 4 parallel investigators on apps/meteor subtrees): 76 raw across views/providers/contexts/stores/hooks/uikit/lib/components/sidebar/navbar/portals/apps/startup/router.
- **Total raw**: ~127 candidates → **84 post-filter** (false positives + RC carve-outs applied).
- **Remaining gaps**: some files in deeply-nested subtrees may not have been enumerated by every investigator. Streamer-wrapping Effects (~25 sites) deliberately excluded per carve-out.

## Anti-Pattern Reference

| Code | Pattern | Default severity |
|------|---------|------------------|
| E1 | Derived state in Effect → compute in render / `useMemo` | 🔴 |
| E2 | Cached calc in Effect → `useMemo` | 🔴 |
| E3 | Reset all state on prop → `key` prop | 🟡 |
| E4 | Single state adjust on prop → derive or restructure | 🟡 |
| E5 | Event logic in Effect → event handler | 🔴 if user-action |
| E6 | POST/mutation in Effect → call in handler | 🔴 if user-action |
| E7 | Effect chain (A→B→C) → consolidate | 🟡 |
| E8 | App init in Effect → module-level or guard | 🟡 |
| E9 | Notify parent in Effect → call in handler | 🔴 |
| E10 | Child→parent data in Effect → lift fetch up | 🔴 |
| E11 | Manual subscribe → `useSyncExternalStore` | 🟡 |
| E12 | Fetch without race guard → `ignore` / AbortController | 🔴 |

## Totals (post-filter)

| Code | Count |
|------|-------|
| E1 | 13 |
| E2 | 6 |
| E3 | 7 |
| E4 | 14 |
| E5 | 5 |
| E6 | 3 |
| E7 | 3 |
| E8 | 11 |
| E9 | 6 |
| E10 | 1 |
| E11 | 14 |
| E12 | 1 |
| **Total** | **84** |

## Featured 🔴 bugs (manually verified)

### CreateChannelModal — 3 chained form-derivation Effects

**`apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:120,129,135`**
```tsx
useEffect(() => {
  if (federated) {
    setValue('encrypted', false);
    setValue('broadcast', false);
    setValue('readOnly', false);
  }
}, [federated, setValue]);

useEffect(() => {
  if (!isPrivate) setValue('encrypted', false);
}, [isPrivate, setValue]);

useEffect(() => {
  setValue('readOnly', broadcast);
}, [broadcast, setValue]);
```
**Problem:** Three Effects mutate sibling form fields. Each toggle triggers cascading re-renders + re-evaluations. Classic React-docs anti-pattern (chained Effects deriving sibling state).
**Fix:** Derive disabled/forced-false state at render time via `watch()` or compute final form values at submit. `CreateTeamModal.tsx:104` has the same pattern.

### useDecryptedMessage — fetch race

**`apps/meteor/client/hooks/useDecryptedMessage.ts:13`**
```ts
useEffect(() => {
  if (!isE2EEMessage(message)) return;
  e2e.decryptMessage(message).then((decryptedMsg) => {
    setDecryptedMessage(decryptedMsg.msg);
  });
}, [message, t, setDecryptedMessage]);
```
**Problem:** No ignore flag. `useSafely` handles unmount but not stale-message overwrite.
**Fix:** add `let ignore = false`; cleanup sets `ignore = true`.

### AppsRoute — mounted-flag anti-pattern

**`apps/meteor/client/views/marketplace/AppsRoute.tsx:26`**
```tsx
useEffect(() => {
  let mounted = true;
  const initialize = async () => {
    if (!mounted) return;
    setLoading(false);
  };
  initialize();
  return () => { mounted = false; };
}, [marketplaceRoute, context]);
```
**Problem:** Exact pattern called out in React docs as "you might not need an Effect" — async setLoading with mounted flag.
**Fix:** Use AbortController or move to a route-loader. `setLoading(false)` is not even gated on async result here.

### OutgoingWebhookHistoryPage — gated mutation in Effect

**`apps/meteor/client/views/admin/integrations/outgoing/history/OutgoingWebhookHistoryPage.tsx:64`** (38-line Effect)
**Problem:** Mounted-flag + gated mutation inside Effect. Should be event-handler driven.
**Fix:** Move mutation call to the form action; remove mounted flag in favor of AbortController if needed.

### UserStatusMenu — notify parent

**`apps/meteor/client/components/UserStatusMenu.tsx:77`**
```ts
useEffect(() => { onChange(status); }, [status, onChange]);
```
**Fix:** Move `onChange(selected)` into `handleSelection` alongside `setStatus`.

### useInfoSlots — derived state array

**`packages/ui-voip/src/components/PeerInfo/useInfoSlots.ts:48`**
**Fix:** Replace `useState` + `useEffect` with a single `useMemo`.

### UserPresenceProvider — derived status

**`apps/meteor/client/providers/UserPresenceProvider.tsx:23`**
```ts
setStatus(usePresenceDisabled ? null : status);
```
**Fix:** Compute in render.

### useDownloadFromServiceWorker / useSingleFileInput — notify parent in Effect

**`apps/meteor/client/hooks/useDownloadFromServiceWorker.ts:50`** and **`apps/meteor/client/hooks/useSingleFileInput.ts:35`** — both fire parent callbacks from Effects when local state changes.
**Fix:** Call callbacks in the same handler that updates state.

### useMediaSessionInstance — Effect chain + gated fetch

**`packages/ui-voip/src/providers/useMediaSessionInstance.ts:185,196`**
**Fix:** Consolidate 3-Effect cascade into single state-transition handler; move conditional fetch into the action that sets `userId`.

### useDesktopNotifications / useEmailVerificationWarning — notifications in Effects

**`packages/ui-voip/src/providers/useDesktopNotifications.ts:28`** and **`apps/meteor/client/providers/UserProvider/hooks/useEmailVerificationWarning.tsx:14`**
**Fix:** Fire toast/notification in the handler that detects the state transition (not in Effect on every dep tick).

## Hotspots (files with multiple findings)

| File | Findings | Codes |
|------|---------|-------|
| `apps/meteor/client/providers/UserProvider/UserProvider.tsx` | 4 | E1×2, E4, E5 |
| `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx` | 3 | E1×3 |
| `apps/meteor/client/providers/VideoConfProvider.tsx` | 4 | E1, E11×3 |
| `apps/meteor/client/providers/DeviceProvider/DeviceProvider.tsx` | 2 | E11×2 |
| `apps/meteor/client/providers/LayoutProvider.tsx` | 2 | E4, E11 |
| `apps/meteor/client/providers/TranslationProvider.tsx` | 2 | E5, E8 |
| `apps/meteor/client/views/admin/settings/Setting/Setting.tsx` | 2 | E1×2 |
| `apps/meteor/client/views/admin/settings/Setting/inputs/CodeMirror/CodeMirror.tsx` | 2 | E1, E2 |
| `apps/meteor/client/views/room/providers/RoomProvider.tsx` | 2 | E5×2 |
| `apps/meteor/client/views/room/providers/hooks/useChatMessagesInstance.ts` | 2 | E4×2 |
| `apps/meteor/client/views/invite/InvitePage.tsx` | 2 | E9, E7 |
| `packages/ui-voip/src/providers/useMediaSessionInstance.ts` | 2 | E6×2 |
| `packages/ui-voip/src/providers/useCallSounds.ts` | 2 | E5, E10 |
| `packages/ui-client/src/providers/TooltipProvider.tsx` | 2 | E2, E11 |
| `packages/web-ui-registration/src/LoginForm.tsx` | 2 | E4, E5 |

## False positives dropped

- `packages/ui-voip/src/components/Timer.tsx:21` — interval ticker, genuine reactive.
- `apps/meteor/client/hooks/useIdleConnection.ts:12` — no `useEffect`; uses `useEffectEvent` only.
- `packages/ui-client/src/views/setupWizard/steps/CloudAccountConfirmation.tsx:43` — `setInterval` with proper `clearInterval` cleanup.
- `apps/meteor/client/providers/UserPresenceProvider.tsx:23` — Effect calls `Presence.setStatus(...)` on a module-level singleton when a setting changes. No React state is set. This matches the React docs section "Synchronizing with external systems" (Effects guide) — canonical Effect usage, not an instance of "You might not need an Effect". Same reasoning applies case-by-case to other "derived from settings" findings whose setter writes to an external module rather than React state.
- `apps/meteor/client/providers/VideoConfProvider.tsx:19` — Identical pattern to UserPresenceProvider above. `useEffect(() => VideoConfManager.setLogLevel(logLevel), [logLevel])` writes to a singleton on prop change. Canonical external-sync.
- `apps/meteor/client/views/admin/settings/Setting/inputs/CodeMirror/CodeMirror.tsx:115` — Effect pushes React `value` state into the CodeMirror editor instance (third-party imperative library). Misclassified as E2 in the audit; there is no calc to memoize, it is a library bridge. Matches "Synchronizing with external systems" from the Effects guide. Keep.
- `apps/meteor/client/views/root/hooks/loggedIn/useCustomEmoji.ts:15` — Effect writes to the `emoji.packages.emojiCustom` singleton and calls `emoji.dispatchUpdate()`. External-system sync, same family as UserPresence/VideoConf. Misclassified as E2 (no calc). See **Stylistic follow-ups** below for a separate ergonomic cleanup suggestion.
- `packages/ui-client/src/providers/TooltipProvider.tsx:55` — Misclassified. `contextValue` is already wrapped in `useMemo` at lines 28-53. Line 55 is the start of the mouseover-subscribe Effect — same Effect already tracked at line 129 (E11). Double-counted, drop E2.
- `packages/ui-voip/src/context/usePeerAutocomplete.ts:44` — Notifies parent on presence-stream change, not user action. External-state sync. Drop E9.
- `apps/meteor/client/hooks/useDownloadFromServiceWorker.ts:50` — Effect calls `registerDownloadForUid` which sets up a one-shot `ee.once(uid, ...)` listener. Not a parent-callback fire. Drop E9.
- `apps/meteor/client/hooks/useSingleFileInput.ts:35` — DOM `addEventListener('change')` bridge with proper cleanup; parent callback fires from inside the listener. Canonical DOM bridge. Drop E9.
- `apps/meteor/client/hooks/useIdleActiveEvents.ts:35` — Same shape as useSingleFileInput — DOM event bridge with useEffectEvent-stable callbacks. Canonical. Drop E9.
- `apps/meteor/client/views/invite/InvitePage.tsx:24` — `setToken(token || null)` writes URL token into localStorage. External-system sync; author already flagged the architectural issue with a `// TODO: this is so hacky` comment — belongs in a route loader cleanup, not in this audit. Drop E9.

## Stylistic follow-ups (not anti-patterns)

- `apps/meteor/client/views/root/hooks/loggedIn/useCustomEmoji.ts:15` — Effect currently re-initializes `emoji.packages.emojiCustom` on every dep transition (loading → success → idle). Cleaner: initialize the registry once at module load, and inside the Effect only react to `result.isSuccess` for population. Not a "you might not need an Effect" finding; track as a separate refactor.

## Carve-outs applied (RC canonical)

~25 Effects wrapping `useStream`, `subscribeToNotify*`, `subscribeToRoomMessages`, `subscribeToApps`, `subscribeToCannedResponses`, `streamAll`, `streamNotifyUser`, `notify(...)` skipped — Rocket.Chat intentionally bypasses DDP mergebox (memory: `project_no_mergebox.md`).

## Refactor Wave Recommendation

| Wave | Codes | Why | Risk | Est. effort |
|------|-------|-----|------|-------------|
| 1 | E12 (1 finding) | `useDecryptedMessage` race. Single file, demonstrably safer diff. | Low | 15 min |
| 2 | E1 form-derivation | `CreateChannelModal` + `CreateTeamModal` — 4 findings; same react-hook-form refactor pattern. | Low–Med | half day |
| 3 | E1/E2 derived state | `useInfoSlots`, `UserPresenceProvider`, `Setting.tsx ×2`, `CodeMirror`, `useCustomEmoji`, `useMediaSession`, `peerInfo` — pure `useMemo`/render. | Low | 1 day |
| 4 | E9 notify-parent | `UserStatusMenu`, `useDownloadFromServiceWorker`, `useSingleFileInput`, `InvitePage`, `usePeerAutocomplete`. Move to handlers. | Low–Med | 1 day |
| 5 | E5/E6 user-action side effects | `useDesktopNotifications`, `useEmailVerificationWarning`, `useOpenRoom`, `OutgoingWebhookHistoryPage`, `RoomProvider×2`, `useRedirectOnSettingsChanged`. | Med | 2 days |
| 6 | E11 browser-API subscriptions | `DeviceProvider×2`, `LayoutProvider` window-message, `ImageGalleryProvider`, `TooltipProvider mouseover`, `ModalBackdrop keydown`, `useDocumentTitle`, `VideoConfManager×3`, `RoomManager`, `ActionManagerBusyState`, `useUiKitView` → `useSyncExternalStore`. | Med | 2–3 days |
| 7 | E4 partial-state adjust | `LayoutProvider`, `EmojiPicker`, `LoginForm`, `useChatMessagesInstance×2`, voip prop-sync hooks. UX validate. | Med | 2 days |
| 8 | E3 reset-all-state | `useAudioStream`, `useScreenShareStreams`, `RoomAvatarEditor`, `usePagination`, `useRouteLock`, `useReloadAfterLogin` → `key` remount. | High | 2 days |
| 9 | E6/E7 architectural | `useMediaSessionInstance` chain + fetch consolidation. Verify call lifecycle. | High | 2 days |
| 10 | E8 init audit | `useTonePlayer`, `AppsRoute` (already covered Wave 5 if E6 path chosen), `PreferencesNotificationsSection`, `TwoFactorTOTP`, `Preload`, `LDAPCollisionWarning`, `routes.tsx`, `MessageSearchForm`, `EnterE2EPasswordModal`, mount-only-focus forms (×4 in web-ui-registration). | Mixed | 1 day |

**Suggested first PR:** Wave 1 alone — single-file race fix in `useDecryptedMessage`.

## Related

- React doc: https://react.dev/learn/you-might-not-need-an-effect
