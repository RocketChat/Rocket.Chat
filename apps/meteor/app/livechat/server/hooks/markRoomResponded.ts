import type { IOmnichannelRoom, IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isMessageFromVisitor } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { LivechatRooms, LivechatVisitors, LivechatInquiry } from '@rocket.chat/models';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatInquiryChanged } from '../../../lib/server/lib/notifyListener';

function mountResponseBy(
	message: IMessage,
	room: IOmnichannelRoom,
	roomUpdater: Updater<IOmnichannelRoom>,
): IOmnichannelRoom['responseBy'] | void {
	if (room.responseBy && !room.waitingResponse) {
		return;
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

function mountAgentLastMessageTs(room: IOmnichannelRoom, roomUpdater: Updater<IOmnichannelRoom>): void {
	if (room.responseBy) {
		LivechatRooms.getAgentLastMessageTsUpdateQuery(roomUpdater);
	}

	if (!room.waitingResponse) {
		// case where agent sends second message or any subsequent message in a room before visitor responds to the first message
		// in this case, we just need to update the lastMessageTs of the responseBy object
		if (room.responseBy) {
			LivechatRooms.getAgentLastMessageTsUpdateQuery(roomUpdater);
		}
	}
}

async function markVisitorAndInquiryActive(room: IOmnichannelRoom): Promise<void> {
	const monthYear = moment().format('YYYY-MM');
	const isVisitorActive = await LivechatVisitors.isVisitorActiveOnPeriod(room.v._id, monthYear);

	// Case: agent answers & visitor is not active, we mark visitor as active
	if (!isVisitorActive) {
		await LivechatVisitors.markVisitorActiveForPeriod(room.v._id, monthYear);
	}

	if (!room.v?.activity?.includes(monthYear)) {
		const [, livechatInquiry] = await Promise.all([
			LivechatRooms.markVisitorActiveForPeriod(room._id, monthYear),
			LivechatInquiry.markInquiryActiveForPeriod(room._id, monthYear),
		]);

		if (livechatInquiry) {
			void notifyOnLivechatInquiryChanged(livechatInquiry, 'updated', { v: livechatInquiry.v });
		}
	}
}

export async function markRoomResponded(
	message: IMessage,
	room: IOmnichannelRoom,
	roomUpdater: Updater<IOmnichannelRoom>,
): Promise<IOmnichannelRoom['responseBy'] | void> {
	await markVisitorAndInquiryActive(room);
	mountAgentLastMessageTs(room, roomUpdater);
	return mountResponseBy(message, room, roomUpdater);
}

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room, roomUpdater }) => {
		if (!message || message.t || isEditedMessage(message) || isMessageFromVisitor(message)) {
			return message;
		}

		await markRoomResponded(message, room, roomUpdater);

		return message;
	},
	callbacks.priority.HIGH,
	'markRoomResponded',
);
