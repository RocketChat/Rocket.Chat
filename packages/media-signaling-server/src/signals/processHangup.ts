import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalHangup } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { processEndedCall } from '../calls/processEndedCall';

export async function processHangup(params: MediaSignalHangup, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	console.log('processHangup');

	const actor = call[channel.role];

	const endedBy = { ...actor, ...(actor.type === 'user' && !actor.sessionId && { sessionId: channel.participant.sessionId }) };
	const { reason } = params;

	const stateResult = await MediaCalls.hangupCallById(call._id, { endedBy, reason });
	if (!stateResult.modifiedCount) {
		return;
	}

	return processEndedCall(call);
}
