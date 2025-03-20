import { useCallback, useContext, useRef, useSyncExternalStore } from 'react';

import { VoipContext } from '../contexts/VoipContext';
import type VoIPClient from '../lib/VoipClient';

export const useVoipEffect = <T,>(transform: (voipClient: VoIPClient) => T, initialValue: T) => {
	const { voipClient } = useContext(VoipContext);
	const stateRef = useRef<T>(initialValue);
	const transformFn = useRef(transform);

	const getSnapshot = useCallback(() => stateRef.current, []);

	const subscribe = useCallback(
		(cb: () => void) => {
			if (!voipClient) return () => undefined;

			stateRef.current = transformFn.current(voipClient);
			return voipClient.on('stateChanged', (): void => {
				stateRef.current = transformFn.current(voipClient);
				cb();
			});
		},
		[voipClient],
	);

	return useSyncExternalStore(subscribe, getSnapshot);
};
