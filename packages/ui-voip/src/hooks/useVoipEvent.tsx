import { useContext, useMemo, useRef, useSyncExternalStore } from 'react';

import { VoipContext } from '../contexts/VoipContext';
import type { VoipEvents } from '../lib/VoipClient';

export const useVoipEvent = <E extends keyof VoipEvents>(eventName: E, initialValue: VoipEvents[E]) => {
	const { voipClient } = useContext(VoipContext);
	const initValue = useRef(initialValue);

	const [subscribe, getSnapshot] = useMemo(() => {
		let state: VoipEvents[E] = initValue.current;

		const getSnapshot = (): VoipEvents[E] => state;
		const callback = (cb: () => void) => {
			if (!voipClient) return () => undefined;

			return voipClient.on(eventName, (event?: VoipEvents[E]): void => {
				state = event as VoipEvents[E];
				cb();
			});
		};

		return [callback, getSnapshot];
	}, [eventName, voipClient]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
