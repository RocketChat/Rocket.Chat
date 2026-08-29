import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useConferenceWindowEnabled } from '../../../../conference/hooks/useConferenceWindowEnabled';
import VideoConfBlockModal from '../VideoConfBlockModal';

// Shared window name for in-product (same-origin) conferences, so we never stack duplicate windows even if
// the reference below is lost (e.g. the main app reloaded).
const CONFERENCE_WINDOW_NAME = 'rocketchat-conference';

// Reference to the conference window we opened. Lets us focus the same conference without reloading,
// navigate it when a different one is requested, and re-open it once it's closed.
let conferenceWindow: Window | null = null;

const POPOUT_WIDTH = 1280;
const POPOUT_HEIGHT = 800;

/**
 * A call belongs in its own window rather than a tab in the user's strip — it mirrors what the desktop app
 * does with its dedicated video window, and keeps the call visible while the user works in the main app.
 *
 * `noopener` is deliberately absent from the features: the conference page posts navigation requests back to
 * its opener (see `useConfinedNavigation`), and `noopener` would both sever that link and make `window.open`
 * return null — and the returned handle is what watches the window for closing, which is how leaving a call is
 * reported. An external provider gets cut loose a different way; see `openExternalCallWindow`.
 */
const popoutFeatures = (): string => {
	const width = Math.min(POPOUT_WIDTH, window.screen.availWidth);
	const height = Math.min(POPOUT_HEIGHT, window.screen.availHeight);
	const left = Math.round((window.screen.availWidth - width) / 2);
	const top = Math.round((window.screen.availHeight - height) / 2);

	return `popup=yes,width=${width},height=${height},left=${left},top=${top}`;
};

const isBlocked = (target: Window | null): boolean => !target || target.closed;

/**
 * The call's address, if it is one we are willing to send a window to: an absolute `http:` or `https:` URL.
 *
 * Absolute, because a relative one has no origin of its own and would take ours — so a provider's `/room/42`,
 * or the empty string a call with no URL yet arrives as, would be read as an in-product conference and open the
 * workspace at some arbitrary route in the call window. Resolving it against this page is what made those look
 * like ours; refusing them is the only honest reading, since handing one to a blank window resolves it against
 * this origin too. Our own conference URLs are built with `absoluteUrl`, so none of them is turned away.
 *
 * `http:`/`https:` only, because a `javascript:` or `data:` "URL" is not somewhere to go but something to run,
 * and it would run in whatever window we opened for it — which, until it navigates, is our own blank one.
 */
const asCallUrl = (candidate: string): URL | undefined => {
	try {
		// Deliberately no base: only an absolute address parses.
		const url = new URL(candidate);

		return url.protocol === 'https:' || url.protocol === 'http:' ? url : undefined;
	} catch {
		return undefined;
	}
};

/**
 * Opens the call as a popout, falling back to an ordinary tab when the popout is refused — some browsers
 * and extensions block popup-shaped windows while still allowing a plain one.
 */
const openCallWindow = (url: string, name: string): Window | null => {
	const popout = window.open(url, name, popoutFeatures());

	if (!isBlocked(popout)) {
		return popout;
	}

	return window.open(url, name);
};

/**
 * Opens an external provider's call — Jitsi, Meet, whatever the workspace is configured with.
 *
 * Severed from this window, because a provider page has no business reaching back into the workspace: with a
 * live `window.opener` it could navigate the tab the user came from to a page of its choosing, and a login
 * screen is the obvious one to imitate.
 *
 * Not `noopener` in the features, which would be the ordinary way to say this: that makes `window.open` return
 * null, and the handle is what `useLeaveCallOnWindowClose` watches to report the user leaving. So the window is
 * opened blank — still same-origin, so `opener` can be cleared — cut loose, and only then sent to the provider.
 */
const openExternalCallWindow = (url: string): Window | null => {
	const target = openCallWindow('', '_blank');

	if (isBlocked(target)) {
		return target;
	}

	try {
		(target as Window).opener = null;
	} catch {
		// A window that won't let go of its opener is still better opened than not: the provider is where the
		// user is trying to go, and refusing to take them there protects nobody.
	}

	(target as Window).location.replace(url);

	return target;
};

/**
 * The conference window: one window shared by every in-product conference, focused rather than reloaded when
 * the conference it already shows is asked for again.
 */
const openConferenceWindow = (callUrl: string): Window | null => {
	const url = asCallUrl(callUrl);
	if (!url) {
		return null;
	}

	// External provider URLs get a window of their own each time, and no way back to this one. Sent as given
	// rather than as parsed: `URL` normalises, and the provider's address is the provider's business.
	if (url.origin !== window.location.origin) {
		return openExternalCallWindow(callUrl);
	}

	const target = url;

	// The conference window is same-origin, so check what it's *actually* showing rather than the URL we last
	// passed (which can differ in string form between the start/join paths). If it's already on this conference,
	// focus it without reloading (empty URL = no navigation) and without passing features, which would otherwise
	// resize and recentre a window the user may have arranged.
	if (!isBlocked(conferenceWindow)) {
		let showsSameConference = false;
		try {
			// The search too, not only the path: a conference the user is *about to start* is identified by the
			// room in its query string, so two of those differ there and nowhere else.
			showsSameConference = conferenceWindow?.location.pathname === target.pathname && conferenceWindow?.location.search === target.search;
		} catch {
			// Conference window navigated cross-origin (not our in-product conference).
		}

		if (showsSameConference) {
			return window.open('', CONFERENCE_WINDOW_NAME) ?? conferenceWindow;
		}
	}

	// New or different conference → open/navigate the shared window and focus it.
	conferenceWindow = openCallWindow(callUrl, CONFERENCE_WINDOW_NAME);
	return conferenceWindow;
};

export const useVideoConfOpenCall = () => {
	const setModal = useSetModal();
	const conferenceWindowEnabled = useConferenceWindowEnabled();

	const handleOpenCall = useCallback(
		(callUrl: string, providerName?: string): Window | null | undefined => {
			const desktopApp = window.RocketChatDesktop;

			if (desktopApp?.openInternalVideoChatWindow) {
				desktopApp.openInternalVideoChatWindow(callUrl, { providerName });
				return undefined;
			}

			// Nothing openable — a call with no URL yet, or an address that isn't a web address at all. Saying the
			// popup was blocked would be a lie with advice attached: allowing popups can't make this succeed, and
			// the modal's retry would refuse it again. Nothing opened, so there is nothing to report either.
			if (conferenceWindowEnabled && !asCallUrl(callUrl)) {
				return null;
			}

			// Without the call window a call is an ordinary new tab, exactly as it always was: no popup features
			// for a browser to refuse, and no window shared between calls.
			const open = conferenceWindowEnabled ? () => openConferenceWindow(callUrl) : () => window.open(callUrl);

			// The window is handed back so the caller can watch it — see `useLeaveCallOnWindowClose`, which is what
			// notices a call window disappearing before it could report its own departure.
			const target = open();

			// A plain tab is blocked only by `window.open` returning null, which is the test this has always made.
			// A popout can also come back already closed, which is how some blockers refuse one.
			const blocked = conferenceWindowEnabled ? isBlocked(target) : target === null;

			if (!blocked) {
				return target;
			}

			setModal(<VideoConfBlockModal onClose={(): void => setModal(null)} onConfirm={open} />);

			return null;
		},
		[conferenceWindowEnabled, setModal],
	);

	return handleOpenCall;
};
