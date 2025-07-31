import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalAnswer } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { acknowledgeCallee } from '../calls/acknowledgeCallee';
import { acknowledgeCaller } from '../calls/acknowledgeCaller';
import { processAcceptedCall } from '../calls/processAcceptedCall';

async function processAccept(call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
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

async function processACK(call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	if (channel.role === 'callee') {
		return acknowledgeCallee(call, channel);
	}
	return acknowledgeCaller(call, channel);
}

export async function processAnswer(params: MediaSignalAnswer, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	console.log('processAnswer');

	switch (params.answer) {
		case 'ack':
			return processACK(call, channel);
		case 'accept':
			return processAccept(call, channel);
		case 'unavailable':
			break;
		case 'reject':
			break;
	}
}
