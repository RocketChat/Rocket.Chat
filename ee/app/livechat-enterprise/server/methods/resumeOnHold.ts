import { Meteor } from 'meteor/meteor';

import { Subscriptions, LivechatRooms, LivechatInquiry } from '../../../../../app/models/server';
import { callbacks } from '../../../../../app/callbacks/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { Livechat } from '../../../../../app/livechat/server';
import { dispatchInquiryPosition } from '../lib/Helper';


Meteor.methods({
	async 'livechat:resumeOnHold'(roomId, options = { clientAction: false }) {
		const room = await LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:resumeOnHold' });
		}

		if (!room.onHold) {
			throw new Meteor.Error('room-closed', 'Room is not OnHold', { method: 'livechat:resumeOnHold' });
		}

		const { servedBy: { _id: agentId = null, username = null } = {} } = room;
		let agent: any = { agentId, username };
		const inquiry = await LivechatInquiry.findOneByRoomId(roomId, {});
		const { departmentId } = inquiry;

		try {
			agent = await callbacks.run('livechat.checkAgentBeforeTakeInquiry', agent, inquiry);
		} catch (e) {
			console.log(e);
			if (options.clientAction) {
				throw new Meteor.Error('error-max-number-simultaneous-chats-reached', 'Not allowed');
			}
			agent = null;
		}

		if (!agent) {
			Livechat.returnRoomAsInquiry(room._id, departmentId);

			if (RoutingManager.getConfig().autoAssignAgent) {
				LivechatInquiry.queueInquiry(inquiry._id);

				const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({ _id: inquiry._id, department: undefined });
				if (inq) {
					dispatchInquiryPosition(inq);
				}
			}
		}

		(LivechatRooms as any).unsetAllOnHoldFieldsByRoomId(roomId);
		Subscriptions.unsetOnHold(roomId);
	},
});
