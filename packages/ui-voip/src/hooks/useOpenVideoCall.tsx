import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useActiveCallWindow } from '../providers/useMediaSessionInstance';
import { PopupBlockedModal } from '../views';

export const useOpenVideoCall = () => {
	const setModal = useSetModal();
	const activeWindow = useActiveCallWindow();

	return useCallback(
		(url: string, providerName?: string) => {
			const desktopApp = window.RocketChatDesktop;

			if (desktopApp?.openInternalVideoChatWindow) {
				desktopApp.openInternalVideoChatWindow(url, { providerName });
				return;
			}

			const popup = activeWindow.open(url);

			if (popup === null) {
				setModal(<PopupBlockedModal onClose={() => setModal(null)} onConfirm={() => activeWindow.open(url)} />);
			}
		},
		[activeWindow, setModal],
	);
};
