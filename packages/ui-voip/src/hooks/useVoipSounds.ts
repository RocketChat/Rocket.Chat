import { useCustomSound, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

type VoipSound = 'telephone' | 'outbound-call-ringing' | 'call-ended';

export const useVoipSounds = () => {
	const { play, pause } = useCustomSound();
	const masterVolume = useUserPreference<number>('masterVolume', 100) || 100;
	const voipRingerVolume = useUserPreference<number>('voipRingerVolume', 100) || 100;
	const audioVolume = Math.floor((voipRingerVolume * masterVolume) / 100);

	return useMemo(
		() => ({
			play: (soundId: VoipSound, loop = true) => {
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
		[play, pause, audioVolume],
	);
};
