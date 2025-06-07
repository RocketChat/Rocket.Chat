import type { IFreeSwitchEventChannel } from '@rocket.chat/core-typings';

export function parseEventLinkedChannels(eventData: Record<string, string>): IFreeSwitchEventChannel[] {
	const bridgedIds = Object.entries(eventData)
		.filter(([key]) => key.startsWith('Bridge-') && key.endsWith('-Unique-ID'))
		.map(([_key, value]) => value);

	const list: IFreeSwitchEventChannel[] = [];

	const otherType = eventData['Other-Type'];
	if (otherType) {
		const other: IFreeSwitchEventChannel = {
			type: otherType,
			uniqueId: eventData['Other-Leg-Unique-ID'],
			name: eventData['Other-Leg-Channel-Name'],

			callerDirection: eventData['Other-Leg-Direction'],
			callerLogicalDirection: eventData['Other-Leg-Logical-Direction'],
		};

		if (other.uniqueId && bridgedIds.includes(other.uniqueId)) {
			other.bridgedTo = bridgedIds.filter((id) => id !== other.uniqueId);
		}

		list.push(other);
	}

	return list;
}
