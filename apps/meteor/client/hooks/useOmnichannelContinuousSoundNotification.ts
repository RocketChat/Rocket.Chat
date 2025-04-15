import { useCustomSound, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

const query = { t: 'l', ls: { $exists: false }, open: true };
export const useOmnichannelContinuousSoundNotification = <T>(queue: T[]) => {
	const userSubscriptions = useUserSubscriptions(query);
	const { notificationSounds } = useCustomSound();

	const playNewRoomSoundContinuously = useSetting('Livechat_continuous_sound_notification_new_livechat_room');

	const hasUnreadRoom = userSubscriptions.length > 0 || queue.length > 0;

	useEffect(() => {
		if (!playNewRoomSoundContinuously) {
			return;
		}

		if (!hasUnreadRoom) {
			return;
		}

		notificationSounds.playNewMessageLoop();

		return () => {
			notificationSounds.stopNewRoom();
		};
	}, [playNewRoomSoundContinuously, userSubscriptions, hasUnreadRoom, notificationSounds]);
};
