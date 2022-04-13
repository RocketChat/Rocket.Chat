import type { IRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

const hideMessagesOfTypeServer = new Set<string>();

settings.watch<string[]>('Hide_System_Messages', function (values) {
	if (!values || !Array.isArray(values)) {
		return;
	}

	const hiddenTypes = values.reduce(
		(array: string[], value: string) => [...array, ...(value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value])],
		[],
	);

	hideMessagesOfTypeServer.clear();

	hiddenTypes.forEach((item) => hideMessagesOfTypeServer.add(item));
});

// TODO probably remove on chained event system
export function getHiddenSystemMessages(room: IRoom): string[] {
	return Array.isArray(room?.sysMes) ? room.sysMes : [...hideMessagesOfTypeServer];
}
