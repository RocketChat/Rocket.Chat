import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { deliverChannelSDP } from '../channels/deliverChannelSDP';
import { getActorChannel } from '../channels/getActorChannel';
// import { requestChannelOffer } from '../channels/requestChannelOffer';
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

	const offer = callerChannel.localDescription;

	// If the caller doesn't have a webrtc offer yet, we need to wait for it
	if (!offer) {
		// await requestChannelOffer(callerChannel);
		return;
	}

	if (offer.type !== 'offer') {
		logger.error({ msg: 'The local description of a caller channel is not an offer', local: offer });
		throw new Error('unexpected-state');
	}

	const calleeChannel = await getActorChannel(call._id, call.callee);
	if (!calleeChannel) {
		throw new Error('error-failed-to-locate-callee-channel');
	}

	await deliverChannelSDP(calleeChannel, {
		sdp: offer,
	});

	const validChannels = [callerChannel, calleeChannel].filter((channel) => isValidSignalChannel(channel));

	if (validChannels.length) {
		await sendSignalToChannels(validChannels, {
			type: 'notification',
			body: {
				notification: 'accepted',
			},
		});
	}
}
