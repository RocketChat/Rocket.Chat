import { CallSoundsContext } from '@rocket.chat/ui-conference';
import { useCustomSound } from '@rocket.chat/ui-contexts';
import { useMemo, type ReactNode } from 'react';

import { useSoundVolume } from '../hooks/useSoundVolume';
import { formatVolume } from './CustomSoundProvider/lib/formatVolume';

export type CallSoundsProviderProps = {
	children: ReactNode;
};

/** Plays the video conference call sounds at the user's ringer volume. */
const CallSoundsProvider = ({ children }: CallSoundsProviderProps) => {
	const { play, stop } = useCustomSound();
	const voipRingerVolume = useSoundVolume('voipRingerVolume');

	const contextValue = useMemo(
		() => ({
			playRinger: () => play('ringtone', { loop: true, volume: formatVolume(voipRingerVolume) }),
			playDialer: () => play('dialtone', { loop: true, volume: formatVolume(voipRingerVolume) }),
			stopRinger: () => stop('ringtone'),
			stopDialer: () => stop('dialtone'),
		}),
		[play, stop, voipRingerVolume],
	);

	return <CallSoundsContext.Provider value={contextValue}>{children}</CallSoundsContext.Provider>;
};

export default CallSoundsProvider;
