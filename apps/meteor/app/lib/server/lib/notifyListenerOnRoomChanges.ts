import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

export async function notifyListenerOnRoomChanges(
	rid: IRoom['_id'],
	clientAction: ClientAction = 'updated',
	existingRoomData?: IRoom,
	args?: { [key: string]: any },
): Promise<void> {
	if (!dbWatchersDisabled) return;

	const room = existingRoomData || (await Rooms.findOneById(rid));

	if (room) {
		void api.broadcast('watch.rooms', { clientAction, room: { ...room, ...args } });
	}
}

export async function notifyListenerOnRoomsChanges(rooms: IRoom[], clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) return;
	if (!rooms.length) return;
	void notifyListenerOnRoomChanges(rooms[0]._id, clientAction, rooms[0]);
	return notifyListenerOnRoomsChanges(rooms.slice(1), clientAction);
}
