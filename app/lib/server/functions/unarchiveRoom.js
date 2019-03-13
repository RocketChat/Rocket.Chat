import { Rooms, Subscriptions } from '/app/models';

export const unarchiveRoom = function(rid) {
	Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
};
