import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { getOppositeChannel } from '../channels/getOppositeChannel';
import { requestChannelOffer } from '../channels/requestChannelOffer';
import { compareParticipantAndActor } from '../utils/compareParticipantAndActor';

export async function acknowledgeCallee(call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	// If we're not the callee, or we are a different callee session than the one where the call was accepted, do nothing
	if (!compareParticipantAndActor(channel.participant, call.callee)) {
		return;
	}

	const callerChannel = await getOppositeChannel(call, channel);

	// Change the call state from 'none' to 'ringing' when any callee session is found
	const result = await MediaCalls.startRingingById(call._id);

	// If the state was changed and the caller channel is set, request the webrtc offer from the caller
	if (result.modifiedCount && callerChannel) {
		await requestChannelOffer(callerChannel);
	}
}
