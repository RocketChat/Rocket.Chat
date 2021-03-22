import { Meteor } from 'meteor/meteor';

import { LivechatRooms, LivechatInquiry, Subscriptions } from '../../../../../app/models/server';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';

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

		await AutoCloseOnHoldScheduler.unscheduleRoom(roomId);

		await RoutingManager.takeInquiry(inquiry, { agentId, username }, options);

		(LivechatRooms as any).unsetAllOnHoldFieldsByRoomId(roomId);
		Subscriptions.unsetOnHold(roomId);
	},
});
