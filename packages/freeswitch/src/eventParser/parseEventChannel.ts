import type { IFreeSwitchEventChannel } from '@rocket.chat/core-typings';

export function parseEventChannel(eventData: Record<string, string>): Partial<IFreeSwitchEventChannel> {
	const hitDialplan = eventData['Channel-HIT-Dialplan'];

	return {
		uniqueId: eventData['Unique-ID'],
		hitDialplan: hitDialplan !== undefined ? hitDialplan === 'true' : undefined,
		name: eventData['Channel-Name'],
		state: eventData['Channel-State'],
		contact: eventData.variable_sip_contact_user,
	};
}
