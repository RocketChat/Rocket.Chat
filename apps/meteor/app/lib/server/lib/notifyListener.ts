import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { IRocketChatRecord, IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

async function onRoomChanged<T extends IRocketChatRecord>(data: T | T[], clientAction: ClientAction = 'updated'): Promise<void> {
	if (dbWatchersDisabled) {
		return;
	}

	const items = Array.isArray(data) ? data : [data];

	for (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

async function onRoomChangedById<T extends IRocketChatRecord>(
	ids: T['_id'] | T['_id'][],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (dbWatchersDisabled) {
		return;
	}

	const eligibleIds = Array.isArray(ids) ? ids : [ids];
	const items = await Rooms.findByIds(eligibleIds).toArray();

	for (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

async function onRoomChangedByUsernamesOrUids<T extends IRoom>(
	uids: T['u']['_id'][],
	usernames: T['u']['username'][],
	clientAction: ClientAction = 'updated',
) {
	if (dbWatchersDisabled) {
		return;
	}

	const items = await Rooms.findByUsernamesOrUids(uids, usernames).toArray();

	for (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

async function onRoomChangedByUserDM<T extends IRoom>(userId: T['u']['_id'], clientAction: ClientAction = 'updated') {
	if (!dbWatchersDisabled) {
		return;
	}

	const items = await Rooms.findDMsByUids([userId]).toArray();

	for (const item of items) {
		void api.broadcast('watch.rooms', { clientAction, room: item });
	}
}

export const notifyListener = {
	onRoomChanged,
	onRoomChangedById,
	onRoomChangedByUsernamesOrUids,
	onRoomChangedByUserDM,
};
