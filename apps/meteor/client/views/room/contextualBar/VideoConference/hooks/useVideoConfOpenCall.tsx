import { useSetModal } from '@rocket.chat/ui-contexts';
import { useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';

import { asCallUrl } from '../../../../../lib/utils/asCallUrl';
import { useCallback } from 'react';

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
 * A call belongs in its own window rather than a tab in the user's strip.
 *
 * `noopener` is deliberately absent: it would make `window.open` return null, which is indistinguishable from a
 * blocked popup, and sever the link the conference page posts navigation requests back over. See [the feature
 * doc](../../../../../../../../docs/features/video-conference-persistent-chat/README.md#how-the-call-window-is-opened).
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
 * Absolute, because a relative address — a provider's `/room/42`, or the empty string a call with no URL yet
 * arrives as — would take our origin and open the workspace at some arbitrary route in the call window. Our own
 * conference URLs are built with `absoluteUrl`, so none of them is turned away. `http:`/`https:` only, because a
 * `javascript:` or `data:` "URL" is not somewhere to go but something to run, in a window we opened for it.
 */
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
 * Severed from this window, because with a live `window.opener` a provider page could navigate the tab the user
 * came from — a login screen being the obvious thing to imitate. Opened blank, so it is still same-origin and
 * `opener` can be cleared, and only then sent to the provider: `noopener` would return null instead of the
 * handle `useLeaveCallOnWindowClose` watches.
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
	//
	// Same origin is not enough to earn the shared window: a provider or a calendar entry can hand over any
	// address on this workspace, and loading `/admin/settings` into the window every conference shares would
	// take the call down with it. Matched as a path segment, so a site served under a root prefix still counts.
	if (url.origin !== window.location.origin || !/(^|\/)conference\/[^/]+$/.test(url.pathname)) {
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
	const conferenceWindowEnabled = useVideoConfWindowEnabled();

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
