import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { PeerInfo } from './MediaCallContext';
import { SessionInfo } from './useMediaSessionInstance';

const getDisplayInfo = (peerInfo?: PeerInfo) => {
	if (!peerInfo) {
		return undefined;
	}

	if ('number' in peerInfo) {
		return { title: peerInfo.number };
	}
	if ('displayName' in peerInfo) {
		return { title: peerInfo.displayName, avatar: peerInfo.avatarUrl };
	}
	return undefined;
};

export const useDesktopNotifications = (sessionInfo: SessionInfo) => {
	const { t } = useTranslation();

	const displayInfo = getDisplayInfo(sessionInfo.peerInfo);

	useEffect(() => {
		if (sessionInfo.state !== 'ringing') {
			return;
		}

		if (!displayInfo?.title) {
			return;
		}

		window.RocketChatDesktop?.dispatchCustomNotification({
			type: 'voice',
			id: sessionInfo.callId,
			payload: {
				title: displayInfo.title,
				body: t('Incoming_call'),
				avatar: displayInfo.avatar,
				requireInteraction: true,
			},
		});
	}, [displayInfo?.avatar, displayInfo?.title, sessionInfo.callId, sessionInfo.state, t]);
};
