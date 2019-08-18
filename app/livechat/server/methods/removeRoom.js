import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatRooms, Messages, Subscriptions } from '../../../models';

Meteor.methods({
	'livechat:removeRoom'(rid) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'remove-closed-livechat-rooms')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeRoom' });
		}

		const room = LivechatRooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:removeRoom',
			});
		}

		if (room.t !== 'l') {
			throw new Meteor.Error('error-this-is-not-a-livechat-room', 'This is not a Livechat room', {
				method: 'livechat:removeRoom',
			});
		}

		if (room.open) {
			throw new Meteor.Error('error-room-is-not-closed', 'Room is not closed', {
				method: 'livechat:removeRoom',
			});
		}

		if (room.v) {
			LivechatSessions.updateChatStatusOnRoomCloseOrDeleteByToken(room.v.token, 'Not Started');
		}

		Messages.removeByRoomId(rid);
		Subscriptions.removeByRoomId(rid);
		return LivechatRooms.removeById(rid);
	},
});
