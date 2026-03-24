# Effect Migration Guide

A practical guide for identifying and refactoring unnecessary `useEffect` calls in this codebase, based on [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).

## Decision flowchart

Before touching any effect, ask these questions in order:

1. **Is this calculating something from props/state?** → Remove the effect, compute during render or use `useMemo`.
2. **Is this resetting state when a prop (usually an ID) changes?** → Use `key` on the component.
3. **Is this responding to a user action (click, submit, drag)?** → Move the logic into the event handler.
4. **Is this calling a parent callback (onChange, onSubmit) after state changes?** → Call the callback in the same event handler that sets state.
5. **Is this subscribing to an external store (browser APIs, third-party lib)?** → Use `useSyncExternalStore`.
6. **Is this fetching data?** → Keep the effect, but ensure it has a cleanup function. Prefer `useQuery` or a framework-provided mechanism.
7. **None of the above?** → The effect is likely correct. It synchronizes with something external.

---

## Pattern 1 — Derived state

### The problem

State that can be computed from other state or props does not need its own `useState` + `useEffect`. The effect causes an extra render with stale values before the derived state updates.

### How to spot it

```typescript
// Red flag: useState + useEffect that just transforms existing data
const [derived, setDerived] = useState(initialValue);
useEffect(() => {
  setDerived(someTransform(propOrState));
}, [propOrState]);
```

### How to fix it

**Simple calculation — compute during render:**

```typescript
// Before
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// After
const fullName = firstName + ' ' + lastName;
```

**Expensive calculation — use `useMemo`:**

```typescript
// Before
const [filtered, setFiltered] = useState([]);
useEffect(() => {
  setFiltered(items.filter(expensivePredicate));
}, [items]);

// After
const filtered = useMemo(() => items.filter(expensivePredicate), [items]);
```

### Real examples in this codebase

**`client/providers/LayoutProvider.tsx`** — `isCollapsed` derived from `shouldToggle`:
```typescript
// Before
const [isCollapsed, setIsCollapsed] = useState(false);
useEffect(() => {
  setIsCollapsed(shouldToggle);
}, [shouldToggle]);

// After — if shouldToggle is a simple computed value, just use it directly
const isCollapsed = shouldToggle;
// Or if the component needs to override it later (toggle behavior), keep state
// but initialize from the prop and use key= to reset when the source changes
```

**`client/views/admin/settings/groups/OAuthGroupPage.tsx`** — `settingSections` synced from `sections`:
```typescript
// Before
const [settingSections, setSettingSections] = useState(sections);
useEffect(() => {
  setSettingSections(sections);
}, [sections]);

// After — if nothing mutates settingSections locally, just use sections directly
// If local mutation is needed, use key= on the parent or initialize with useState only
```

**`client/views/account/preferences/PreferencesNotificationsSection.tsx`** — browser API read on mount:
```typescript
// Before
const [notificationsPermission, setNotificationsPermission] = useState<string>();
useEffect(() => {
  setNotificationsPermission(window.Notification && Notification.permission);
}, []);

// After — initialize in useState directly
const [notificationsPermission] = useState(
  () => window.Notification && Notification.permission,
);
```

---

## Pattern 2 — Resetting state when a prop changes (use `key`)

### The problem

When a component receives a new ID (user, room, emoji, etc.) and needs to reset its internal state, developers often write an effect that calls multiple `setState` functions. This renders once with stale state, then re-renders with the reset values.

### How to spot it

```typescript
// Red flag: effect that resets state when an ID changes
useEffect(() => {
  setName('');
  setComment('');
  setSelection(null);
}, [entityId]);
```

### How to fix it

Extract the stateful part into a child component and use `key`:

```typescript
// Before — effect resets state
function EditForm({ entityId, entity }) {
  const [name, setName] = useState(entity.name);
  const [aliases, setAliases] = useState(entity.aliases);
  useEffect(() => {
    setName(entity.name);
    setAliases(entity.aliases);
  }, [entityId, entity.name, entity.aliases]);
  // ...
}

// After — key forces React to recreate the component
function EditFormWrapper({ entityId, entity }) {
  return <EditForm key={entityId} entity={entity} />;
}

function EditForm({ entity }) {
  const [name, setName] = useState(entity.name);
  const [aliases, setAliases] = useState(entity.aliases);
  // No effect needed — state initializes from props on mount
}
```

### Real examples in this codebase

