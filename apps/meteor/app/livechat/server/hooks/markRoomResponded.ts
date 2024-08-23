import type { IOmnichannelRoom, IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isMessageFromVisitor, isSystemMessage } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { LivechatRooms, LivechatVisitors, LivechatInquiry } from '@rocket.chat/models';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatInquiryChanged } from '../../../lib/server/lib/notifyListener';

export async function markRoomResponded(
	message: IMessage,
	room: IOmnichannelRoom,
	roomUpdater: Updater<IOmnichannelRoom>,
): Promise<IOmnichannelRoom['responseBy'] | undefined> {
	if (isSystemMessage(message) || isEditedMessage(message) || isMessageFromVisitor(message)) {
		return;
	}

	const monthYear = moment().format('YYYY-MM');
	const isVisitorActive = await LivechatVisitors.isVisitorActiveOnPeriod(room.v._id, monthYear);

	// Case: agent answers & visitor is not active, we mark visitor as active
	if (!isVisitorActive) {
		await LivechatVisitors.markVisitorActiveForPeriod(room.v._id, monthYear);
	}

	if (!room.v?.activity?.includes(monthYear)) {
		LivechatRooms.getVisitorActiveForPeriodUpdateQuery(monthYear, roomUpdater);
		const livechatInquiry = await LivechatInquiry.markInquiryActiveForPeriod(room._id, monthYear);

		if (livechatInquiry) {
			void notifyOnLivechatInquiryChanged(livechatInquiry, 'updated', { v: livechatInquiry.v });
		}
	}

	if (room.responseBy) {
		LivechatRooms.getAgentLastMessageTsUpdateQuery(roomUpdater);
	}

	if (!room.waitingResponse) {
		// case where agent sends second message or any subsequent message in a room before visitor responds to the first message
		// in this case, we just need to update the lastMessageTs of the responseBy object
		if (room.responseBy) {
			LivechatRooms.getAgentLastMessageTsUpdateQuery(roomUpdater);
		}

		return room.responseBy;
	}

	const responseBy: IOmnichannelRoom['responseBy'] = room.responseBy || {
		_id: message.u._id,
		username: message.u.username,
		firstResponseTs: new Date(message.ts),
		lastMessageTs: new Date(message.ts),
	};

	LivechatRooms.getResponseByRoomIdUpdateQuery(responseBy, roomUpdater);

	return responseBy;
}

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room, roomUpdater }) => {
		if (!message || isEditedMessage(message) || isMessageFromVisitor(message) || isSystemMessage(message)) {
			return;
		}

		await markRoomResponded(message, room, roomUpdater);
	},
	callbacks.priority.HIGH,
	'markRoomResponded',
);
