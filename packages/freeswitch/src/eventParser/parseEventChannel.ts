import type { IFreeSwitchEventChannel } from '@rocket.chat/core-typings';

export function parseEventChannel(eventData: Record<string, string>): Partial<IFreeSwitchEventChannel> {
	const hitDialplan = eventData['Channel-HIT-Dialplan'];

	const uniqueId = eventData['Unique-ID'];

	const bridgedTo = Object.entries(eventData)
		.filter(([key]) => key.startsWith('Bridge-') && key.endsWith('-Unique-ID'))
		.map(([_key, value]) => value)
		.filter((bridgeId) => bridgeId !== uniqueId);

	return {
		uniqueId,
		hitDialplan: hitDialplan !== undefined ? hitDialplan === 'true' : undefined,
		name: eventData['Channel-Name'],
		state: eventData['Channel-State'],
		contact: eventData.variable_sip_contact_user,

		callDirection: eventData['Call-Direction'],
		callerDirection: eventData['Caller-Direction'],
		callerLogicalDirection: eventData['Caller-Logical-Direction'],
		callerUniqueId: eventData['Caller-Unique-ID'],

		...(eventData['Other-Type'] === 'originator' && { originator: eventData['Other-Leg-Unique-ID'] }),
		...(eventData['Other-Type'] === 'originatee' &&
			eventData['Other-Leg-Unique-ID'] && { originatees: [eventData['Other-Leg-Unique-ID']] }),
		...(bridgedTo.length && { bridgedTo }),
	};
}
