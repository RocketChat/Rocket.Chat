import QueryString from 'querystring';
import URL from 'url';

import type { MessageAttachment, IMessage, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isQuoteAttachment } from '@rocket.chat/core-typings';
import { Messages, Users, Rooms } from '@rocket.chat/models';

import { callbacks } from '../../../lib/callbacks';
import { createQuoteAttachment } from '../../../lib/createQuoteAttachment';
import { canAccessRoomAsync } from '../../authorization/server/functions/canAccessRoom';
import { settings } from '../../settings/server';
import { getUserAvatarURL } from '../../utils/server/getUserAvatarURL';

const recursiveRemoveAttachments = (attachments: MessageAttachment, deep = 1, quoteChainLimit: number): MessageAttachment => {
	if (attachments && isQuoteAttachment(attachments)) {
		if (deep < quoteChainLimit - 1) {
			attachments.attachments?.map((msg) => recursiveRemoveAttachments(msg, deep + 1, quoteChainLimit));
		} else {
			delete attachments.attachments;
		}
	}

	return attachments;
};

const validateAttachmentDeepness = (message: IMessage): IMessage => {
	if (!message?.attachments) {
		return message;
	}

	const quoteChainLimit = settings.get<number>('Message_QuoteChainLimit');
	if ((message.attachments && quoteChainLimit < 2) || isNaN(quoteChainLimit)) {
		delete message.attachments;
	}

	message.attachments = message.attachments?.map((attachment) => recursiveRemoveAttachments(attachment, 1, quoteChainLimit));

	return message;
};

callbacks.add(
	'beforeSaveMessage',
	async (msg) => {
		// if no message is present, or the message doesn't have any URL, skip
		if (!msg?.urls?.length) {
			return msg;
		}

		const currentUser = await Users.findOneById(msg.u._id);

		for await (const item of msg.urls) {
			// if the URL doesn't belong to the current server, skip
			if (!item.url.includes(settings.get('Site_Url'))) {
				continue;
			}

			const urlObj = URL.parse(item.url);

			// if the URL doesn't have query params (doesn't reference message) skip
			if (!urlObj.query) {
				continue;
			}

			const { msg: msgId } = QueryString.parse(urlObj.query);

			if (typeof msgId !== 'string') {
				continue;
			}

			const message = await Messages.findOneById(msgId);

			const jumpToMessage = message && validateAttachmentDeepness(message);
			if (!jumpToMessage) {
				continue;
			}

			// validates if user can see the message
			// user has to belong to the room the message was first wrote in
			const room = await Rooms.findOneById<IOmnichannelRoom>(jumpToMessage.rid);
			if (!room) {
				continue;
			}
			const isLiveChatRoomVisitor = !!msg.token && !!room.v?.token && msg.token === room.v.token;
			const canAccessRoomForUser = isLiveChatRoomVisitor || (currentUser && (await canAccessRoomAsync(room, currentUser)));
			if (!canAccessRoomForUser) {
				continue;
			}

			msg.attachments = msg.attachments || [];
			// Only QuoteAttachments have "message_link" property
			const index = msg.attachments.findIndex((a) => isQuoteAttachment(a) && a.message_link === item.url);
			if (index > -1) {
				msg.attachments.splice(index, 1);
			}

			const useRealName = Boolean(settings.get('UI_Use_Real_Name'));

			msg.attachments.push(
				createQuoteAttachment(jumpToMessage, item.url, useRealName, getUserAvatarURL(jumpToMessage.u.username || '') as string),
			);
			item.ignoreParse = true;
		}

		return msg;
	},
	callbacks.priority.LOW,
	'jumpToMessage',
);
