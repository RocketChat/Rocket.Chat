import type { RouterContextValue, To } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

const OPENER_WINDOW_NAME = 'rocketchat-main';

// Internal app routes are sent to the window that launched the conference, so this window stays on
// the call. Desktop app: there's no `window.opener` (the conference is a standalone Electron
// window), so route the main app window through the desktop bridge when it supports it. Browser:
// reuse/focus the opener tab; otherwise fall back to a new tab.
const openInOpenerOrTab = (href: string) => {
	// Desktop: the internal video window exposes its own bridge (`window.videoCallWindow`), separate
	// from `RocketChatDesktop` which only exists in the main app webview.
	const openInMainWindow = window.videoCallWindow?.openInMainWindow;
	if (openInMainWindow) {
		try {
			const { pathname, search, hash } = new URL(href, window.location.href);
			openInMainWindow(`${pathname}${search}${hash}`);
			return;
		} catch {
			// Fall through to the browser strategies below.
		}
	}

	const opener = window.opener as Window | null;
	if (opener && !opener.closed) {
		try {
			// `opener.focus()` can't switch the active *tab* (browsers block it). Targeting the opener by
			// window name with `window.open` reuses that browsing context AND brings its tab to the front.
			if (!opener.name) {
				opener.name = OPENER_WINDOW_NAME;
			}
			const reused = window.open(href, opener.name);
			if (reused) {
				reused.focus?.();
				return;
			}
		} catch {
			// Opener not accessible — fall back to a new tab.
		}
	}
	window.open(href, '_blank', 'noopener');
};

// The conference page lives in its own window/tab; navigating it away (a chat link, a channel
// mention, an external URL) would tear down the call. This pins the window to the conference:
// in-page links (`?jump=`, `#hash`) are left untouched, internal routes go to the opener, and
// external links open in a new tab. It covers both `<a href>` clicks and programmatic
// `router.navigate` (channel/user mentions, room links).
export const useConfinedNavigation = () => {
	const router = useRouter();

	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			// Let modified/non-primary clicks behave normally (they already open new tabs/windows).
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}

			const anchor = (event.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
			if (!anchor) {
				return;
			}

			// Links that already open elsewhere (new tab) or download won't navigate this window.
			const { target } = anchor;
			if ((target && target !== '_self' && target !== '_top' && target !== '_parent') || anchor.hasAttribute('download')) {
				return;
			}

			let url: URL;
			try {
				url = new URL(anchor.href, window.location.href);
			} catch {
				return;
			}

			// Only intercept real page navigations.
			if (url.protocol !== 'http:' && url.protocol !== 'https:') {
				return;
			}

			// Same page (e.g. `?jump=<msgId>` or `#hash`) — let the app handle it in place.
			if (url.origin === window.location.origin && url.pathname === window.location.pathname) {
				return;
			}

			// This click would navigate the conference window away — take over.
			event.preventDefault();
			event.stopPropagation();

			if (url.origin === window.location.origin) {
				openInOpenerOrTab(url.href);
				return;
			}

			window.open(url.href, '_blank', 'noopener');
		};

		// Capture phase so we run before React/the router's own click handlers.
		document.addEventListener('click', handleClick, true);
		return () => document.removeEventListener('click', handleClick, true);
	}, []);

	// Catch programmatic navigations (mentions, room links, etc.) that don't go through an anchor.
	// This monkey-patches the shared `router.navigate`. The conference window is a single, isolated
	// consumer, so only one patch is ever installed at a time — but we still guard the patch/unpatch
	// to stay safe if that ever stops holding: re-patching an already-wrapped `navigate` is a no-op,
	// and cleanup only restores when our wrapper is still the live one (so a newer patch is never
	// clobbered, and a stale wrapper is never reinstated).
	useEffect(() => {
		const original = router.navigate as RouterContextValue['navigate'] & { _confined?: boolean };

		// Already wrapped (re-run with the same router) — leave the existing patch in place.
		if (original._confined) {
			return undefined;
		}

		const wrapped = ((toOrDelta: To | number, options?: { replace?: boolean }) => {
			if (typeof toOrDelta === 'number') {
				original(toOrDelta);
				return;
			}

			let targetUrl: URL;
			try {
				targetUrl = new URL(router.buildRoutePath(toOrDelta), window.location.origin);
			} catch {
				original(toOrDelta, options);
				return;
			}

			// Same page (search/hash change only) — allow it; otherwise keep this window on the call.
			if (targetUrl.pathname === window.location.pathname) {
				original(toOrDelta, options);
				return;
			}

			openInOpenerOrTab(targetUrl.href);
		}) as RouterContextValue['navigate'] & { _confined?: boolean };
		wrapped._confined = true;

		router.navigate = wrapped;
		return () => {
			// Only restore if our wrapper is still installed — never clobber a newer patch.
			if (router.navigate === wrapped) {
				router.navigate = original;
			}
		};
	}, [router]);
};
