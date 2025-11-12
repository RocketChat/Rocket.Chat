import type { CustomNotificationOptions } from '@rocket.chat/desktop-api';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { PeerInfo } from './MediaCallContext';
import { SessionInfo } from './useMediaSessionInstance';

const getDisplayInfo = (peerInfo: PeerInfo) => {
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

	const dispatch = useDebouncedCallback(
		(options: CustomNotificationOptions) => {
			window.RocketChatDesktop?.dispatchCustomNotification(options);
		},
		1000,
		[window.RocketChatDesktop?.dispatchCustomNotification],
	);

	useEffect(() => {
		if (!window.RocketChatDesktop?.dispatchCustomNotification || sessionInfo.state !== 'ringing') {
			return;
		}

		const displayInfo = getDisplayInfo(sessionInfo.peerInfo);

		if (!displayInfo) {
			return;
		}

		// TODO: Prevent duplicate notifications if peerInfo changes
		// Probably save a reference to the call id and check if it's the same call
		dispatch({
			type: 'voice',
			payload: {
				title: displayInfo.title,
				body: t('Incoming_call'),
				avatar: displayInfo.avatar,
				// silent: userStatus !== 'online' TODO: get the user status to decide if the notification should be silent. We might need to check some preferences too.
			},
		});
	}, [dispatch, sessionInfo.peerInfo, sessionInfo.state, t]);
};
