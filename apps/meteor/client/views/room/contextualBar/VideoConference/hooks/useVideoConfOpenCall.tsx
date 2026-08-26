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
 * `noopener` is deliberately absent: the conference page posts navigation requests back to its opener (see
 * `useConfinedNavigation`), and `noopener` would both sever that link and make `window.open` return null.
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
 * The conference window: one window shared by every in-product conference, focused rather than reloaded when
 * the conference it already shows is asked for again.
 */
const openConferenceWindow = (callUrl: string): Window | null => {
	let target: URL | undefined;
	try {
		const url = new URL(callUrl, window.location.href);
		if (url.origin === window.location.origin) {
			target = url;
		}
	} catch {
		// Not a valid/absolute URL — fall back to an unnamed window below.
	}

	// External provider URLs get a window of their own each time.
	if (!target) {
		return openCallWindow(callUrl, '_blank');
	}

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
