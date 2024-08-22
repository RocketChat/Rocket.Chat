import { OmnichannelEEService } from '@rocket.chat/core-services';
import type { ILivechatVisitor, IMessage, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { isMessageFromVisitor, isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatVisitors, Users } from '@rocket.chat/models';

import { callbackLogger } from '../../../../../app/livechat/server/lib/logger';
import { callbacks } from '../../../../../lib/callbacks';
import { i18n } from '../../../../../server/lib/i18n';

const resumeOnHoldCommentAndUser = async (room: IOmnichannelRoom): Promise<{ comment: string; resumedBy: IUser }> => {
	const {
		v: { _id: visitorId },
		_id: rid,
	} = room;
	const visitor = await LivechatVisitors.findOneEnabledById<Pick<ILivechatVisitor, 'name' | 'username'>>(visitorId, {
		projection: { name: 1, username: 1 },
	});
	if (!visitor) {
		callbackLogger.error(`[afterOmnichannelSaveMessage] Visitor Not found for room ${rid} while trying to resume on hold`);
		throw new Error('Visitor not found while trying to resume on hold');
	}

	const guest = visitor.name || visitor.username;

	const resumeChatComment = i18n.t('Omnichannel_on_hold_chat_automatically', { guest });

	const resumedBy = await Users.findOneById('rocket.cat');
	if (!resumedBy) {
		callbackLogger.error(`[afterOmnichannelSaveMessage] User Not found for room ${rid} while trying to resume on hold`);
		throw new Error(`User not found while trying to resume on hold`);
	}

	return { comment: resumeChatComment, resumedBy };
};

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message: IMessage, { room }) => {
		if (isEditedMessage(message) || message.t) {
			return message;
		}

		const { _id: rid, v: roomVisitor } = room;

		if (!roomVisitor?._id) {
			return message;
		}

		// Need to read the room every time, the room object is not updated
		const updatedRoom = await LivechatRooms.findOneById(rid);
		if (!updatedRoom) {
			return message;
		}

		if (isMessageFromVisitor(message) && room.onHold) {
			callbackLogger.debug(`[afterOmnichannelSaveMessage] Room ${rid} is on hold, resuming it now since visitor sent a message`);

			try {
				const { comment: resumeChatComment, resumedBy } = await resumeOnHoldCommentAndUser(updatedRoom);
				await OmnichannelEEService.resumeRoomOnHold(updatedRoom, resumeChatComment, resumedBy);
			} catch (error) {
				callbackLogger.error(`[afterOmnichannelSaveMessage] Error while resuming room ${rid} on hold: Error: `, error);
				return message;
			}
		}

		return message;
	},
	callbacks.priority.HIGH,
	'livechat-resume-on-hold',
);
