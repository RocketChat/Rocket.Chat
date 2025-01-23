import type { IFreeSwitchEventCallUser, IFreeSwitchEventUser } from '@rocket.chat/core-typings';

import { makeEventCallUser } from './makeEventCallUser';
import { makeEventUser } from './makeEventUser';

function shouldIgnoreEvent(eventData: Record<string, string>): boolean {
	const eventName = eventData['Event-Name'];
	if (['CHANNEL_DESTROY', 'CHANNEL_OUTGOING'].includes(eventName)) {
		return true;
	}
	if (eventName === 'CHANNEL_STATE' && eventData['Channel-State'] === 'CS_DESTROY') {
		return true;
	}

	return false;
}

function getCaller(eventData: Record<string, string>): IFreeSwitchEventCallUser | undefined {
	const eventName = eventData['Event-Name'];
	if (shouldIgnoreEvent(eventData)) {
		return;
	}

	const callId = eventData['Channel-Call-UUID'];
	const uniqueId = eventData['Unique-ID'];
	const callerDirection = eventData['Caller-Direction'];
	const otherType = eventData['Other-Type'];

	const isCallChannel = callId === uniqueId;
	const isTransferCallChannel =
		isCallChannel &&
		callerDirection === 'outbound' &&
		otherType === 'originatee' &&
		eventData['Other-Leg-Direction'] === 'outbound' &&
		eventData['Other-Leg-Logical-Direction'] === 'inbound';

	const isNewTransfer = eventName === 'CHANNEL_OUTGOING' && isCallChannel;
	const isTransferHangup = ['CHANNEL_HANGUP', 'CHANNEL_HANGUP_COMPLETE'].includes(eventName) && isTransferCallChannel;
	const isRingWait = eventName === 'CHANNEL_CALLSTATE' && eventData['Channel-Call-State'] === 'RING_WAIT';
	const hasOriginator = otherType === 'originator';

	const otherLegDirection = eventData['Other-Leg-Direction'];
	const otherLegIdNumber = eventData['Other-Leg-Caller-ID-Number'];
	const callerNumber = eventData['Caller-Caller-ID-Number'];
	const calleeNumber = eventData['Caller-Callee-ID-Number'];
	const destinationNumber = eventData['Caller-Destination-Number'];
	const channelName = eventData['Caller-Channel-Name'];

	const isVoicemail = destinationNumber === 'voicemail' || channelName?.includes('voicemail');
	const isOtherlegVoicemail =
		eventData['Other-Leg-Destination-Number'] === 'voicemail' || eventData['Other-Leg-Channel-Name']?.includes('voicemail');

	const identifiers: (IFreeSwitchEventUser | undefined)[] = [];

	if (isNewTransfer && !isVoicemail) {
		if (hasOriginator && callerDirection === 'outbound' && eventData['Other-Leg-Direction'] === 'inbound') {
			identifiers.push(makeEventUser('extension', callerNumber));
		} else {
			identifiers.push(makeEventUser('contact', calleeNumber));
		}
	} else {
		if (!['CHANNEL_BRIDGE', 'CHANNEL_UNBRIDGE'].includes(eventName) && !isTransferHangup && !isVoicemail) {
			identifiers.push(makeEventUser('extension', eventData.variable_sip_from_user));
		}

		if (hasOriginator) {
			if (otherLegDirection === 'inbound') {
				identifiers.push(makeEventUser('extension', otherLegIdNumber));
			} else if (otherLegDirection === 'outbound') {
				identifiers.push(makeEventUser('contact', otherLegIdNumber));
			}

			identifiers.push(makeEventUser('extension', callerNumber));
		}

		if (isTransferCallChannel) {
			identifiers.push(makeEventUser('extension', eventData['Other-Leg-Caller-ID-Number']));
			identifiers.push(makeEventUser('contact', callerNumber));
		}

		if (!otherType) {
			identifiers.push(makeEventUser(isRingWait && callerDirection === 'outbound' ? 'contact' : 'extension', callerNumber));
		}

		if (otherType === 'originatee' && isOtherlegVoicemail) {
			identifiers.push(makeEventUser('extension', otherLegIdNumber));
		}

		if (isCallChannel && callerDirection === 'inbound' && !isVoicemail) {
			identifiers.push(makeEventUser('extension', callerNumber));
		}

		identifiers.push(makeEventUser('unknown', callerNumber));
	}

	return makeEventCallUser(identifiers);
}

export function parseEventCaller(eventData: Record<string, string>): IFreeSwitchEventCallUser | undefined {
	return getCaller(eventData);
}
