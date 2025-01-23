import type { IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

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

export function parseEventCallee(eventData: Record<string, string>): IFreeSwitchEventCallUser | undefined {
	if (shouldIgnoreEvent(eventData)) {
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
		otherType === 'originatee' &&
		eventData['Other-Leg-Direction'] === 'outbound' &&
		eventData['Other-Leg-Logical-Direction'] === 'inbound';

	const isNewTransfer = eventName === 'CHANNEL_OUTGOING' && isCallChannel;
	const isTransferHangup = ['CHANNEL_HANGUP', 'CHANNEL_HANGUP_COMPLETE'].includes(eventName) && isTransferCallChannel;
	const destinationNumber = eventData['Caller-Destination-Number'];
	const channelName = eventData['Caller-Channel-Name'];

	const isVoicemail = destinationNumber === 'voicemail' || channelName?.includes('voicemail');

	return makeEventCallUser(
		isNewTransfer && !isVoicemail
			? []
			: [
					...(!['CHANNEL_BRIDGE', 'CHANNEL_UNBRIDGE'].includes(eventName) && !isTransferHangup && !isVoicemail
						? [
								...(callerDirection === 'inbound' ? [makeEventUser('extension', eventData.variable_sip_to_user)] : []),
								...(callerDirection === 'outbound' ? [makeEventUser('contact', eventData.variable_sip_to_user)] : []),
								makeEventUser('extension', eventData.variable_sip_req_user),
							]
						: []),

					makeEventUser('extension', eventData.variable_dialed_extension),
					makeEventUser('extension', eventData.variable_dialed_user),

					...(eventData['Call-Direction'] === 'inbound' ? [makeEventUser('extension', eventData['Caller-Destination-Number'])] : []),

					...(otherType === 'originator' ? [makeEventUser('extension', eventData['Other-Leg-Destination-Number'])] : []),
					...(otherType === 'originatee' ? [makeEventUser('contact', eventData['Other-Leg-Destination-Number'])] : []),
					...(!otherType && isVoicemail && callerDirection === 'inbound'
						? [makeEventUser('channel', eventData.variable_other_loopback_leg_uuid)]
						: []),
					...(callerDirection === 'outbound' && !isTransferCallChannel ? [makeEventUser('channel', eventData['Unique-ID'])] : []),
				],
	);
}
