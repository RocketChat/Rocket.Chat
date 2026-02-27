import { useCallback, useSyncExternalStore } from 'react';

import { useMediaCallInstance } from './MediaCallInstanceContext';
import { deriveWidgetStateFromCallState } from '../utils/deriveWidgetStateFromCallState';

export type PeekMediaSessionStateReturn = 'unavailable' | 'available' | 'ongoing' | 'ringing' | 'calling';

export const usePeekMediaSessionState = (): PeekMediaSessionStateReturn => {
	const { instance } = useMediaCallInstance();

	const subscribe = useCallback(
		(onStoreChange: () => void): (() => void) => {
			if (!instance) {
				return () => undefined;
			}
			return instance?.on('sessionStateChange', onStoreChange);
		},
		[instance],
	);

	const getSnapshot = useCallback(() => {
		if (!instance) {
			return 'unavailable';
		}

		const mainCall = instance.getMainCall();
		if (!mainCall) {
			return 'available';
		}

		const { state: callState, role } = mainCall;
		const state = deriveWidgetStateFromCallState(callState, role);
		if (!state) {
			return 'available';
		}

		return state;
	}, [instance]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
