import { Meteor } from 'meteor/meteor';

import { Subscriptions, LivechatRooms, LivechatInquiry } from '../../../../../app/models/server';
import { callbacks } from '../../../../../app/callbacks/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { Livechat } from '../../../../../app/livechat/server';
import { dispatchInquiryPosition } from '../lib/Helper';


Meteor.methods({
	async 'livechat:resumeOnHold'(roomId, options = { clientAction: false }) {
		console.log('--livechat:resumeOnHold called');

		const room = await LivechatRooms.findOneById(roomId);
		console.log('--room found', room);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:resumeOnHold' });
		}

		if (!room.isChatOnHold) {
			throw new Meteor.Error('room-closed', 'Room is not OnHold', { method: 'livechat:resumeOnHold' });
		}

		const { servedBy: { _id: agentId = null, username = null } = {} } = room;
		let agent: any = { agentId, username };
		const inquiry = await LivechatInquiry.findOneByRoomId(roomId);
		const { departmentId } = inquiry;

		try {
			console.log('---b4 livechat.checkAgentBeforeTakeInquiry', agent, inquiry);
			agent = await callbacks.run('livechat.checkAgentBeforeTakeInquiry', agent, inquiry);
		} catch (e) {
			console.log('--error', e);
			if (options.clientAction) {
				throw new Meteor.Error('error-max-number-simultaneous-chats-reached', 'Not allowed');
			}
			agent = null;
		}

		console.log('----resumeOnHold agent', agent);

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

		let resp = (LivechatRooms as any).unsetIsChatOnHold(roomId);
		console.log('----resumeOnHold rooms db response', resp);
		resp = Subscriptions.unsetIsChatOnHold(roomId);
		console.log('----resumeOnHold subscription db response', resp);
		(LivechatRooms as any).unsetCanPlaceOnHold(roomId);
		(LivechatRooms as any).unsetPredictedVisitorAbandonmentByRoomId(roomId);
	},
});
