import type { IOmnichannelRoom, IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage, isMessageFromVisitor, isSystemMessage } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { LivechatRooms, LivechatContacts, LivechatInquiry } from '@rocket.chat/models';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatInquiryChanged } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { isMessageFromBot } from '../lib/isMessageFromBot';

export async function markRoomResponded(
	message: IMessage,
	room: IOmnichannelRoom,
	roomUpdater: Updater<IOmnichannelRoom>,
): Promise<IOmnichannelRoom['responseBy'] | undefined> {
	if (
		isSystemMessage(message) ||
		isEditedMessage(message) ||
		isMessageFromVisitor(message) ||
		(settings.get<boolean>('Omnichannel_Metrics_Ignore_Automatic_Messages') && (await isMessageFromBot(message)))
	) {
		return;
	}

	const monthYear = moment().format('YYYY-MM');
	const isContactActive = await LivechatContacts.isContactActiveOnPeriod({ visitorId: room.v._id, source: room.source }, monthYear);

	// Case: agent answers & visitor is not active, we mark visitor as active
	if (!isContactActive) {
		await LivechatContacts.markContactActiveForPeriod({ visitorId: room.v._id, source: room.source }, monthYear);
	}

	if (!room.v?.activity?.includes(monthYear)) {
		LivechatRooms.getVisitorActiveForPeriodUpdateQuery(monthYear, roomUpdater);
		const livechatInquiry = await LivechatInquiry.markInquiryActiveForPeriod(room._id, monthYear);

		if (livechatInquiry) {
			void notifyOnLivechatInquiryChanged(livechatInquiry, 'updated', { v: livechatInquiry.v });
		}
	}

	if (!room.waitingResponse) {
		// case where agent sends second message or any subsequent message in a room before visitor responds to the first message
		// in this case, we just need to update the lastMessageTs of the responseBy object
		if (room.responseBy) {
			LivechatRooms.getAgentLastMessageTsUpdateQuery(roomUpdater);
		}

		return room.responseBy;
	}

	// Since we're updating the whole object anyways, we re-use the same values from object (or from message if not present)
	// And then we update the lastMessageTs, which is the only thing that should be updating here
	const { responseBy: { _id, username, firstResponseTs } = {} } = room;
	const responseBy: IOmnichannelRoom['responseBy'] = {
		_id: _id || message.u._id,
		username: username || message.u.username,
		firstResponseTs: firstResponseTs || new Date(message.ts),
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
