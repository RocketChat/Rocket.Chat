import { Meteor } from 'meteor/meteor';

import { LivechatRooms, LivechatInquiry } from '../../../../../app/models/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { callbacks } from '../../../../../app/callbacks/server';

Meteor.methods({
	async 'livechat:resumeOnHold'(roomId, options = { clientAction: false }) {
		const room = await LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:resumeOnHold' });
		}

		if (!room.onHold) {
			throw new Meteor.Error('room-closed', 'Room is not OnHold', { method: 'livechat:resumeOnHold' });
		}

		const { servedBy: { _id: agentId, username } } = room;

		const inquiry = LivechatInquiry.findOneByRoomId(roomId, {});
		if (!inquiry) {
			throw new Meteor.Error('inquiry-not-found', 'Error! No inquiry found for this room', { method: 'livechat:resumeOnHold' });
		}

		await RoutingManager.takeInquiry(inquiry, { agentId, username }, options);

		const updatedRoom = LivechatRooms.findById(roomId, null);
		updatedRoom && Meteor.defer(() => callbacks.run('livechat:afterOnHoldChatResumed', updatedRoom));
	},
});
