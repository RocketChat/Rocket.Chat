import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../app/authorization';
import { Subscriptions } from '../../../app/models';
import { msgStream } from '../../../app/lib/server';
import './emitter';


export const MY_MESSAGE = '__my_messages__';

msgStream.allowWrite('none');

msgStream.allowRead(function(eventName, args) {
	try {
		const room = Meteor.call('canAccessRoom', eventName, this.userId, args);

		if (!room) {
			return false;
		}

		if (room.t === 'c' && !hasPermission(this.userId, 'preview-c-room') && !Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } })) {
			return false;
		}

		return true;
	} catch (error) {
		/* error*/
		return false;
	}
});

msgStream.allowRead(MY_MESSAGE, 'all');

msgStream.allowEmit(MY_MESSAGE, function(eventName, msg) {
	try {
		const room = Meteor.call('canAccessRoom', msg.rid, this.userId);

		if (!room) {
			return false;
		}

		return {
			roomParticipant: Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } }) != null,
			roomType: room.t,
			roomName: room.name,
		};
	} catch (error) {
		/* error*/
		return false;
	}
});
