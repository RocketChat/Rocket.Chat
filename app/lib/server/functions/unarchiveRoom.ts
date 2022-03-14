import { Rooms, Subscriptions } from '../../../models/server';

export const unarchiveRoom = function (rid: string): void {
	Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
};
