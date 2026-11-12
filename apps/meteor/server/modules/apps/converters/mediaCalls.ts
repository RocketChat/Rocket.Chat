import type {
	IMediaCall as IAppsMediaCall,
	IMediaCallActor as IAppsMediaCallActor,
	IMediaCallContact as IAppsMediaCallContact,
	MediaCallOrigin,
} from '@rocket.chat/apps-engine/definition/mediaCalls';
import type { IMediaCall, MediaCallActor, MediaCallContact, ServerActor } from '@rocket.chat/core-typings';

// Contacts carry a per-session signing token, which is a credential and shouldn't go to apps
export function toAppContact(contact: MediaCallContact): IAppsMediaCallContact {
	return {
		type: contact.type,
		id: contact.id,
		...(contact.username && { username: contact.username }),
		...(contact.displayName && { displayName: contact.displayName }),
		...(contact.sipExtension && { sipExtension: contact.sipExtension }),
	};
}

export function getCallOrigin(caller: MediaCallContact, callee: MediaCallContact): MediaCallOrigin {
	if (caller.type === 'sip') {
		return 'sip-inbound';
	}

	if (callee.type === 'sip') {
		return 'sip-outbound';
	}

	return 'internal';
}

function toAppActor(actor: MediaCallActor | ServerActor): IAppsMediaCallActor {
	return {
		type: actor.type,
		id: actor.id,
	};
}

export function toAppMediaCall(call: IMediaCall): IAppsMediaCall {
	const mediaCall: IAppsMediaCall = {
		id: call._id,
		service: call.service,
		kind: call.kind,
		state: call.state,
		origin: getCallOrigin(call.caller, call.callee),
		createdBy: toAppContact(call.createdBy),
		createdAt: call.createdAt,
		caller: toAppContact(call.caller),
		callee: toAppContact(call.callee),
		features: call.features,
		uids: call.uids,
		ended: call.ended,
		...(call.endedAt && { endedAt: call.endedAt }),
		...(call.endedBy && { endedBy: toAppActor(call.endedBy) }),
		...(call.hangupReason && { hangupReason: call.hangupReason }),
		...(call.acceptedAt && { acceptedAt: call.acceptedAt }),
		...(call.activatedAt && { activatedAt: call.activatedAt }),
		...(call.parentCallId && { parentCallId: call.parentCallId }),
		...(call.divertedBy && { divertedBy: toAppContact(call.divertedBy) }),
		...(call.transferredAt && { transferredAt: call.transferredAt }),
		...(call.transferredBy && { transferredBy: toAppContact(call.transferredBy) }),
		...(call.transferredTo && { transferredTo: toAppContact(call.transferredTo) }),
		...(call.sipCallId && { sipCallId: call.sipCallId }),
	};

	return mediaCall;
}
