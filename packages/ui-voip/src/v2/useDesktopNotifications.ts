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

		// TODO: Prevent duplicate notifications if peerInfo changes
		// Probably save a reference to the call id and check if it's the same call
		window.RocketChatDesktop?.dispatchCustomNotification({
			type: 'voice',
			// id: callId,
			payload: {
				title: displayInfo.title,
				body: t('Incoming_call'),
				avatar: displayInfo.avatar,
				// requireInteraction: true,
				// silent: userStatus !== 'online' TODO: get the user status to decide if the notification should be silent. We might need to check some preferences too.
			},
		});
	}, [displayInfo?.avatar, displayInfo?.title, sessionInfo.state, t]);
};
