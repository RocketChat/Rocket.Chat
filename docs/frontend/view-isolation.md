# View isolation

A screen piece (anything under `apps/meteor/client/views/`) should run without Meteor and without a browser: in a test, in Storybook, and one day in React Native. The rules below keep the web-only parts at the edges, where they can be swapped. React Native is planned work, not shipped: nothing here depends on it, and every rule pays off in tests today.

## 1. Presentation takes props; each subpart with data has its own container

- Reusable components (`apps/meteor/client/components/**`, `packages/ui-client`, layout containers) and presentational views take only props and callbacks: no `useEndpoint`, `useQuery`, `useStream`, router, browser APIs or Meteor.
- A subpart that needs data gets a thin container next to it (the `XWithData` pattern, or `X` rendering `XView`). The container owns its query and its loading or Suspense boundary, and passes props down. Don't lift queries to the top of the screen: `useEndpoint` plus `useQuery` are already platform-isolated through `ui-contexts` (another platform provides another `ServerContext`), and lifting them makes the whole screen suspend and remount on every refetch. One slow query should only affect its subpart.
- Screen-level orchestration that isn't a query goes in a named hook (`useXActions`): actions that combine endpoint, router, toast and modal, state shared between subparts, effects that touch the platform.
- Containers and hooks reach the world only through `ui-contexts` ([section 2](#2-reach-the-server-and-the-app-only-through-rocketchatui-contexts)); browser APIs sit behind a hook ([section 3](#3-browser-apis-live-behind-a-hook)); web-only widgets behind an app component ([section 4](#4-web-only-widgets-go-through-a-component-the-app-owns)).

```tsx
// illustrative: the Outlook list isn't split like this yet
// ✅ the container owns the query and its loading boundary; the view takes props
const OutlookEventsListWithData = () => {
	const getEvents = useEndpoint('GET', '/v1/outlook-calendar.list');
	const { data, isLoading } = useQuery({ queryKey: ['outlook-events'], queryFn: () => getEvents() });
	const { onOpenCalendar } = useOutlookEventsActions();

	return <OutlookEventsList events={data?.events} isLoading={isLoading} onOpenCalendar={onOpenCalendar} />;
};

// the hook orchestrates; the platform access stays in useExternalLink
const useOutlookEventsActions = () => {
	const openExternalLink = useExternalLink();
	return { onOpenCalendar: (url: string) => openExternalLink(url) };
};

// ❌ a presentational component that calls useEndpoint or useQuery itself
// ❌ a view that calls window.open and orchestrates endpoint, router and toast inline
const OutlookEventsList = () => {
	const getEvents = useEndpoint('GET', '/v1/outlook-calendar.list');
	…
	return <Button onClick={() => window.open(outlookUrl, '_blank')}>…</Button>;
};
```

Where it holds: `views/room/UserCard/UserCardWithData.tsx` owns its user query and loading state and hands props to `UserCard`, and `views/mediaCallHistory/MediaCallHistoryInternal.tsx` takes `data`, `onClose` and callbacks as props, with its actions in `useMediaCallInternalHistoryActions`. Where it doesn't: `views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx` fetches, virtualizes and calls `window.open` in one component.

## 2. Reach the server and the app only through `@rocket.chat/ui-contexts`

Views and their hooks read and change the world through `useEndpoint`, `useStream`, `useRouter`, `useSetting`, `useUser`, `useTranslation` and the toast and modal contexts. A test or another platform provides those contexts; it cannot provide Meteor.

- No `meteor/*` import in `client/views/**`. There are none today, and the lint rule keeps it so.
- No import from `apps/meteor/app/**`, and none from the client's Meteor shims in `apps/meteor/client/meteor/**`. The two left, each with a lint disable, are `views/root/SAMLLoginRoute.tsx` (`loginWithSamlToken`) and `views/root/hooks/loggedIn/useForceLogout.ts` (`getConnectionSessionId`). A new need for one of them is a new method on a `ui-contexts` context, provided by the app.

## 3. Browser APIs live behind a hook

`window`, `document`, `navigator`, `localStorage`, `sessionStorage` and `matchMedia` are not used inline in a view. A hook owns the access, in the shape [dom-hooks.md](dom-hooks.md) describes (a callback ref when it binds to a node), and the view calls the hook. Prefer an existing hook (`useLocalStorage`, `useMediaQuery` from `@rocket.chat/fuselage-hooks`) over a new one.

The scan counts hooks too, not only components: a hook that touches the browser is the one place a native twin has to be written, so it should stay small and named for what it does (`useOpenExternalUrl`, not `useWindow`). `views/root/hooks/useAnalytics.ts` is the extreme: 26 direct reaches in one hook.

## 4. Web-only widgets go through a component the app owns

react-aria menus and selects, `react-virtuoso`, `react-dom` portals and `@rocket.chat/gazzodown` rendering have no React Native version. A screen doesn't import them. It uses an app component with the props the screen needs, and that component is the one that gets a native twin. `MarkdownText` is one already; a virtualized list and a portal wrapper don't exist yet.

Today these web-only widgets are used directly by views:

- `react-virtuoso` value imports in 16 views (`OutlookEventsList`, `VideoConfList`, `MessageSearchTab`, the contextual-bar and omnichannel lists, `RoomList`, `SidePanelInternal`). `SidepanelListWrapper` and `RoomListFilters` import types only and don't count.
- virtua `VList` renders `MessageList.tsx` and `ThreadMessageList.tsx`. `client/components/PaginatedVirtualList/` is the app-owned virtua wrapper, used by `DiscussionsList`: the starting point for a shared virtualized list.
- `createPortal` in 4 views: `root/AppRoot.tsx`, `room/contextualBar/Threads/Thread.tsx`, `CodeMirror/CodeMirrorBox.tsx` and `marketplace/components/ScreenshotCarouselAnchor.tsx`.
- `GenericMenu` (`packages/ui-client`) in about 35 view files. It forwards the props of the web `Menu`, so its contract is still the web one.

`Select` and `FocusScope` are not on this list: they come from Fuselage, whose native entry is the twin, so the app doesn't wrap them. The scan doesn't count any of these widgets yet.

## 5. Platform files

A component that must differ per platform gets a sibling with a `.native.tsx` extension and the same props type, and both import that type from one place:

```
VirtualizedList/
  VirtualizedList.tsx          web, picked by Vite
  VirtualizedList.native.tsx   React Native, picked by Metro, never seen by Vite
  VirtualizedListProps.ts      the contract
```

No `.native.tsx` file exists yet. Add one only together with the native consumer that needs it.

## 6. What CI measures

Two checks keep the rules from eroding:

- Imports are a lint rule. The `no-restricted-imports` override for `apps/meteor/client/views/**/*.{ts,tsx}` in `.oxlintrc.json` is an error on `meteor/*` and on any import that reaches `apps/meteor/app/**` or `apps/meteor/client/meteor/**` by relative path or the `/` alias. Specs, stories and test folders are exempt. The two existing sites carry an `oxlint-disable-next-line` that names the migration proposal; remove the comment when the site moves to a `ui-contexts` method.
- `node scripts/scan-view-isolation.mjs` counts `window`, `document`, `navigator`, `localStorage`, `sessionStorage` and `matchMedia` used as identifiers across `apps/meteor/client/views/**/*.{ts,tsx}` (specs, stories and test folders excluded).

The CI lint job fails when the scan total rises above `--max` in `.github/workflows/ci-code-check.yml`. `layout/` folders are scanned too: unlike in `scan-raw-layout.mjs`, nothing makes a container exempt from using the browser. The ceiling only goes down: when a change lowers the count, the script says so and the same change lowers `--max`. Every finding is listed with its `file:line` in the output JSON.

What is left to migrate, and in what order, is in [the view isolation migration proposal](../proposals/view-isolation-migration.md).
