import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import VideoConfBlockModal from '../VideoConfBlockModal';

// Shared window name for in-product (same-origin) conferences, so we never stack duplicate tabs even
// if the reference below is lost (e.g. the main app reloaded).
const CONFERENCE_WINDOW_NAME = 'rocketchat-conference';

// Reference to the conference tab we opened and the conference URL it's showing. Lets us focus the
// same conference without reloading, navigate it when a different one is requested, and re-open it
// once it's closed.
let conferenceWindow: Window | null = null;
let conferenceWindowUrl: string | null = null;

export const useVideoConfOpenCall = () => {
	const setModal = useSetModal();

	const handleOpenCall = useCallback(
		(callUrl: string, providerName?: string) => {
			const desktopApp = window.RocketChatDesktop;

			if (!desktopApp?.openInternalVideoChatWindow) {
				const open = () => {
					let isSameOrigin = false;
					try {
						isSameOrigin = new URL(callUrl, window.location.href).origin === window.location.origin;
					} catch {
						// Not a valid/absolute URL — fall back to a plain new tab below.
					}

					// External provider URLs keep opening in their own tab.
					if (!isSameOrigin) {
						return window.open(callUrl);
					}

					const isAlive = Boolean(conferenceWindow) && !conferenceWindow?.closed;

					// Same conference already open → focus it without reloading (empty URL = no navigation).
					if (isAlive && conferenceWindowUrl === callUrl) {
						return window.open('', CONFERENCE_WINDOW_NAME) ?? conferenceWindow;
					}

					// New or different conference → open/navigate the shared tab and focus it.
					conferenceWindow = window.open(callUrl, CONFERENCE_WINDOW_NAME);
					conferenceWindowUrl = conferenceWindow ? callUrl : null;
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
