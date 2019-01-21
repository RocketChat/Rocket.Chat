import { Rooms, Subscriptions } from 'meteor/rocketchat:models';

RocketChat.unarchiveRoom = function(rid) {
	Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
};
