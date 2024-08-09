import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import VideoConfBlockModal from '../VideoConfBlockModal';

export const isDesktopApp = window.navigator.userAgent.includes('Electron');
const MAX_RETRIES = 30;

export const useVideoConfOpenCall = () => {
	const setModal = useSetModal();

	const handleOpenCall = useCallback(
		async (callUrl: string, providerName?: string | undefined) => {
			const desktopApp = window.RocketChatDesktop;

			if (isDesktopApp) {
				let attempts = 0;
				while (attempts < MAX_RETRIES && !desktopApp?.openInternalVideoChatWindow) {
					attempts++;
					console.log('Waiting for RocketChatDesktop to be ready... ', attempts);
					// eslint-disable-next-line no-await-in-loop
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}

			if (!desktopApp?.openInternalVideoChatWindow) {
				const open = () => window.open(callUrl);
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
