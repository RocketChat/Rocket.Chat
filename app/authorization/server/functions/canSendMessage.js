import { Meteor } from 'meteor/meteor';
import { Rooms, Subscriptions } from '../../../models';
import { canAccessRoom } from './canAccessRoom';
import { TAPi18n } from 'meteor/tap:i18n';
import { Random } from 'meteor/random';
import { Notifications } from '../../../notifications';
import { hasPermission } from '../..';

export const canSendMessage = (rid, { uid, username }, extraData) => {
	const room = Rooms.findOneById(rid);

	if (!canAccessRoom.call(this, room, { _id: uid, username }, extraData)) {
		throw new Meteor.Error('error-not-allowed');
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, uid);
	if (subscription && (subscription.blocked || subscription.blocker)) {
		throw new Meteor.Error('room_is_blocked');
	}

	if (room.ro === true) {
		if (!hasPermission(Meteor.userId(), 'post-readonly', room._id)) {
			// Unless the user was manually unmuted
			if (!(room.unmuted || []).includes(username)) {
				Notifications.notifyUser(Meteor.userId(), 'message', {
					_id: Random.id(),
					rid: room._id,
					ts: new Date,
					msg: TAPi18n.__('room_is_read_only'),
				});

				throw new Meteor.Error('You can\'t send messages because the room is readonly.');
			}
		}
	}

	if ((room.muted || []).includes(username)) {
		throw new Meteor.Error('You_have_been_muted');
	}

	return room;
};
