import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { getNewCallSequence } from './getNewCallSequence';
import { getActorChannel } from '../channels/getActorChannel';
// import { requestChannelOffer } from '../channels/requestChannelOffer';
import { setRemoteSDP } from '../channels/setRemoteSDP';
import { isValidSignalChannel } from '../signals/isValidSignalChannel';
import { sendSignalToChannels } from '../signals/sendSignalToChannels';
import { logger } from '../utils/logger';

export async function processAcceptedCall(callId: IMediaCall['_id']): Promise<void> {
	const call = await MediaCalls.findOneById(callId);
	if (!call) {
		throw new Error('error-failed-to-accept-call');
	}

	const callerChannel = await getActorChannel(call._id, call.caller);
	if (!callerChannel) {
		throw new Error('error-failed-to-locate-caller-channel');
	}

	const offer = callerChannel.webrtc?.local;

	// If the caller doesn't have a webrtc offer yet, we need to wait for it
	if (!offer) {
		// await requestChannelOffer(callerChannel);
		return;
	}

	if (offer.description?.type !== 'offer') {
		logger.error({ msg: 'The local description of a caller channel is not an offer', local: offer });
		throw new Error('unexpected-state');
	}

	const calleeChannel = await getActorChannel(call._id, call.callee);
	if (!calleeChannel) {
		throw new Error('error-failed-to-locate-callee-channel');
	}

	// If the callee doesn't have the offer yet, set it and request an answer, but do not wait for it
	if (!calleeChannel.webrtc?.remote) {
		await setRemoteSDP(
			calleeChannel,
			{
				sdp: offer.description,
				endOfCandidates: offer.iceGatheringComplete,
			},
			offer.assignSequence,
		);
	}

	const validChannels = [callerChannel, calleeChannel].filter((channel) => isValidSignalChannel(channel));

	if (validChannels.length) {
		const newSequence = await getNewCallSequence(callId);
		if (newSequence) {
			await sendSignalToChannels(validChannels, {
				sequence: newSequence.sequence,
				type: 'notify',
				body: {
					notify: 'accept',
				},
			});
		}
	}
}
