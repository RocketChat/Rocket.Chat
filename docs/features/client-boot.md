# Client boot

How the web client goes from an empty page to the first screen, and the rule that keeps it fast.

## The path

To reach its first screen the client:

1. loads the root components (`AppRoot`, the providers, `AppLayout`, `MainLayout`);
2. waits for the stores every screen reads — settings, then permissions;
3. renders the matched route inside the main layout, next to the sidebar and header.

The page shows a loading indicator while a root component or a store is not ready. A route component still
loading leaves the content area empty, next to the sidebar and header, until it arrives.

## Don't suspend on the boot path

React holds back content that replaces a Suspense fallback until 300 ms after that fallback appeared, so that
content arriving in quick succession is revealed together. On the boot path every suspension is followed by
another, so each one costs up to 300 ms on top of the time the data or chunk actually takes. Measured on a local
production build, removing them took the Home screen from about 770 ms to about 240 ms after navigation.

So the components every session renders on the way to its first screen don't suspend:

- a provider that needs a store waits for it with an ordinary loading state, not by throwing a promise;
- a code-split component that every session renders loads with `preloadedLazy()` instead of `lazy()`: its chunk
  starts loading when the module runs, and once loaded it renders without suspending.

Plain `lazy()` stays right for everything a session may never open — admin pages, contextual bars, modals — where
a short fallback on first use is the trade for not loading the code up front.
