import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import VideoConfBlockModal from '../VideoConfBlockModal';

type WindowMaybeDesktop = typeof window & {
	RocketChatDesktop?: {
		openInternalVideoChatWindow?: (url: string, options: undefined) => void;
	};
};

export const useVideoOpenCall = () => {
	const setModal = useSetModal();

	const handleOpenCall = useCallback(
		(callUrl: string) => {
			const windowMaybeDesktop = window as WindowMaybeDesktop;
			if (windowMaybeDesktop.RocketChatDesktop?.openInternalVideoChatWindow) {
				windowMaybeDesktop.RocketChatDesktop.openInternalVideoChatWindow(callUrl, undefined);
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
