# Contexts and providers

A context is a dependency handed down the tree: a value, the things you can do with it, and nothing else. These
rules are for new contexts; much existing code predates them.

Name the access hook after what it provides — `useThing`, not `useThingContext` (see
[react.md](react.md#avoid-naming-identifiers-with-their-value-typekind)).

## Default to `undefined`, and throw from the access hook

```ts
// ✅
type CallDevicesContextValue = {/* … */};

const CallDevicesContext = createContext<CallDevicesContextValue | undefined>(undefined);
CallDevicesContext.displayName = 'CallDevicesContext';

export const useCallDevices = (): CallDevicesContextValue => {
	const value = useContext(CallDevicesContext);
	if (!value) {
		throw new Error('useCallDevices must be used within a CallDevicesProvider');
	}
	return value;
};
```

```ts
// ❌ a "do nothing" default
export const CallDevicesContext = createContext<CallDevicesContextValue>({
	devices: [],
	select: () => undefined,
});
```

- **No fake defaults.** A default of empty arrays and no-op functions makes a missing provider look like a working
  one: the button renders, nothing happens, nothing throws. It also makes every "is this feature available?" branch
  unreachable, because the value is always there. When a feature is genuinely optional, say so in the type —
  `provider?: ProviderPluginControls` — and let consumers handle its absence.
- **Don't export the context object.** Export the provider and the access hook. Consumers that reach for the raw
  context skip the check, and tests that render `<Context.Provider value={…}>` by hand drift from the real provider.
  Tests and stories supply a value through the provider or a mock provider (see [testing.md](testing.md)).
- **Set `displayName`**, so React DevTools shows which context a consumer reads.

`apps/meteor/client/views/room/contexts/ComposerPopupContext.ts` has the throwing access hook;
`apps/meteor/client/views/room/providers/DateListProvider.tsx` keeps its context private to the module.

Known exception: `ConferenceContext` and `ChatPanelContext` in `packages/ui-conference/src/context/` use do-nothing
defaults so that stories and tests can render a corner of the window without a full value. Don't copy that; it is
due to be revisited.

## Memoize the value, and split state from actions

```tsx
// ❌ a new object every render re-renders every consumer
return <CallDevicesContext.Provider value={{ devices, selected, select, refresh }}>{children}</CallDevicesContext.Provider>;

// ✅
const value = useMemo(() => ({ devices, selected, select, refresh }), [devices, selected, select, refresh]);
```

When some consumers only act (a mute button) and others only read (a device list), split the context in two —
`CallDevicesStateContext` and `CallDevicesActionsContext`. Actions are stable, so their consumers stop re-rendering
on every state change.

## One context per responsibility

A context that grows to cover several features forces every provider to implement all of them. A 32-member call
context mixing 1:1 VoIP, group calls, media processing and devices ended with no-op stubs for the members a provider
did not have and `as any` where the types stopped lining up. Several small contexts, each provided by whoever
actually owns that state, avoid both.

## Providers only provide

A provider builds a value and renders `children`. It does not render layout, a loading screen, a portal, or run
fetch-then-toast side effects. Those belong to a component inside the provider, where they can be seen, tested and
rearranged.

```tsx
// ❌
const CallProvider = ({ children }: CallProviderProps) => {
	const call = useCall();
	if (!call) return <Skeleton />;
	return (
		<CallContext.Provider value={call}>
			<Box display='flex'>{children}</Box>
			{createPortal(<CallAudio />, document.body)}
		</CallContext.Provider>
	);
};

// ✅ the provider provides; the view decides what to render while loading
const CallProvider = ({ children }: CallProviderProps) => {
	const value = useCallContextValue();
	return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
```

## Mount providers as low as possible

Mount a provider around the subtree that reads it, not at the app root. A call provider mounted at the root needed a
hidden portal to render its media, pushed its state upward so the root could see it, and shadowed another context of
the same kind. Moving it into the window that renders the call removed all three.

## Plug-in points are registries

Core code must not know the list of plug-ins:

```ts
// ❌
if (providerName === 'livekit') {
	return <LiveKitCall />;
}

// ✅ each provider registers what it contributes; core looks it up
const CallView = callViews.get(providerName);
return CallView ? <CallView /> : <ConferenceIframe url={url} />;
```

## Hooks return data, components render

- A hook returns values and callbacks, never JSX. Rendering belongs to a component the caller places.
- Prefer `children` or compound parts (`<CallPanel><CallPanelHeader /></CallPanel>`) over `renderHeader` /
  `renderActions` props.
- Don't create portal hosts with `document.createElement`. Use `AnchorPortal` from `@rocket.chat/ui-client`, which
  reference-counts a shared host element by id.
