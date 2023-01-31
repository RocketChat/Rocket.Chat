import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { LivechatRooms } from '../../../models/server';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:removeRoom'(rid: string) {
		const user = Meteor.userId();
		if (!user || !(await hasPermissionAsync(user, 'remove-closed-livechat-rooms'))) {
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

		await Livechat.removeRoom(rid);
	},
});
