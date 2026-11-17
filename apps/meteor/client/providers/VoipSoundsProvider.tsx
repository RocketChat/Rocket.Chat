import { useCustomSound } from '@rocket.chat/ui-contexts';
import { VoipSoundsContext } from '@rocket.chat/ui-voip';
import { useMemo, type ReactNode } from 'react';

import { useUserSoundPreferences } from '../hooks/useUserSoundPreferences';
import { formatVolume } from './CustomSoundProvider/lib/formatVolume';

export type VoipSoundsProviderProps = {
	children: ReactNode;
};

/** Plays the voice call sounds at the user's ringer volume. */
const VoipSoundsProvider = ({ children }: VoipSoundsProviderProps) => {
	const { play, stop } = useCustomSound();
	const { voipRingerVolume } = useUserSoundPreferences();

	const contextValue = useMemo(
		() => ({
			playRinger: () => play('telephone', { loop: true, volume: formatVolume(voipRingerVolume) }),
			playDialer: () => play('outbound-call-ringing', { loop: true, volume: formatVolume(voipRingerVolume) }),
			playCallEnded: () => play('call-ended', { loop: false, volume: formatVolume(voipRingerVolume) }),
			stopRinger: () => stop('telephone'),
			stopDialer: () => stop('outbound-call-ringing'),
			stopCallEnded: () => stop('call-ended'),
			stopAll: () => {
				stop('telephone');
				stop('outbound-call-ringing');
				stop('call-ended');
			},
		}),
		[play, stop, voipRingerVolume],
	);

	return <VoipSoundsContext.Provider value={contextValue}>{children}</VoipSoundsContext.Provider>;
};

export default VoipSoundsProvider;
