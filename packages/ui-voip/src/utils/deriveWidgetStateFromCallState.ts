import type { CallRole, CallState } from '@rocket.chat/media-signaling';

import type { State } from '../context/definitions';

export const deriveWidgetStateFromCallState = (
	callState: CallState,
	callRole: CallRole,
): Extract<State, 'ongoing' | 'ringing' | 'calling'> | undefined => {
	switch (callState) {
		case 'active':
		case 'accepted':
		case 'renegotiating':
			return 'ongoing';
		case 'none':
		case 'ringing':
			return callRole === 'callee' ? 'ringing' : 'calling';
		default:
			return undefined;
	}
};
