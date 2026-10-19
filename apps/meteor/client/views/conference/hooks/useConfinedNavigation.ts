import type { RouterContextValue, To } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { _relativeToSiteRootUrl } from '../../../lib/absoluteUrl';
import { NAVIGATE_TO_ROUTE_MESSAGE } from '../../root/hooks/useExternalRouteNavigation';

/**
 * Whether a URL is a conference — the one place this window is allowed to go.
 *
 * The window starts on `/conference/new` when it is about to create a call and moves to
 * `/conference/:callId` once it has, and that move is the whole point of the screen. Everything else is somebody
 * else's page, and taking this window there would end the call.
 *
 * Through the site root, because the router builds its paths that way: under a `ROOT_URL_PATH_PREFIX` the move
 * this window exists to make is to `/subdir/conference/<id>`, and a test for a bare `/conference/` would read it
 * as somebody else's page and open the call it just created in a tab.
 */
const isConference = (url: URL): boolean =>
	url.origin === window.location.origin && url.pathname.startsWith(_relativeToSiteRootUrl('/conference/'));

/** A name for the opener, so it can be raised without being navigated. */
const OPENER_WINDOW_NAME = 'rocketchat-main';

/**
 * Anything that isn't this conference opens away from it, leaving the call where it is.
 *
 * A route of the workspace's goes to the window that opened the call, which lands it in the app the reader
 * already has open rather than in a second copy of it: through the desktop bridge where the call window is a
 * window of its own with no opener, and by asking the opener otherwise. A new tab is the fallback, and is all
 * an address of somebody else's ever gets.
 */
const openElsewhere = (url: URL) => {
	const internal = url.origin === window.location.origin;
	const route = internal ? `${url.pathname}${url.search}${url.hash}` : undefined;

	if (route) {
		const openInMainWindow = window.videoCallWindow?.openInMainWindow;
		if (openInMainWindow) {
			openInMainWindow(route);
			return;
		}

		const opener = window.opener as Window | null;
		if (opener && !opener.closed) {
			try {
				opener.postMessage({ type: NAVIGATE_TO_ROUTE_MESSAGE, path: route }, window.location.origin);
				// `opener.focus()` cannot raise a background tab, but opening its name with no URL can — and does
				// not navigate it.
				if (!opener.name) {
					opener.name = OPENER_WINDOW_NAME;
				}
				window.open('', opener.name);
				return;
			} catch {
				// Opener gone or not reachable; fall through to a tab.
			}
		}
	}

	window.open(url.href, '_blank', 'noopener');
};

// The conference page lives in its own window; navigating it away (a chat link, a channel mention, an external
// URL) would tear down the call. This pins the window to the conference: in-page links (`?jump=`, `#hash`) are
// left untouched and everything else opens in a new tab. It covers both `<a href>` clicks and programmatic
// `router.navigate` (channel/user mentions, room links).
export const useConfinedNavigation = ({ onOpenThread }: { onOpenThread?: (tmid: string) => void } = {}) => {
	const router = useRouter();

	// Ref so the monkey-patched navigate always reads the latest callback without re-patching.
	const onOpenThreadRef = useRef(onOpenThread);
	onOpenThreadRef.current = onOpenThread;

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

			// Same page (e.g. `?jump=<msgId>` or `#hash`), or another conference — let the app handle it in place.
			if (url.origin === window.location.origin && (url.pathname === window.location.pathname || isConference(url))) {
				return;
			}

			// This click would navigate the conference window away — take over.
			event.preventDefault();
			event.stopPropagation();

			openElsewhere(url);
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

			// Thread navigation: the chat panel's thread clicks try to set tab=thread on a route that has
			// no such param — show the thread in a modal instead of letting the navigate fall through.
			if (
				onOpenThreadRef.current &&
				typeof toOrDelta === 'object' &&
				'params' in toOrDelta &&
				toOrDelta.params?.tab === 'thread' &&
				toOrDelta.params?.context
			) {
				onOpenThreadRef.current(toOrDelta.params.context);
				return;
			}

			let targetUrl: URL;
			try {
				targetUrl = new URL(router.buildRoutePath(toOrDelta), window.location.origin);
			} catch {
				original(toOrDelta, options);
				return;
			}

			// Same page (search/hash change only), or the conference this window is becoming — allow it. Anything
			// else would take the window off the call.
			if (targetUrl.pathname === window.location.pathname || isConference(targetUrl)) {
				original(toOrDelta, options);
				return;
			}

			openElsewhere(targetUrl);
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
