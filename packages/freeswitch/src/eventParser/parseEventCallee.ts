import type { IFreeSwitchEventCallUser, IFreeSwitchEventUser } from '@rocket.chat/core-typings';

import { guessIdentificationType } from './guessIdentificationType';
import { makeEventCallUser } from './makeEventCallUser';
import { makeEventUser } from './makeEventUser';
import { shouldIgnoreEventUsers } from './shouldIgnoreEventUsers';

export function parseEventCallee(eventData: Record<string, string>): IFreeSwitchEventCallUser | undefined {
	if (shouldIgnoreEventUsers(eventData)) {
		return;
	}

	const eventName = eventData['Event-Name'];
	const callId = eventData['Channel-Call-UUID'];
	const uniqueId = eventData['Unique-ID'];
	const callerDirection = eventData['Caller-Direction'];
	const otherType = eventData['Other-Type'];

	const isCallChannel = callId === uniqueId;
	const isTransferCallChannel =
		isCallChannel &&
		callerDirection === 'outbound' &&
		((otherType === 'originatee' &&
			eventData['Other-Leg-Direction'] === 'outbound' &&
			eventData['Other-Leg-Logical-Direction'] === 'inbound') ||
			!otherType);

	const isTransferHangup = ['CHANNEL_HANGUP', 'CHANNEL_HANGUP_COMPLETE'].includes(eventName) && isTransferCallChannel;
	const destinationNumber = eventData['Caller-Destination-Number'];
	const channelName = eventData['Caller-Channel-Name'];

	const isVoicemail = destinationNumber === 'voicemail' || channelName?.includes('voicemail');

	const identifiers: (IFreeSwitchEventUser | undefined)[] = [];

	if (destinationNumber) {
		const destinationNumberType = guessIdentificationType(destinationNumber, eventData);
		if (destinationNumberType) {
			identifiers.push(makeEventUser(destinationNumberType, destinationNumber));
		}
	}

	const otherLegDestinationNumber = eventData['Other-Leg-Destination-Number'];
	if (otherLegDestinationNumber) {
		const otherLegDestinationNumberType = guessIdentificationType(otherLegDestinationNumber, eventData);
		if (otherLegDestinationNumberType) {
			identifiers.push(makeEventUser(otherLegDestinationNumberType, otherLegDestinationNumber));
		}
	}

	if (!otherType && !isVoicemail && callerDirection === 'inbound') {
		identifiers.push(makeEventUser('channel', eventData.variable_other_loopback_leg_uuid));
	}

	identifiers.push(makeEventUser('extension', eventData.variable_dialed_extension));
	identifiers.push(makeEventUser('extension', eventData.variable_dialed_user));

	if (!['CHANNEL_BRIDGE', 'CHANNEL_UNBRIDGE'].includes(eventName) && !isTransferHangup && !isVoicemail) {
		identifiers.push(makeEventUser('extension', eventData.variable_sip_req_user));
		if (callerDirection === 'inbound') {
			identifiers.push(makeEventUser('extension', eventData.variable_sip_to_user));
		} else if (callerDirection === 'outbound') {
			identifiers.push(makeEventUser('contact', eventData.variable_sip_to_user));
		}
	}

	if (callerDirection === 'outbound' && !isTransferCallChannel && !isCallChannel) {
		identifiers.push(makeEventUser('channel', eventData['Unique-ID']));
	}

	return makeEventCallUser(identifiers);
}
