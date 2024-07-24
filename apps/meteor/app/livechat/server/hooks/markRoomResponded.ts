import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatVisitors, LivechatInquiry } from '@rocket.chat/models';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatInquiryChanged } from '../../../lib/server/lib/notifyListener';

callbacks.add(
	'afterSaveMessage',
	async (message, room) => {
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (!message || isEditedMessage(message)) {
			return message;
		}

		// skips this callback if the message is a system message
		if (message.t) {
			return message;
		}

		// if the message has a token, it was sent by the visitor, so ignore it
		if (message.token) {
			return message;
		}

		let livechatInquiryResult;

		const updates: Record<any, any> = { $set: {}, $unset: {} };

		// Return YYYY-MM from moment
		const monthYear = moment().format('YYYY-MM');
		const isVisitorActive = await LivechatVisitors.isVisitorActiveOnPeriod(room.v._id, monthYear);

		// Case: agent answers & visitor is not active, we mark visitor as active
		if (!isVisitorActive) {
			await LivechatVisitors.markVisitorActiveForPeriod(room.v._id, monthYear);
		}

		if (!room.v?.activity?.includes(monthYear)) {
			updates.$set['v.activity'] = monthYear;

			livechatInquiryResult = LivechatInquiry.markInquiryActiveForPeriod(room._id, monthYear);
		}

		if (room.responseBy) {
			updates.$set['responseBy.lastMessageTs'] = new Date();
		}

		// check if room is yet awaiting for response from visitor
		if (room.waitingResponse) {
			// This is the first message from agent after visitor had last responded
			const responseBy: IOmnichannelRoom['responseBy'] = room.responseBy || {
				_id: message.u._id,
				username: message.u.username,
				firstResponseTs: new Date(message.ts),
				lastMessageTs: new Date(message.ts),
			};

			// case where agent sends second message or any subsequent message in a room before visitor responds to the first message
			// in this case, we just need to update the lastMessageTs of the responseBy object
			updates.$set.responseBy = responseBy;
			updates.$unset.waitingResponse = 1;
		}

		// TODO replace LivechatRooms.updateOne by something more miningful

		const [livechatInquiry] = await Promise.all([livechatInquiryResult, LivechatRooms.updateOne({ rid: room._id }, updates)]);
		if (livechatInquiry) {
			void notifyOnLivechatInquiryChanged(livechatInquiry, 'updated', { v: livechatInquiry.v });
		}

		// TODO should notify room update as well?

		return message;
	},
	callbacks.priority.HIGH,
	'markRoomResponded',
);
