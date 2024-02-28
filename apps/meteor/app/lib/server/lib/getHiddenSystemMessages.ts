import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

const hideMessagesOfTypeServer = new Set<MessageTypesValues>();

settings.watch<MessageTypesValues[]>('Hide_System_Messages', (values) => {
	if (!values || !Array.isArray(values)) {
		return;
	}

	const hiddenTypes = values.reduce((array, value): MessageTypesValues[] => {
		const newValue: MessageTypesValues[] = value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value];

		return [...array, ...newValue];
	}, [] as MessageTypesValues[]);

	hideMessagesOfTypeServer.clear();

	hiddenTypes.forEach((item) => hideMessagesOfTypeServer.add(item));
});

// TODO probably remove on chained event system
export function getHiddenSystemMessages(room: IRoom): MessageTypesValues[] {
	return Array.isArray(room?.sysMes) ? room.sysMes : [...hideMessagesOfTypeServer];
}
