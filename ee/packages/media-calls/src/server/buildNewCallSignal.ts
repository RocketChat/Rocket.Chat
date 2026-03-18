import type { AnyMediaCall, MediaCallContact } from '@rocket.chat/core-typings';
import type { CallFlag, CallRole, ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';

import { getNewCallTransferredBy } from './getNewCallTransferredBy';

function getCallFlags(call: AnyMediaCall, role: CallRole): CallFlag[] {
	const flags: CallFlag[] = [];

	const isInternal = call.caller.type === 'user' && (call.kind === 'conference' || call.callee.type === 'user');
	const shouldCreateDataChannel = isInternal && role === 'caller';

	if (isInternal) {
		flags.push('internal');

		if (shouldCreateDataChannel) {
			flags.push('create-data-channel');
		}
	}

	return flags;
}

function getCallContacts(call: AnyMediaCall, role: CallRole, self: MediaCallContact): MediaCallContact[] {
	if (call.kind === 'direct') {
		if (role === 'caller') {
			return [call.callee];
		}
		return [call.caller];
	}

	if (role === 'caller') {
		return call.callees;
	}

	return [call.caller, ...call.callees.filter(({ type, id }) => type !== self.type || id !== self.id)];
}

export function buildNewCallSignal(call: AnyMediaCall, role: CallRole, self: MediaCallContact): ServerMediaSignalNewCall {
	const contacts = getCallContacts(call, role, self);

	const transferredBy = getNewCallTransferredBy(call);
	const flags = getCallFlags(call, role);

	return {
		callId: call._id,
		type: 'new',
		service: call.service,
		kind: call.kind,
		role,
		self: { ...self },
		contacts,
		flags,
		...(call.parentCallId && { replacingCallId: call.parentCallId }),
		...(transferredBy && { transferredBy }),
		...(call.callerRequestedId && role === 'caller' && { requestedCallId: call.callerRequestedId }),
		...(call.conferenceId && { conferenceId: call.conferenceId }),
	};
}
