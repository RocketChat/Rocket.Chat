# Effects

An effect synchronizes a component with a system **outside React**. Most effects that show up in review are not
that — they copy one piece of React state into another, or react to an event one render late. Each of those has a
replacement that needs no effect at all.

Before writing `useEffect`, find your case below.

| You want to…                                            | Use                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| compute a value from props or state                     | [derive it during render](#derive-instead-of-syncing)                      |
| reset state when a prop changes                         | [adjust it during render](#reset-state-during-render-not-in-an-effect)     |
| keep app state in step with an external source          | [read the source](#keep-one-source-of-truth)                               |
| subscribe to an external source                         | [`useSyncExternalStore`](#subscribe-with-usesyncexternalstore)             |
| attach a DOM listener or observer                       | [a callback ref](dom-hooks.md)                                             |
| tell a parent about a value                             | [composition or the event handler](#dont-notify-a-parent-from-an-effect)   |
| call a prop or show a toast from inside an effect       | [`useStableCallback`](#keep-non-reactive-logic-out-of-the-dependencies)    |
| load server data                                        | [TanStack Query + `useEndpoint`](#server-data-goes-through-tanstack-query) |
| drive a media track, an `AudioContext`, an SDK, a timer | [an effect](#effects-that-stay)                                            |

Nothing in lint enforces this: `react-hooks/set-state-in-effect` is off in `packages/eslint-config/index.js`, so a
`setX` inside an effect passes review only if a reviewer catches it.

## Derive instead of syncing

A value computed from props or state is computed during render. If it is expensive, wrap it in `useMemo`.

```tsx
// ❌ one extra render, and one render where `fullName` is stale
const [fullName, setFullName] = useState('');
useEffect(() => {
	setFullName(`${first} ${last}`);
}, [first, last]);

// ✅
const fullName = `${first} ${last}`;
```

**Why:** the effect runs after the commit, so every change renders twice — once with the old value, once with the
new — and anything that reads the stale value in between (a child, a callback) acts on it.

## Reset state during render, not in an effect

When state has to start over because an input changed, compare with the previous input during render
([react.dev: storing information from previous renders](https://react.dev/reference/react/useState#storing-information-from-previous-renders)):

```tsx
// ❌ renders the old selection against the new room first
const [selected, setSelected] = useState<string>();
useEffect(() => {
	setSelected(undefined);
}, [rid]);

// ✅
const [selected, setSelected] = useState<string>();
const [prevRid, setPrevRid] = useState(rid);
if (rid !== prevRid) {
	setPrevRid(rid);
	setSelected(undefined);
}
```

If the whole subtree should start over, a `key` is simpler still: `<MemberList key={rid} />`.

**When it does not apply:** state that must survive the change. Then it is not a reset, and usually not state.

## Keep one source of truth

If a value already lives somewhere — a third-party SDK object, a store, the URL — read it from there. Do not copy it
into app state so that another component can read the copy.

```tsx
// ❌ the SDK's active device copied into the app device store, only because the picker reads the store
useEffect(() => {
	setAudioInputDevice(room.getActiveDevice('audioinput'));
}, [room]);

// ✅ the picker reads the SDK directly (through a subscription, see below)
const activeDeviceId = useActiveDevice(room, 'audioinput');
```

**Why:** two copies drift. The copy is written one render late, is overwritten by whichever side writes last, and
turns every bug into a question of which copy is wrong.

## Subscribe with `useSyncExternalStore`

A value that lives outside React and changes on its own is read with `useSyncExternalStore`, not with
`useEffect` + `setState`.

```tsx
// ❌ tears between subscribe and first event, one render late, one listener per component
const [value, setValue] = useState(() => getStoredItem(key));
useEffect(() => subscribeStoredItem(() => setValue(getStoredItem(key))), [key]);

// ✅ apps/meteor/client/hooks/useStoredItem.ts
export const useStoredItem = (key: StorageKey): string | null =>
	useSyncExternalStore(
		subscribeStoredItem,
		useCallback(() => getStoredItem(key), [key]),
		getServerSnapshot,
	);
```

Two rules make the store behave:

- **`getSnapshot` returns the same value until something changed.** A new object on every call re-renders forever.
  `packages/ui-conference/src/hooks/useCallDevicesInitialState.ts` caches the parsed record per key and returns it
  until the raw string changes.
- **One source per resource, shared by every reader.** Keep the store at module level, and attach the real
  listener with the first subscriber and drop it with the last. `subscribeStoredItem` in
  `apps/meteor/client/lib/sdk/storage.ts` does exactly this for the `storage` event. Do the same for anything that
  costs something per subscription — a `devicechange` listener, an audio analyser per `MediaStream` — instead of
  one subscription per component.

## DOM listeners and observers

A hook that attaches a listener or an observer to an element returns a callback ref that returns its cleanup. See
[dom-hooks.md](dom-hooks.md); `apps/meteor/client/views/room/hooks/useIsVisible.ts` is the reference.

## Don't notify a parent from an effect

`useEffect(() => onChange(value), [value])` makes the parent render after the child, with a value the child already
had. Either call the handler where the value changes — the event handler — or let the owner of the value render the
consumers:

```tsx
// ❌ the child pushes its state up one render late
const DevicePicker = ({ onChange }: DevicePickerProps) => {
	const [deviceId, setDeviceId] = useState<string>();
	useEffect(() => onChange(deviceId), [deviceId, onChange]);
	return <Select value={deviceId} onChange={setDeviceId} />;
};

// ✅ the handler runs in the event
const handleChange = (id: string) => {
	setDeviceId(id);
	onChange(id);
};

// ✅ or the value's owner provides it to whoever needs it
<CallDevicesProvider>{children}</CallDevicesProvider>;
```

## Keep non-reactive logic out of the dependencies

An effect that must re-run when `roomId` changes but also calls `onError` or dispatches a toast should not list
those as dependencies — a new `onError` identity is not a reason to reconnect. Wrap them in `useStableCallback`
from `@rocket.chat/fuselage-hooks`:

```tsx
// ❌ reconnects whenever the parent re-renders with a new inline `onError`
useEffect(() => {
	const connection = connect(roomId);
	connection.on('error', (error) => onError(error));
	return () => connection.close();
}, [roomId, onError]);

// ✅ the dependency list says what re-runs it
const handleError = useStableCallback((error: Error) => onError(error));
useEffect(() => {
	const connection = connect(roomId);
	connection.on('error', handleError);
	return () => connection.close();
}, [roomId, handleError]);
```

React 19.2's `useEffectEvent` does the same job. The repo uses `useStableCallback` (hundreds of call sites, no
`useEffectEvent` yet) — stay with it so there is one way to do it.

Never silence `react-hooks/exhaustive-deps` to get the same effect.

## Server data goes through TanStack Query

Server state is fetched with `useQuery` / `useMutation` over `useEndpoint` from `@rocket.chat/ui-contexts`, with keys
from `apps/meteor/client/lib/queryKeys.ts`. See `apps/meteor/client/hooks/useRegistrationStatus.ts`.

```tsx
// ❌ no cache, no dedupe, no retry, races on fast changes, and a hand-built session
useEffect(() => {
	fetch(`/api/v1/rooms.info?roomId=${rid}`, {
		headers: { 'X-User-Id': localStorage.getItem('Meteor.userId')!, 'X-Auth-Token': localStorage.getItem('Meteor.loginToken')! },
	})
		.then((res) => res.json())
		.then(setRoom);
}, [rid]);

// ✅
const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
const { data } = useQuery({ queryKey: roomsQueryKeys.info(rid), queryFn: () => getRoomInfo({ roomId: rid }) });
```

`useEndpoint` also knows the session and the workspace's root path. A literal `/api/v1/...` breaks every
deployment served under a sub-path (`https://example.com/chat/`); when a URL has to be built by hand, use
`useAbsoluteUrl()` from `@rocket.chat/ui-contexts` (or `getURL` in `apps/meteor/app/utils/lib/getURL.ts` outside
React).

## Effects that stay

Some effects are exactly what effects are for: keeping something **outside React** in step with the render.

- a media track, an `AudioContext`, a `MediaStream` attached to a `<video>`
- a third-party SDK object — connect on mount, disconnect in cleanup
- a stream subscription, as in `apps/meteor/client/hooks/useAppSlashCommands.ts`
- timers and intervals

Keep them, with complete dependencies and a cleanup that undoes everything the effect set up. If the cleanup is
empty, ask whether the effect was needed.
