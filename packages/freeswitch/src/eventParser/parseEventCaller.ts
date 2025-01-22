import type { IFreeSwitchEventCaller } from '@rocket.chat/core-typings';

import { makeEventCallUser } from './makeEventCallUser';
import { makeEventUser } from './makeEventUser';

export function parseEventCaller(eventData: Record<string, string>): Partial<IFreeSwitchEventCaller> {
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
	const isRingWait = eventName === 'CHANNEL_CALLSTATE' && eventData['Channel-Call-State'] === 'RING_WAIT';

	const ignoreEvent = eventName === 'CHANNEL_DESTROY';
	const hasOriginator = otherType === 'originator';

	const originatorDirection = (hasOriginator && eventData['Other-Leg-Direction']) || undefined;
	const originatorIdNumber = (hasOriginator && eventData['Other-Leg-Caller-ID-Number']) || undefined;
	const callerNumber = eventData['Caller-Caller-ID-Number'];
	const calleeNumber = eventData['Caller-Callee-ID-Number'];

	const fromUser =
		!ignoreEvent &&
		makeEventCallUser(
			isNewTransfer
				? [makeEventUser('contact', calleeNumber)]
				: [
						...(!['CHANNEL_BRIDGE', 'CHANNEL_UNBRIDGE'].includes(eventName) && !isTransferHangup
							? [makeEventUser('extension', eventData.variable_sip_from_user)]
							: []),

						...(hasOriginator
							? [
									...(originatorDirection === 'inbound' ? [makeEventUser('extension', originatorIdNumber)] : []),
									...(originatorDirection === 'outbound' ? [makeEventUser('contact', originatorIdNumber)] : []),

									makeEventUser('extension', callerNumber),
								]
							: []),

						...(isTransferCallChannel
							? [makeEventUser('extension', eventData['Other-Leg-Caller-ID-Number']), makeEventUser('contact', callerNumber)]
							: []),
						...(otherType === undefined
							? [makeEventUser(isRingWait && callerDirection === 'outbound' ? 'contact' : 'extension', callerNumber)]
							: []),

						makeEventUser('unknown', callerNumber),
					],
		);

	return {
		uniqueId: eventData['Caller-Unique-ID'],
		direction: eventData['Caller-Direction'],
		context: eventData['Caller-Context'],
		name: eventData['Caller-Caller-ID-Name'],
		...(fromUser && { from: fromUser }),
	};
}
