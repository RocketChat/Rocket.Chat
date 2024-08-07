import { useContext, useMemo, useRef } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { VoiceCallContext } from '../../../contexts/VoiceCallContext';
import type { VoiceCallEvents } from '../../../lib/voip/VoIPClient';

export const useVoiceCallEvent = <E extends keyof VoiceCallEvents>(eventName: E, initialValue: VoiceCallEvents[E]) => {
	const { voipClient } = useContext(VoiceCallContext);
	const initValue = useRef(initialValue);

	const [subscribe, getSnapshot] = useMemo(() => {
		let state: VoiceCallEvents[E] = initValue.current;

		const getSnapshot = (): VoiceCallEvents[E] => state;
		const callback = (cb: () => void) => {
			if (!voipClient) return () => undefined;

			return voipClient.on(eventName, (event?: VoiceCallEvents[E]): void => {
				state = event as VoiceCallEvents[E];
				cb();
			});
		};

		return [callback, getSnapshot];
	}, [eventName, voipClient]);

	return useSyncExternalStore(subscribe, getSnapshot);
};

export default useVoiceCallEvent;
