import { useContext, useMemo, useRef } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { VoipContext } from '../contexts/VoipContext';
import type VoIPClient from '../lib/VoipClient';

export const useVoipEffect = <T,>(transform: (voipClient: VoIPClient) => T, initialValue: T) => {
	const { voipClient } = useContext(VoipContext);
	const initValue = useRef<T>(initialValue);
	const transformFn = useRef(transform);

	const [subscribe, getSnapshot] = useMemo(() => {
		let state: T = initValue.current;

		const getSnapshot = (): T => state;
		const subscribe = (cb: () => void) => {
			if (!voipClient) return () => undefined;

			state = transformFn.current(voipClient);
			return voipClient.on('stateChanged', (): void => {
				state = transformFn.current(voipClient);
				cb();
			});
		};

		return [subscribe, getSnapshot];
	}, [voipClient]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
