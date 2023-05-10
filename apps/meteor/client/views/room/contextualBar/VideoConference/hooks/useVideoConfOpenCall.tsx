import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { getDesktopApp } from '../../../../../lib/utils/getDesktopApp';
import VideoConfBlockModal from '../VideoConfBlockModal';

export const useVideoConfOpenCall = () => {
	const setModal = useSetModal();

	const handleOpenCall = useCallback(
		(callUrl: string) => {
			const desktopApp = getDesktopApp();

			if (desktopApp?.openInternalVideoChatWindow) {
				desktopApp.openInternalVideoChatWindow(callUrl, undefined);
			} else {
				const open = () => window.open(callUrl);
				const popup = open();

				if (popup !== null) {
					return;
				}

				setModal(<VideoConfBlockModal onClose={(): void => setModal(null)} onConfirm={open} />);
			}
		},
		[setModal],
	);

	return handleOpenCall;
};
