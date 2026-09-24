import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import VideoConfBlockModal from '../VideoConfBlockModal';

/** Named, so a second call reuses the tab even when the reference below was lost to a reload of the app. */
const CONFERENCE_WINDOW_NAME = 'rocketchat-conference';

/** The tab this app opened a call in, so the same call can be raised rather than reloaded. */
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
						// Not a URL we can reason about; a plain tab it is.
					}

					// A provider's own address is its own tab, as it always was.
					if (!target) {
						return window.open(callUrl);
					}

					// Compared against what the tab is actually showing rather than the address last passed to it:
					// starting a call and joining one produce different strings for the same conference.
					if (conferenceWindow && !conferenceWindow.closed) {
						let showsSameConference = false;
						try {
							showsSameConference = conferenceWindow.location.pathname === target.pathname;
						} catch {
							// Navigated somewhere cross-origin, so it is not showing this conference.
						}

						// Opening a name with no URL raises the tab without reloading the call inside it.
						if (showsSameConference) {
							return window.open('', CONFERENCE_WINDOW_NAME) ?? conferenceWindow;
						}
					}

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
