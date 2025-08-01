import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { compareParticipantAndActor } from '../utils/compareParticipantAndActor';

export async function acknowledgeCallee(call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	// If we're not the callee, or we are a different callee session than the one where the call was accepted, do nothing
	if (!compareParticipantAndActor(channel.participant, call.callee)) {
		return;
	}

	// Change the call state from 'none' to 'ringing' when any callee session is found
	await MediaCalls.startRingingById(call._id);
}
