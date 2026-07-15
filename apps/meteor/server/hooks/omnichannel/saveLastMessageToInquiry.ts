import { isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatInquiry } from '@rocket.chat/models';

import { notifyOnLivechatInquiryChanged } from '../../../app/lib/server/lib/notifyListener';
import { RoutingManager } from '../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../app/settings/server';
import { callbacks } from '../../lib/callbacks';

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room }) => {
		if (isEditedMessage(message) || message.t) {
			return message;
		}

		if (!RoutingManager.getConfig()?.showQueue) {
			// since last message is only getting used on UI as preview message when queue is enabled
			return message;
		}

		if (!settings.get('Store_Last_Message')) {
			return message;
		}

		const livechatInquiry = await LivechatInquiry.setLastMessageByRoomId(room._id, message);
		if (livechatInquiry) {
			void notifyOnLivechatInquiryChanged(livechatInquiry, 'updated', { lastMessage: message });
		}

		return message;
	},
	callbacks.priority.LOW,
	'save-last-message-to-inquiry',
);
