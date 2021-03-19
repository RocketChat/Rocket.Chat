import { Meteor } from 'meteor/meteor';

import { LivechatRooms } from '../../../../../app/models/server';
import { QueueManager } from '../../lib/QueueManager';

Meteor.methods({
	async 'livechat:resumeOnHold'(roomId, options = { clientAction: false }) {
		const room = await LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:resumeOnHold' });
		}

		if (!room.onHold) {
			throw new Meteor.Error('room-closed', 'Room is not OnHold', { method: 'livechat:resumeOnHold' });
		}

		(QueueManager as any).resumeOnHoldChat(room, options);
	},
});
