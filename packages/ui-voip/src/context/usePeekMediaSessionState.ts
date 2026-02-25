import { useEffect, useState } from 'react';

import { useMediaCallInstanceContext } from './MediaCallInstanceContext';
import { deriveWidgetStateFromCallState } from '../utils/deriveWidgetStateFromCallState';

export type PeekMediaSessionStateReturn = 'unavailable' | 'available' | 'ongoing' | 'ringing' | 'calling';

export const usePeekMediaSessionState = (): PeekMediaSessionStateReturn => {
	const { instance } = useMediaCallInstanceContext();
	const [state, setState] = useState<PeekMediaSessionStateReturn>(() => 'unavailable');

	// TODO useSyncExternalStore
	useEffect(() => {
		if (!instance) {
			setState('unavailable');
			return;
		}

		const updateState = () => {
			const mainCall = instance.getMainCall();
			if (!mainCall) {
				setState('available');
				return;
			}

			const { state: callState, role } = mainCall;
			const state = deriveWidgetStateFromCallState(callState, role);
			if (!state) {
				setState('available');
				return;
			}

			setState(state);
		};

		updateState();

		return instance.on('sessionStateChange', updateState);
	}, [instance]);

	return state;
};