**`client/views/admin/customEmoji/EditCustomEmoji.tsx`** — resets form on `_id` change:
```typescript
// Before
useEffect(() => {
  setName(previousName || '');
  setAliases(previousAliases?.join(', ') || '');
}, [previousName, previousAliases, _id]);

// After — wherever EditCustomEmoji is rendered, add key={_id}
// <EditCustomEmoji key={_id} ... />
// Then remove the useEffect entirely, useState initializes once per key
```

**`client/views/admin/settings/Setting/Setting.tsx`** — resets form value on prop change:
```typescript
// Before
useEffect(() => {
  setValue(setting.value);
}, [setting.value]);

// After — use key={setting._id} on the Setting component from the parent
```

---

## Pattern 3 — Event logic inside effects

### The problem

When something should happen **because the user did something** (clicked, submitted, typed), putting that logic in an effect makes it run in unrelated scenarios (mount, re-render, dependency change).

### How to spot it

```typescript
// Red flag: state flag that triggers an effect
const [shouldSubmit, setShouldSubmit] = useState(false);
useEffect(() => {
  if (shouldSubmit) {
    postData(formValues);
    setShouldSubmit(false);
  }
}, [shouldSubmit, formValues]);

function handleSubmit() {
  setShouldSubmit(true);
}
```

### How to fix it

Move the logic into the event handler directly:

```typescript
// After
function handleSubmit() {
  postData(formValues);
}
```

### The key question

> Would this code run if the component re-rendered for an unrelated reason?

If **yes** and it shouldn't, it belongs in an event handler, not an effect.

### Real examples in this codebase

**`client/views/admin/integrations/outgoing/history/OutgoingWebhookHistoryPage.tsx`** — `mounted` flag gates an effect:
```typescript
// Before
const [mounted, setMounted] = useState(false);
// ... setMounted(true) inside query function
useEffect(() => {
  if (mounted) {
    return sdk.stream('integrationHistory', [id], handler);
  }
}, [mounted, id]);

// After — start the stream when data is available, not via a boolean flag
// Use the query's onSuccess or enabled option, or derive from query state:
const { data } = useQuery({ queryKey, queryFn });
useEffect(() => {
  if (!data) return;
  return sdk.stream('integrationHistory', [id], handler);
}, [data, id]);
```

---

## Pattern 4 — Notifying parent on state change

### The problem

A child component updates its own state, then uses an effect to call a parent callback. This causes two render passes and makes data flow harder to trace.

### How to spot it

```typescript
// Red flag: effect that calls onChange/onUpdate after state change
const [value, setValue] = useState(initialValue);
useEffect(() => {
  onChange(value);
}, [value, onChange]);
```

### How to fix it

**Option A — Call both in the same event handler:**

```typescript
// Before
const [status, setStatus] = useState(initialStatus);
useEffect(() => {
  onChange(status);
}, [status, onChange]);

function handleSelect(newStatus) {
  setStatus(newStatus);
}

// After
function handleSelect(newStatus) {
  setStatus(newStatus);
  onChange(newStatus);
}
```

**Option B — Controlled component (lift state up):**

```typescript
// Before — uncontrolled with callback
function Toggle({ initialValue, onChange }) {
  const [isOn, setIsOn] = useState(initialValue);
  useEffect(() => { onChange(isOn); }, [isOn, onChange]);
  return <button onClick={() => setIsOn(!isOn)} />;
}

// After — controlled by parent
function Toggle({ isOn, onChange }) {
  return <button onClick={() => onChange(!isOn)} />;
}
```

### Real examples in this codebase

**`client/components/UserStatusMenu.tsx`**:
```typescript
// Before
const [status, setStatus] = useState(initialStatus);
useEffect(() => {
  onChange(status);
}, [status, onChange]);

// After — call onChange directly in the handler that updates status
function handleStatusChange(newStatus) {
  setStatus(newStatus);
  onChange(newStatus);
}
```

**`client/views/admin/settings/EditableSettingsProvider.tsx`**:
```typescript
// Before
useEffect(() => {
  sync(persistedSettings);
}, [persistedSettings, sync]);

// After — call sync at the point where persistedSettings actually changes
// (wherever the mutation/query updates the data)
```

---

## Pattern 5 — Form field synchronization chains

### The problem

Multiple effects that watch form fields and set other form fields. This creates cascading renders and is hard to reason about.

### How to spot it

