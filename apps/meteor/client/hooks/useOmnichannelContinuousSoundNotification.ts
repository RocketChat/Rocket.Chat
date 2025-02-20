import type { ICustomSound } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useUserSoundPreferences } from './useUserSoundPreferences';
import { CustomSounds } from '../../app/custom-sounds/client/lib/CustomSounds';

const query = { t: 'l', ls: { $exists: false }, open: true };
export const useOmnichannelContinuousSoundNotification = <T>(queue: T[]) => {
	const userSubscriptions = useUserSubscriptions(query);

	const playNewRoomSoundContinuously = useSetting('Livechat_continuous_sound_notification_new_livechat_room');

	const newRoomNotification = useUserPreference<string>('newRoomNotification');
	const { notificationsSoundVolume } = useUserSoundPreferences();

	const continuousCustomSoundId = newRoomNotification && `${newRoomNotification}-continuous`;

	const hasUnreadRoom = userSubscriptions.length > 0 || queue.length > 0;

	useEffect(() => {
		let audio: ICustomSound;
		if (playNewRoomSoundContinuously && continuousCustomSoundId) {
			audio = { ...CustomSounds.getSound(newRoomNotification), _id: continuousCustomSoundId };
			CustomSounds.add(audio);
		}

		return () => {
			if (audio) {
				CustomSounds.remove(audio);
			}
		};
	}, [continuousCustomSoundId, newRoomNotification, playNewRoomSoundContinuously]);

	useEffect(() => {
		if (!continuousCustomSoundId) {
			return;
		}
		if (!playNewRoomSoundContinuously) {
			CustomSounds.pause(continuousCustomSoundId);
			return;
		}

		if (!hasUnreadRoom) {
			CustomSounds.pause(continuousCustomSoundId);
			return;
		}

		CustomSounds.play(continuousCustomSoundId, {
			volume: notificationsSoundVolume,
			loop: true,
		});
	}, [continuousCustomSoundId, playNewRoomSoundContinuously, userSubscriptions, notificationsSoundVolume, hasUnreadRoom]);
};
