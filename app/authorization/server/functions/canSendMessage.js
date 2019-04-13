import { Meteor } from 'meteor/meteor';
import { Rooms, Subscriptions } from '../../../models';
import { canAccessRoom } from './canAccessRoom';

export const canSendMessage = (rid, { uid, username }, extraData) => {
	const room = Rooms.findOneById(rid);

	if (!canAccessRoom.call(this, room, { _id: uid, username }, extraData)) {
		throw new Meteor.Error('error-not-allowed');
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, uid);
	if (subscription && (subscription.blocked || subscription.blocker)) {
		throw new Meteor.Error('room_is_blocked');
	}

	if ((room.muted || []).includes(username)) {
		throw new Meteor.Error('You_have_been_muted');
	}

	return room;
};
