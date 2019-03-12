import { Rooms, Subscriptions } from 'meteor/rocketchat:models';

export const unarchiveRoom = function(rid) {
	Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
};
