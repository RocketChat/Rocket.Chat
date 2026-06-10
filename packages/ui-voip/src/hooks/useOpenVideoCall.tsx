import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { PopupBlockedModal } from '../views';

export const useOpenVideoCall = () => {
	const setModal = useSetModal();

	return useCallback(
		(url: string, providerName?: string) => {
			const desktopApp = window.RocketChatDesktop;

			if (desktopApp?.openInternalVideoChatWindow) {
				desktopApp.openInternalVideoChatWindow(url, { providerName });
				return;
			}

			const popup = window.open(url);

			if (popup === null) {
				setModal(<PopupBlockedModal onClose={() => setModal(null)} onConfirm={() => window.open(url)} />);
			}
		},
		[setModal],
	);
};
