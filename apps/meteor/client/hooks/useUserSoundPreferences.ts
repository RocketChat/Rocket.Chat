import { useUserPreference } from '@rocket.chat/ui-contexts';

const relativeVolume = (volume: number, masterVolume: number) => (volume * masterVolume) / 100;

export const useUserSoundPreferences = () => {
	const masterVolume = useUserPreference<number>('masterVolume', 100) ?? 100;
	const notificationsSoundVolume = useUserPreference<number>('notificationsSoundVolume', 100) ?? 100;
	const voipRingerVolume = useUserPreference<number>('voipRingerVolume', 100) ?? 100;

	return {
		masterVolume,
		notificationsSoundVolume: relativeVolume(notificationsSoundVolume, masterVolume),
		voipRingerVolume: relativeVolume(voipRingerVolume, masterVolume),
	};
};
