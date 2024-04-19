import type { ICustomSound } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomSounds } from '../../app/custom-sounds/client/lib/CustomSounds';

const query = { t: 'l', ls: { $exists: false }, open: true };
export const useContinuousSoundNotification = () => {
	const userSubscriptions = useUserSubscriptions(query);

	const playNewRoomSoundContinuously = useSetting('Livechat_continuous_sound_notification_new_livechat_room');

	const newRoomNotification = useUserPreference<string>('newRoomNotification') || '';
	const audioVolume = useUserPreference<number>('notificationsSoundVolume');

	const continuousCustomSoundId = `${newRoomNotification}-continuous`;

	const volume = audioVolume !== undefined ? Number((audioVolume / 100).toPrecision(2)) : 1;

	useEffect(() => {
		let audio: ICustomSound;
		if (playNewRoomSoundContinuously && newRoomNotification) {
			audio = { ...CustomSounds.getSound(newRoomNotification), _id: continuousCustomSoundId };

			if (audio) {
				CustomSounds.add(audio);
			}
		}

		return () => {
			if (audio) {
				CustomSounds.remove(audio);
			}
		};
	}, [continuousCustomSoundId, newRoomNotification, playNewRoomSoundContinuously]);

	useEffect(() => {
		if (!playNewRoomSoundContinuously) {
			CustomSounds.pause(continuousCustomSoundId);
			return;
		}

		if (userSubscriptions.length === 0) {
			CustomSounds.pause(continuousCustomSoundId);
			return;
		}

		CustomSounds.play(continuousCustomSoundId, {
			volume,
			loop: true,
		});
	}, [continuousCustomSoundId, newRoomNotification, playNewRoomSoundContinuously, userSubscriptions, volume]);
};
