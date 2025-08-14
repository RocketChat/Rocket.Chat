import { useCustomSound } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { State } from '../v2/MediaCallContext';

export const useCallSounds = (state: State, subscribeCallEnded: (callback: () => void) => (() => void) | undefined) => {
	const { voipSounds } = useCustomSound();

	useEffect(() => {
		if (state === 'calling') {
			return voipSounds.playDialer();
		}
		if (state === 'ringing') {
			return voipSounds.playRinger();
		}
	}, [voipSounds, state]);

	useEffect(() => {
		return subscribeCallEnded(voipSounds.playCallEnded);
	}, [voipSounds, subscribeCallEnded]);
};
