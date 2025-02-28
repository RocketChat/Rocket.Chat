/* eslint-disable complexity */
import type { IFreeSwitchEventCallUser, IFreeSwitchEventUser } from '@rocket.chat/core-typings';

import { guessIdentificationType } from './guessIdentificationType';
// import { isCallMissingInitiator } from './isCallMissingInitiator';
import { makeEventCallUser } from './makeEventCallUser';
import { makeEventUser } from './makeEventUser';
import { shouldIgnoreEventUsers } from './shouldIgnoreEventUsers';

export function parseEventCaller(eventData: Record<string, string>): IFreeSwitchEventCallUser | undefined {
	if (shouldIgnoreEventUsers(eventData)) {
		return;
	}

	// const eventName = eventData['Event-Name'];
	const callId = eventData['Channel-Call-UUID'];
	const uniqueId = eventData['Unique-ID'];
	// const callerDirection = eventData['Caller-Direction'];
	// const otherType = eventData['Other-Type'];

	const isCallerChannel = callId === uniqueId;
	// const isTransferCallChannel =
	// 	isCallChannel &&
	// 	callerDirection === 'outbound' &&
	// 	otherType === 'originatee' &&
	// 	eventData['Other-Leg-Direction'] === 'outbound' &&
	// 	eventData['Other-Leg-Logical-Direction'] === 'inbound';

	// const isTransferHangup = ['CHANNEL_HANGUP', 'CHANNEL_HANGUP_COMPLETE'].includes(eventName) && isTransferCallChannel;
	// const isRingWait = eventName === 'CHANNEL_CALLSTATE' && eventData['Channel-Call-State'] === 'RING_WAIT';
	// const hasOriginator = otherType === 'originator';

	// const otherLegDirection = eventData['Other-Leg-Direction'];
	// const otherLegIdNumber = eventData['Other-Leg-Caller-ID-Number'];
	const callerNumber = eventData['Caller-Caller-ID-Number'];
	// const calleeNumber = eventData['Caller-Callee-ID-Number'];
	// const destinationNumber = eventData['Caller-Destination-Number'];
	// const channelName = eventData['Caller-Channel-Name'];

	// const isVoicemail = destinationNumber === 'voicemail' || channelName?.includes('voicemail');
	// const isOtherlegVoicemail =
	// 	eventData['Other-Leg-Destination-Number'] === 'voicemail' || eventData['Other-Leg-Channel-Name']?.includes('voicemail');

	// const missingInitiator = isCallMissingInitiator(eventData);

	const identifiers: (IFreeSwitchEventUser | undefined)[] = [];

	// callerNumber always has some form of identification of the correct caller, we just need to figure out if it's an extension or a contact
	const callerNumberType = guessIdentificationType(callerNumber, eventData);
	if (callerNumberType) {
		identifiers.push(makeEventUser(callerNumberType, callerNumber));
	}

	if (isCallerChannel) {
		identifiers.push(makeEventUser('channel', uniqueId));
	}

	// if (isNewTransfer && !isVoicemail) {
	// 	if (hasOriginator && callerDirection === 'outbound' && eventData['Other-Leg-Direction'] === 'inbound') {
	// 		identifiers.push(makeEventUser('extension', callerNumber));
	// 	} else {
	// 		identifiers.push(makeEventUser('contact', calleeNumber));
	// 	}
	// } else {
	// 	if (!['CHANNEL_BRIDGE', 'CHANNEL_UNBRIDGE'].includes(eventName) && !isTransferHangup && !isVoicemail) {
	// 		identifiers.push(makeEventUser('extension', eventData.variable_sip_from_user));
	// 	}

	// 	if (hasOriginator) {
	// 		if (otherLegDirection === 'inbound') {
	// 			identifiers.push(makeEventUser('extension', otherLegIdNumber));
	// 		} else if (otherLegDirection === 'outbound') {
	// 			identifiers.push(makeEventUser('contact', otherLegIdNumber));
	// 		}

	// 		identifiers.push(makeEventUser('extension', callerNumber));
	// 	}

	// 	if (isTransferCallChannel) {
	// 		identifiers.push(makeEventUser('extension', otherLegIdNumber));
	// 		identifiers.push(makeEventUser('contact', callerNumber));
	// 	}

	// 	if (!otherType) {
	// 		if (channelName.includes(callerNumber)) {
	// 			if (channelName.includes('.invalid')) {
	// 				identifiers.push(makeEventUser('contact', callerNumber));
	// 			}
	// 			identifiers.push(makeEventUser('channel', uniqueId));
	// 		} else {
	// 			identifiers.push(makeEventUser(isRingWait && callerDirection === 'outbound' ? 'contact' : 'extension', callerNumber));
	// 		}
	// 	}

	// 	if (otherType === 'originatee' && isOtherlegVoicemail) {
	// 		identifiers.push(makeEventUser('extension', otherLegIdNumber));
	// 	}

	// 	if (isCallChannel && callerDirection === 'inbound' && !isVoicemail) {
	// 		identifiers.push(makeEventUser('extension', callerNumber));
	// 		identifiers.push(makeEventUser('channel', uniqueId));
	// 	}

	// 	// identifiers.push(makeEventUser('unknown', callerNumber));
	// }

	const user = makeEventCallUser(identifiers);

	if (user) {
		return user;
	}

	// The call was started by someone who's not part of it
	// if (eventData['Call-Direction'] === 'outbound' && eventData['Other-Type'] === undefined) {
	// }
}
