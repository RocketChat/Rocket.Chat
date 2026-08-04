import type { IMediaCall } from '@rocket.chat/core-typings';
import { isPendingState } from '@rocket.chat/media-signaling';
import type { CallFeature, CallNotification, CallRole, ServerMediaSignalNotification } from '@rocket.chat/media-signaling';

function getStateForNotification(call: IMediaCall): CallNotification | null {
	if (call.ended || call.state === 'hangup') {
		return 'hangup';
	}

	if (call.state === 'active') {
		return 'active';
	}

	if (isPendingState(call.state) || !call.callee.contractId) {
		return null;
	}

	return 'accepted';
}

export function getStateNotification(call: IMediaCall, role: CallRole): ServerMediaSignalNotification | null {
	const state = getStateForNotification(call);
	if (!state) {
		return null;
	}

	const actor = call[role];

	return {
		callId: call._id,
		type: 'notification',
		notification: state,
		...(actor.contractId && { signedContractId: actor.contractId }),
		features: call.features as CallFeature[],
	};
}
