import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import VideoConfBlockModal from '../VideoConfBlockModal';

// Shared window name for in-product (same-origin) conferences, so we never stack duplicate tabs even
// if the reference below is lost (e.g. the main app reloaded).
const CONFERENCE_WINDOW_NAME = 'rocketchat-conference';

// Reference to the conference tab we opened. Lets us focus the same conference without reloading,
// navigate it when a different one is requested, and re-open it once it's closed.
let conferenceWindow: Window | null = null;

export const useVideoConfOpenCall = () => {
	const setModal = useSetModal();

	const handleOpenCall = useCallback(
		(callUrl: string, providerName?: string) => {
			const desktopApp = window.RocketChatDesktop;

			if (!desktopApp?.openInternalVideoChatWindow) {
				const open = () => {
					let target: URL | undefined;
					try {
						const url = new URL(callUrl, window.location.href);
						if (url.origin === window.location.origin) {
							target = url;
						}
					} catch {
						// Not a valid/absolute URL — fall back to a plain new tab below.
					}

					// External provider URLs keep opening in their own tab.
					if (!target) {
						return window.open(callUrl);
					}

					const isAlive = Boolean(conferenceWindow) && !conferenceWindow?.closed;

					// The conference tab is same-origin, so check what it's *actually* showing rather than
					// the URL we last passed (which can differ in string form between the start/join paths).
					// If it's already on this conference, focus it without reloading (empty URL = no navigation).
					if (isAlive) {
						let showsSameConference = false;
						try {
							showsSameConference = conferenceWindow?.location.pathname === target.pathname;
						} catch {
							// Conference tab navigated cross-origin (not our in-product conference).
						}

						if (showsSameConference) {
							return window.open('', CONFERENCE_WINDOW_NAME) ?? conferenceWindow;
						}
					}

					// New or different conference → open/navigate the shared tab and focus it.
					conferenceWindow = window.open(callUrl, CONFERENCE_WINDOW_NAME);
					return conferenceWindow;
				};
				const popup = open();

				if (popup !== null) {
					return;
				}

				setModal(<VideoConfBlockModal onClose={(): void => setModal(null)} onConfirm={open} />);
				return;
			}
			desktopApp.openInternalVideoChatWindow(callUrl, { providerName });
		},
		[setModal],
	);

	return handleOpenCall;
};
