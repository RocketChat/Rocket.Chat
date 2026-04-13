import type { IMediaCall } from '@rocket.chat/core-typings';
import type { CallFlag, CallRole, ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';

import { getNewCallTransferredBy } from './getNewCallTransferredBy';

function getCallFlags(call: IMediaCall, role: CallRole): CallFlag[] {
	const flags: CallFlag[] = [];

	const isInternal = call.caller.type === 'user' && call.callee.type === 'user';
	const shouldCreateDataChannel = isInternal && role === 'caller';

	if (isInternal) {
		flags.push('internal');

		if (shouldCreateDataChannel) {
			flags.push('create-data-channel');
		}
	}

	return flags;
}

export function buildNewCallSignal(call: IMediaCall, role: CallRole): ServerMediaSignalNewCall {
	const self = role === 'caller' ? call.caller : call.callee;
	const contact = role === 'caller' ? call.callee : call.caller;
	const transferredBy = getNewCallTransferredBy(call);
	const flags = getCallFlags(call, role);

	return {
		callId: call._id,
		type: 'new',
		service: call.service,
		kind: call.kind,
		role,
		self: { ...self },
		contact: { ...contact },
		flags,
		...(call.parentCallId && { replacingCallId: call.parentCallId }),
		...(transferredBy && { transferredBy }),
		...(call.callerRequestedId && role === 'caller' && { requestedCallId: call.callerRequestedId }),
	};
}
