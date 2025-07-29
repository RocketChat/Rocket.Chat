import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalNotify } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { processEndedCall } from '../../calls/processEndedCall';
import { compareParticipantAndActor } from '../../utils/compareParticipantAndActor';
import { isValidSignalRole } from '../isValidSignalRole';

export async function processHangup(signal: MediaSignalNotify<'hangup'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	if (!isValidSignalRole(channel.role)) {
		throw new Error('error-invalid-role');
	}

	const actor = call[channel.role];

	// If the channel's participant doesn't match the actor assigned to the call for this role, do nothing
	if (!compareParticipantAndActor(channel.participant, actor)) {
		return;
	}

	const endedBy = { ...actor, ...(actor.type === 'user' && !actor.sessionId && { sessionId: channel.participant.sessionId }) };
	const reason = signal.body.reasonCode || 'normal';

	const stateResult = await MediaCalls.hangupCallById(call._id, { endedBy, reason });
	if (!stateResult.modifiedCount) {
		return;
	}

	return processEndedCall(call._id);
}
