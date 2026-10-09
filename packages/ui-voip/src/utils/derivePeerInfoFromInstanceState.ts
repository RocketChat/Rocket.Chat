import type { AnyMediaCallData } from '@rocket.chat/media-signaling';

import { derivePeerInfoFromInstanceContact } from './derivePeerInfoFromInstanceContact';
import type { UnknownPeerInfo } from '../context';

export const derivePeerInfoFromInstanceState = (callState: AnyMediaCallData) => {
	if (!callState.confirmed) {
		return {
			type: 'unknown',
			displayName: callState.title,
		} as UnknownPeerInfo;
	}

	return derivePeerInfoFromInstanceContact(callState.remoteParticipant.contact);
};