```typescript
// Red flag: multiple effects calling setValue on different fields
useEffect(() => {
  if (type === 'email') setValue('format', 'html');
  if (type === 'download') setValue('format', 'json');
}, [type, setValue]);

useEffect(() => {
  if (!isPrivate) setValue('encrypted', false);
}, [isPrivate, setValue]);

useEffect(() => {
  setValue('readOnly', broadcast);
}, [broadcast, setValue]);
```

### How to fix it

**Option A — Use `watch` + conditional rendering (react-hook-form):**

Don't sync fields — derive the UI from the current form state:

```typescript
const type = watch('type');
const isPrivate = watch('isPrivate');
const broadcast = watch('broadcast');

// Instead of syncing, compute defaults or disable fields
// <Select disabled={type === 'email'} defaultValue={type === 'email' ? 'html' : 'json'} />
// <Checkbox disabled={!isPrivate || broadcast} />
```

**Option B — Use `onChange` callback in the field that triggers the change:**

```typescript
<Controller
  name="type"
  render={({ field }) => (
    <Select
      {...field}
      onChange={(value) => {
        field.onChange(value);
        if (value === 'email') setValue('format', 'html');
        if (value === 'download') setValue('format', 'json');
      }}
    />
  )}
/>
```

### Real examples in this codebase

**`client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx`** — three effects syncing form fields:
```typescript
// Before — three separate effects
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

// After — handle in the onChange of the triggering field
// When "federated" checkbox changes:
function handleFederatedChange(checked: boolean) {
  setValue('federated', checked);
  if (checked) {
    setValue('encrypted', false);
    setValue('broadcast', false);
    setValue('readOnly', false);
  }
}

// When "broadcast" checkbox changes:
function handleBroadcastChange(checked: boolean) {
  setValue('broadcast', checked);
  setValue('readOnly', checked);
}
```

**`client/views/room/contextualBar/ExportMessages/ExportMessages.tsx`** — three effects syncing form fields based on export type.

---

## Pattern 6 — Subscribing to external stores

### The problem

Manually managing event listeners with `addEventListener`/`removeEventListener` inside effects to sync external mutable data with React state.

### How to spot it

```typescript
// Red flag: manual subscription in effect
const [isOnline, setIsOnline] = useState(navigator.onLine);
useEffect(() => {
  const handler = () => setIsOnline(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}, []);
```

### How to fix it

Use `useSyncExternalStore`:

```typescript
import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

const isOnline = useSyncExternalStore(
  subscribe,
  () => navigator.onLine,       // client snapshot
  () => true,                    // server snapshot
);
```

### When this does NOT apply

Effects that subscribe to **application-level streams** (Rocket.Chat SDK streams, DDP subscriptions) are legitimate synchronization with an external system. These are correct uses of `useEffect` — just make sure cleanup is handled.

---

## Pattern 7 — App initialization

### The problem

Running one-time setup logic (auth checks, localStorage reads) inside an effect. With Strict Mode, this runs twice in development.

### How to spot it

```typescript
useEffect(() => {
  loadFromLocalStorage();
  checkAuthToken();
}, []);
```

### How to fix it

**Option A — Module-level code:**
```typescript
if (typeof window !== 'undefined') {
  checkAuthToken();
  loadFromLocalStorage();
}

function App() {
  // ...
}
```

**Option B — Guard with a flag:**
```typescript
let didInit = false;

function App() {
  useEffect(() => {
    if (!didInit) {
      didInit = true;
      checkAuthToken();
      loadFromLocalStorage();
    }
  }, []);
}
```

---

## Quick reference

| Symptom | Fix |
|---------|-----|
| `useState` + `useEffect` that derives from props/state | Compute during render or `useMemo` |
| Effect resets multiple `useState` when an ID prop changes | Use `key={id}` on the component |
| Effect calls `onChange`/`onSubmit` after `setState` | Call both in the same event handler |
| Multiple effects calling `setValue` on form fields | Handle in the triggering field's `onChange` |
| Effect with a boolean flag that gates logic | Move logic to the event that sets the flag |
| Effect subscribing to browser API / external store | `useSyncExternalStore` |
| Effect that only runs on mount to read a value | Initialize in `useState(() => readValue())` |
| Effect that fetches data | Keep it, but add cleanup (`let ignore = false`) or use `useQuery` |

---

## Files to refactor

The table below lists concrete files in this codebase that match the anti-patterns above. Sorted by impact (files with multiple issues first).

