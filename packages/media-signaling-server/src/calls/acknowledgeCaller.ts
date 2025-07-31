import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';

import { requestChannelOffer } from '../channels/requestChannelOffer';
import { compareParticipantAndActor } from '../utils/compareParticipantAndActor';

export async function acknowledgeCaller(call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	// If we're not the caller, or we are a different caller session than the one where the call was started, do nothing
	if (!compareParticipantAndActor(channel.participant, call.caller)) {
		return;
	}

	if (call.caller.type === 'user' && call.caller.sessionId) {
		await requestChannelOffer(channel, {});
	}
}
