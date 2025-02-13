import { useCustomSound } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useUserSoundPreferences } from '../../../hooks/useUserSoundPreferences';

type VoipSound = 'telephone' | 'outbound-call-ringing' | 'call-ended';

export const useVoipSounds = () => {
	const { play, pause } = useCustomSound();
	const { voipRingerVolume } = useUserSoundPreferences();

	return useMemo(
		() => ({
			play: (soundId: VoipSound, loop = true) => {
				play(soundId, {
					volume: Number((voipRingerVolume / 100).toPrecision(2)),
					loop,
				});
			},
			stop: (soundId: VoipSound) => pause(soundId),
			stopAll: () => {
				pause('telephone');
				pause('outbound-call-ringing');
			},
		}),
		[play, pause, voipRingerVolume],
	);
};
