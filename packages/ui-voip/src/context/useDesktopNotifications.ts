import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { PeerInfo } from './MediaCallContext';
import type { SessionInfo } from './useMediaSessionInstance';
import { convertAvatarUrlToPng } from '../utils/convertAvatarUrlToPng';

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
	const previousCallId = useRef<string | undefined>(undefined);
	const { t } = useTranslation();
	const desktopNotificationsEnabled = useUserPreference('desktopNotificationVoiceCalls');

	const displayInfo = getDisplayInfo(sessionInfo.peerInfo);
	useEffect(() => {
		if (!desktopNotificationsEnabled) {
			return;
		}

		if (
			typeof window.RocketChatDesktop?.dispatchCustomNotification !== 'function' ||
			typeof window.RocketChatDesktop?.closeCustomNotification !== 'function'
		) {
			return;
		}

		let isMounted = true;

		if (sessionInfo.state !== 'ringing') {
			if (previousCallId.current) {
				window.RocketChatDesktop.closeCustomNotification(previousCallId.current);
				previousCallId.current = undefined;
			}
			return;
		}

		if (!displayInfo?.title) {
			return;
		}

		const notifyDesktop = async () => {
			const avatarAsPng = await convertAvatarUrlToPng(displayInfo.avatar);

			if (!isMounted) {
				return;
			}

			window.RocketChatDesktop?.dispatchCustomNotification({
				type: 'voice',
				id: sessionInfo.callId,
				payload: {
					title: displayInfo.title,
					body: t('Incoming_call_ellipsis'),
					avatar: avatarAsPng || undefined,
					requireInteraction: true,
				},
			});
		};

		notifyDesktop();
		previousCallId.current = sessionInfo.callId;

		return () => {
			isMounted = false;
		};
	}, [displayInfo?.avatar, displayInfo?.title, sessionInfo.callId, sessionInfo.state, t, desktopNotificationsEnabled]);
};