### High impact (multiple anti-patterns, easy fixes)

#### `client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx`
**Pattern:** Form field chains (lines 129-146)
Three chained effects syncing `encrypted`, `broadcast`, `readOnly` when `federated`, `isPrivate`, or `broadcast` change.
**Fix:** Move logic into the `onChange` handler of each triggering field.

#### `client/views/room/contextualBar/ExportMessages/ExportMessages.tsx`
**Pattern:** Form field chains (lines 128-150)
Three effects syncing `format` and `messagesCount` based on export `type`.
**Fix:** Set `format` in the `onChange` of the `type` field. Derive `messagesCount` with `useMemo`.

#### `client/views/admin/settings/Setting/Setting.tsx`
**Pattern:** Prop sync to state (lines 66-73)
Two effects: `setValue(setting.value)` and `setEditor(setting.editor)` whenever the setting prop changes.
**Fix:** Use `key={setting._id}` on the component so state reinitializes on entity change.

#### `client/views/admin/ABAC/ABACSettingTab/SettingField.tsx`
**Pattern:** Prop sync to state (line 60)
Same pattern as `Setting.tsx` — `setValue(setting.value)` in an effect.
**Fix:** Use `key={setting._id}`.

#### `client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupModal.tsx`
**Pattern:** State chains (lines 28-35)
Two chained effects: first resets `validInfo` on `step` change, second recomputes it from `email`/`terms`.
**Fix:** Derive `validInfo` with `useMemo(() => step === 1 && validateEmail(email) && terms, [step, email, terms])`.

### Derived state (replace with `useMemo` or direct computation)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `client/providers/LayoutProvider.tsx` | 39 | `setIsCollapsed(shouldToggle)` | Use `shouldToggle` directly |
| `client/views/admin/settings/groups/OAuthGroupPage/OAuthGroupPage.tsx` | 66 | `setSettingSections(sections)` | Use `sections` prop directly |
| `client/views/account/preferences/PreferencesNotificationsSection.tsx` | 45 | `setNotificationsPermission(Notification.permission)` on mount | `useState(() => Notification.permission)` |
| `client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx` | 157 | `setParentFolders(currentFolder.split('/'))` | `useMemo` |
| `client/views/omnichannel/analytics/Overview.tsx` | 34 | `setDisplayData(type === 'Conversations' ? a : b)` | `useMemo` based on `type` |
| `client/views/room/composer/hooks/useComposerBoxPopupQueries.ts` | 12 | `setCounter(0)` when `popup`/`filter` changes | Derive or use `key` |

### State reset on entity change (use `key` prop)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `client/views/admin/customEmoji/EditCustomEmoji.tsx` | 59 | Resets `name`, `aliases` when `_id` changes | `key={_id}` on component |
| `client/views/admin/customSounds/EditSound.tsx` | 39 | Resets `name`, `sound` when `_id` changes | `key={_id}` on component |

### Prop sync to state (use `key` or controlled component)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `client/views/admin/settings/Setting/inputs/CodeMirror/CodeMirror.tsx` | 111 | `setValue(valueProp)` | `key` or controlled |

### Parent notification (call callback in event handler instead)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `client/components/UserStatusMenu.tsx` | 77 | `onChange(status)` after state change | Call `onChange` in the handler that sets `status` |
| `client/views/admin/permissions/PermissionsTable/PermissionsTableFilter.tsx` | 12 | `onChange(debouncedFilter)` | Call `onChange` directly with debounced value |

### setFocus on mount (use `autoFocus` prop)

These use react-hook-form's `setFocus` in a `useEffect(fn, [setFocus])`. Consider using the `autoFocus` prop on the input instead.

| File | Line |
|------|------|
| `client/views/e2e/EnterE2EPasswordModal/EnterE2EPasswordModal.tsx` | 33 |
| `client/views/room/contextualBar/MessageSearchTab/components/MessageSearchForm.tsx` | 28 |
| `client/views/omnichannel/modals/TranscriptModal.tsx` | 46 |
| `client/views/omnichannel/modals/ForwardChatModal.tsx` | 44 |

---

## When effects ARE correct

- Synchronizing with an external system (DOM manipulation, third-party widget, WebSocket/stream subscription)
- Data fetching with proper cleanup (prefer `useQuery` when available)
- Analytics/logging that should fire when the component is **displayed**
- Setting up/tearing down event listeners that are not tied to a specific user action
