import { useUserPreference } from '@rocket.chat/ui-contexts';

type SoundVolumePreference = 'notificationsSoundVolume' | 'voipRingerVolume';

/** The user's volume for one kind of sound, scaled by their master volume, from 0 to 100. */
export const useSoundVolume = (preference: SoundVolumePreference): number => {
	const masterVolume = useUserPreference<number>('masterVolume', 100) ?? 100;
	const volume = useUserPreference<number>(preference, 100) ?? 100;

	return (volume * masterVolume) / 100;
};
