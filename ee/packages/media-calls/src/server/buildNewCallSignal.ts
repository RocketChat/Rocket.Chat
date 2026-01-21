import type { IMediaCall } from '@rocket.chat/core-typings';
import type { CallFlag, CallRole, ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';
import type { VideoGrant } from 'livekit-server-sdk';
import { AccessToken } from 'livekit-server-sdk';

import { getNewCallTransferredBy } from './getNewCallTransferredBy';

function getCallFlags(call: IMediaCall, role: CallRole): CallFlag[] {
	const flags: CallFlag[] = [];

	const isInternal = call.caller.type === 'user' && call.callee.type === 'user';
	const shouldCreateDataChannel = isInternal && role === 'caller';

	if (isInternal) {
		flags.push('internal');

		if (shouldCreateDataChannel) {
			flags.push('create-data-channel');
		}
	}

	return flags;
}

async function getToken(participantName: string): Promise<string> {
	const roomName = 'name-of-room';
	const at = new AccessToken('devkey', 'secret', {
		identity: participantName,
	});
	const videoGrant: VideoGrant = {
		room: roomName,
		roomCreate: true,
		roomJoin: true,
		canPublish: true,
		canSubscribe: true,
	};

	at.addGrant(videoGrant);

	const token = await at.toJwt();
	console.log('access token', token);
	return token;
}

export async function buildNewCallSignal(call: IMediaCall, role: CallRole): Promise<ServerMediaSignalNewCall> {
	const self = role === 'caller' ? call.caller : call.callee;
	const contact = role === 'caller' ? call.callee : call.caller;
	const transferredBy = getNewCallTransferredBy(call);
	const flags = getCallFlags(call, role);

	const token = await getToken(self.id);

	return {
		callId: call._id,
		type: 'new',
		service: call.service,
		kind: call.kind,
		role,
		self: { ...self },
		contact: { ...contact },
		flags,
		...(call.parentCallId && { replacingCallId: call.parentCallId }),
		...(transferredBy && { transferredBy }),
		...(call.callerRequestedId && role === 'caller' && { requestedCallId: call.callerRequestedId }),
		token,
	};
}
