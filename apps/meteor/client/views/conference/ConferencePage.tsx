import { useRoute, useCurrentRoute, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import VideoConfBlockModal from '../room/contextualBar/VideoConference/VideoConfBlockModal';
import PageLoading from '../root/PageLoading';

type WindowMaybeDesktop = typeof window & {
	RocketChatDesktop?: {
		openInternalVideoChatWindow?: (url: string, options: undefined) => void;
	};
};

const ConferencePage = (): ReactElement => {
	const defaultRoute = useRoute('/');
	const setModal = useSetModal();
	const [, , queryParams] = useCurrentRoute();

	const callUrl = queryParams?.callUrl;

	useEffect(() => {
		if (!callUrl) {
			return defaultRoute.push();
		}

		const windowMaybeDesktop = window as WindowMaybeDesktop;
		if (windowMaybeDesktop.RocketChatDesktop?.openInternalVideoChatWindow) {
			windowMaybeDesktop.RocketChatDesktop.openInternalVideoChatWindow(callUrl, undefined);
		} else {
			const open = () => window.open(callUrl, '_blank', 'rel=noreferrer noopener width=720 height=500');

			const popup = open();

			if (popup !== null) {
				return;
			}

			setModal(<VideoConfBlockModal onClose={(): void => setModal(null)} onConfirm={open} />);
		}

		defaultRoute.push();
	}, [setModal, defaultRoute, callUrl]);

	return <PageLoading />;
};

export default ConferencePage;
