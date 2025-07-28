import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalNotify } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { processAcceptedCall } from '../../calls/processAcceptedCall';
import { compareParticipantAndActor } from '../../utils/compareParticipantAndActor';
import { isValidSignalRole } from '../isValidSignalRole';

export async function processAccept(_signal: MediaSignalNotify<'accept'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	if (!isValidSignalRole(channel.role)) {
		throw new Error('error-invalid-role');
	}

	// If the channel's participant doesn't match the actor assigned to the call for this role, do nothing
	if (!compareParticipantAndActor(channel.participant, call[channel.role])) {
		return;
	}

	const result = await MediaCalls.setActorSessionIdByIdAndRole(call._id, channel.participant.sessionId, channel.role);
	if (!result.modifiedCount) {
		// If nothing changed, the call already had a sessionId for this actor
		return;
	}

	// With session decided for this actor, let's try to move the call state to 'accepted'. This will only work if the other actor also has an assigned session
	const stateResult = await MediaCalls.acceptCallById(call._id);
	if (!stateResult.modifiedCount) {
		return;
	}

	// #ToDo: notify client if this throws any error
	return processAcceptedCall(call._id);
}
