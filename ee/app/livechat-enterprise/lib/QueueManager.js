import { Meteor } from 'meteor/meteor';

import { Subscriptions, LivechatRooms, LivechatInquiry } from '../../../../app/models/server';
import { callbacks } from '../../../../app/callbacks/server';
import { RoutingManager } from '../../../../app/livechat/server/lib/RoutingManager';
import { Livechat } from '../../../../app/livechat/server';
import { dispatchInquiryPosition } from '../server/lib/Helper';

export const QueueManager = {
	resumeOnHoldChat(room, options) {
		const { _id: roomId, servedBy: { _id: agentId = null, username = null } = {} } = room;
		let agent = { agentId, username };
		const inquiry = LivechatInquiry.findOneByRoomId(roomId, {});
		const { departmentId } = inquiry;

		try {
			agent = Promise.await(callbacks.run('livechat.checkAgentBeforeTakeInquiry', agent, inquiry));
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

				const [inq] = LivechatInquiry.getCurrentSortedQueueAsync({ _id: inquiry._id, department: undefined });
				if (inq) {
					dispatchInquiryPosition(inq);
				}
			}
		}

		LivechatRooms.unsetAllOnHoldFieldsByRoomId(roomId);
		Subscriptions.unsetOnHold(roomId);
	},
};
