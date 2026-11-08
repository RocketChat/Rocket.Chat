import { useMediaCallInstance } from './MediaCallInstanceContext';
import { useInstanceSnapshot } from './useInstanceSnapshot';
import { deriveWidgetStateFromCallState } from '../utils/deriveWidgetStateFromCallState';

export type PeekMediaSessionStateReturn = 'unavailable' | 'available' | 'ongoing' | 'ringing' | 'calling';

export const usePeekMediaSessionState = (): PeekMediaSessionStateReturn => {
	const { instance } = useMediaCallInstance();

	return useInstanceSnapshot(instance, (instance): PeekMediaSessionStateReturn => {
		if (!instance) {
			return 'unavailable';
		}

		const instanceState = instance.getState();
		if (!instanceState) {
			return 'available';
		}

		const {
			state: callState,
			localParticipant: { role },
		} = instanceState;

		return deriveWidgetStateFromCallState(callState, role) || 'available';
	});
};
