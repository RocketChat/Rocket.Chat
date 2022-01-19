import { Rooms, Subscriptions } from '../../../models';

export const unarchiveRoom = function (rid) {
	Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
};
