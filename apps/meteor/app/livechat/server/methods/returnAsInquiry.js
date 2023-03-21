import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { LivechatRooms } from '../../../models/server';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:returnAsInquiry'(rid, departmentId) {
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'view-l-room'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:returnAsInquiry',
			});
		}

		const room = LivechatRooms.findOneById(rid);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:returnAsInquiry',
			});
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:returnAsInquiry' });
		}

		return Livechat.returnRoomAsInquiry(rid, departmentId);
	},
});
