import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalNotify } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { getNewCallSequence } from '../../calls/getNewCallSequence';
import { getOppositeChannel } from '../../channels/getOppositeChannel';
import { compareActorsIgnoringSession } from '../../utils/compareActorsIgnoringSession';
import { isValidSignalChannel } from '../isValidSignalChannel';
import { sendSignalToChannel } from '../sendSignalToChannel';

export async function processAccept(_signal: MediaSignalNotify<'accept'>, call: IMediaCall, channel: ValidSignalChannel): Promise<void> {
	if (channel.role === 'callee') {
		if (!compareActorsIgnoringSession(call.callee, channel.participant)) {
			// Someone else tried to accept the call... should we respond something?
			return;
		}
		const sessionId = (channel.participant.type === 'user' && channel.participant.sessionId) || undefined;

		const result = await MediaCalls.acceptCallById(call._id, sessionId);
		if (!result.modifiedCount) {
			// # nothing was changed by this acceptance... should we respond something?
			return;
		}

		const newSequence = await getNewCallSequence(channel.callId);
		await sendSignalToChannel(channel, {
			sequence: newSequence.sequence,
			type: 'notify',
			body: {
				notify: 'state',
				callState: 'accepted',
			},
		});

		const otherChannel = await getOppositeChannel(call, channel);
		if (otherChannel && isValidSignalChannel(otherChannel)) {
			await sendSignalToChannel(otherChannel, {
				sequence: newSequence.sequence,
				type: 'notify',
				body: {
					notify: 'state',
					callState: 'accepted',
				},
			});
		}

		return;
	}

	if (channel.role === 'caller' && call.caller.type === 'user' && !call.caller.sessionId) {
		const result = await MediaCalls.setCallerSessionIdById(call._id, channel.participant.sessionId);
		if (result.modifiedCount) {
			// #Todo: Calls initiated without a caller sessionId
		}
	}
}
