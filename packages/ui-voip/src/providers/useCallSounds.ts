import { useEffect } from 'react';

import type { State } from '../context/definitions.js';
import { useVoipSounds } from '../context/index.js';

export const useCallSounds = (state: State, subscribeCallEnded: (callback: () => void) => (() => void) | undefined) => {
	const voipSounds = useVoipSounds();

	useEffect(() => {
		if (state === 'calling') {
			return voipSounds.playDialer();
		}
		if (state === 'ringing') {
			return voipSounds.playRinger();
		}
		return undefined;
	}, [voipSounds, state]);

	useEffect(() => {
		return subscribeCallEnded(voipSounds.playCallEnded);
	}, [voipSounds, subscribeCallEnded]);
};
