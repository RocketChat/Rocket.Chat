import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { IRocketChatRecord, IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

export async function notifyOnRoomChanged<T extends IRocketChatRecord>(
	data: T | T[],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = Array.isArray(data) ? data : [data];

	for (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

export async function notifyOnRoomChangedById<T extends IRocketChatRecord>(
	ids: T['_id'] | T['_id'][],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const eligibleIds = Array.isArray(ids) ? ids : [ids];
	const items = Rooms.findByIds(eligibleIds);

	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

export async function notifyOnRoomChangedByUsernamesOrUids<T extends IRoom>(
	uids: T['u']['_id'][],
	usernames: T['u']['username'][],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = Rooms.findByUsernamesOrUids(uids, usernames);

	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

export async function notifyOnRoomChangedByUserDM<T extends IRoom>(
	userId: T['u']['_id'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = Rooms.findDMsByUids([userId]);

	for await (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}
