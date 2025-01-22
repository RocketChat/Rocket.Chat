import type { IFreeSwitchEventCallee } from '@rocket.chat/core-typings';

import { makeEventCallUser } from './makeEventCallUser';
import { makeEventUser } from './makeEventUser';

export function parseEventCallee(eventData: Record<string, string>): Partial<IFreeSwitchEventCallee> {
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

	const ignoreEvent = eventName === 'CHANNEL_DESTROY';

	if (ignoreEvent) {
		return {};
	}

	const toUser = makeEventCallUser(
		isNewTransfer
			? []
			: [
					...(!['CHANNEL_BRIDGE', 'CHANNEL_UNBRIDGE'].includes(eventName) && !isTransferHangup
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
				],
	);

	if (toUser && callerDirection === 'outbound' && !isTransferCallChannel) {
		// toUser.reached = true;
		toUser.channelUniqueId = eventData['Unique-ID'];
	}

	return {
		to: toUser,
	};
}
