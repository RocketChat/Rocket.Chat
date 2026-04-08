import type { IMediaCall } from '@rocket.chat/core-typings';
import type { CallRole, ServerMediaSignalRemoteSDP } from '@rocket.chat/media-signaling';
import { MediaCallNegotiations } from '@rocket.chat/models';

export async function getInitialOfferSignal(call: IMediaCall, role: CallRole): Promise<ServerMediaSignalRemoteSDP | null> {
	// Since the initial offer is always provided by the caller, they don't need to receive it from the server
	if (role !== 'callee') {
		return null;
	}

	const { [role]: actor } = call;
	if (!actor.contractId) {
		return null;
	}

	const negotiation = await MediaCallNegotiations.findLatestByCallId(call._id);
	if (!negotiation?.offer) {
		return null;
	}

	return {
		callId: call._id,
		toContractId: actor.contractId,
		type: 'remote-sdp',
		sdp: negotiation.offer,
		negotiationId: negotiation._id,
		streams: negotiation.offerStreams,
	};
}
