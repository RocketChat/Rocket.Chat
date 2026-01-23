import type { IMessage, IOmnichannelRoom } from '@rocket.chat/core-typings';

import type { CloseRoomParams } from '../../../../../app/livechat/server/lib/localTypes';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../server/lib/callbacks';
import { AutoTransferChatScheduler } from '../lib/AutoTransferChatScheduler';

type LivechatCloseCallbackParams = {
	room: IOmnichannelRoom;
	options: CloseRoomParams['options'];
};

let autoTransferTimeout = 0;

const handleAfterCloseRoom = async (params: LivechatCloseCallbackParams): Promise<LivechatCloseCallbackParams> => {
	const { room } = params;

	const { _id: rid, autoTransferredAt, autoTransferOngoing } = room;

	if (!autoTransferTimeout || autoTransferTimeout <= 0) {
		return params;
	}

	if (autoTransferredAt) {
		return params;
	}

	if (!autoTransferOngoing) {
		return params;
	}

	await AutoTransferChatScheduler.unscheduleRoom(rid);
	return params;
};

settings.watch('Livechat_auto_transfer_chat_timeout', (value) => {
	autoTransferTimeout = value as number;
	if (!autoTransferTimeout || autoTransferTimeout === 0) {
		callbacks.remove('afterOmnichannelSaveMessage', 'livechat-cancel-auto-transfer-job-after-message');
		callbacks.remove('livechat.closeRoom', 'livechat-cancel-auto-transfer-on-close-room');
		return;
	}

	callbacks.add(
		'afterOmnichannelSaveMessage',
		async (message: IMessage, { room }): Promise<IMessage> => {
			const { _id: rid, autoTransferredAt, autoTransferOngoing } = room;
			const { token, t: messageType } = message;

			if (messageType) {
				// ignore system messages
				return message;
			}

			if (!autoTransferTimeout || autoTransferTimeout <= 0) {
				return message;
			}

			if (!message || token) {
				// ignore messages from visitors
				return message;
			}

			if (autoTransferredAt) {
				return message;
			}

			if (!autoTransferOngoing) {
				return message;
			}

			await AutoTransferChatScheduler.unscheduleRoom(rid);
			return message;
		},
		callbacks.priority.HIGH,
		'livechat-cancel-auto-transfer-job-after-message',
	);
	callbacks.add('livechat.closeRoom', handleAfterCloseRoom, callbacks.priority.HIGH, 'livechat-cancel-auto-transfer-on-close-room');
});
