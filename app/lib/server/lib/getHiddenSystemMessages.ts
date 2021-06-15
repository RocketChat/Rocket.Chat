import { settings } from '../../../settings/server';
import { IRoom } from '../../../../definition/IRoom';

const hideMessagesOfTypeServer = new Set<string>();

settings.get('Hide_System_Messages', function(_key, values) {
	if (!values || !Array.isArray(values)) {
		return;
	}

	const hiddenTypes = values.reduce((array: string[], value: string) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []);

	hideMessagesOfTypeServer.clear();

	hiddenTypes.forEach((item) => hideMessagesOfTypeServer.add(item));
});

// TODO probably remove on chained event system
export function getHiddenSystemMessages(room: IRoom): string[] {
	return Array.isArray(room?.sysMes)
		? room.sysMes
		: [...hideMessagesOfTypeServer];
}
