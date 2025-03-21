import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { CustomSounds } from '../../../app/custom-sounds/client/lib/CustomSounds';
import { useUserSoundPreferences } from '../useUserSoundPreferences';

export const useNewRoomNotification = () => {
	const newRoomNotification = useUserPreference<string>('newRoomNotification');
	const { notificationsSoundVolume } = useUserSoundPreferences();

	const notifyNewRoom = useCallback(() => {
		if (!newRoomNotification) {
			return;
		}

		void CustomSounds.play(newRoomNotification, {
			volume: Number((notificationsSoundVolume / 100).toPrecision(2)),
		});
	}, [newRoomNotification, notificationsSoundVolume]);

	return notifyNewRoom;
};
