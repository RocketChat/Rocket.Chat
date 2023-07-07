import { useCustomSound, useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { getUserPreference } from '../../../../app/utils/client';

type VoipSound = 'telephone' | 'outbound-call-ringing' | 'call-ended';

export const useVoipSounds = () => {
	const { play, pause } = useCustomSound();
	const user = useUser();

	return useMemo(
		() => ({
			play: (soundId: VoipSound, loop = true) => {
				const audioVolume = getUserPreference(user, 'notificationsSoundVolume', 100) as number;
				play(soundId, {
					volume: Number((audioVolume / 100).toPrecision(2)),
					loop,
				});
			},
			stop: (soundId: VoipSound) => pause(soundId),
			stopAll: () => {
				pause('telephone');
				pause('outbound-call-ringing');
			},
		}),
		[play, pause, user],
	);
};
