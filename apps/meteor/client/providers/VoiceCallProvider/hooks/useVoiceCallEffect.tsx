import { useContext, useMemo, useRef } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { VoiceCallContext } from '../../../contexts/VoiceCallContext';
import type VoIPClient from '../../../lib/voip/VoIPClient';

export const useVoiceCallEffect = <T,>(transform: (voipClient: VoIPClient) => T, initialValue: T) => {
	const { voipClient } = useContext(VoiceCallContext);
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

export default useVoiceCallEffect;
