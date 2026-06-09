import type { AnyMediaCallData } from '@rocket.chat/media-signaling';

import { derivePeerInfoFromInstanceContact } from './derivePeerInfoFromInstanceContact';

export const derivePeerInfoFromInstanceState = (callState: AnyMediaCallData) => {
	if (!callState.confirmed) {
		return {
			displayName: callState.title,
			userId: 'unknown',
			username: undefined,
			callerId: undefined,
		};
	}

	return derivePeerInfoFromInstanceContact(callState.remoteParticipant.contact);
};
