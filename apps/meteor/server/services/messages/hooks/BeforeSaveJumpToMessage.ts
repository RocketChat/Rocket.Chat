import QueryString from 'querystring';
import URL from 'url';

import { Authorization } from '@rocket.chat/core-services';
import type { MessageAttachment, IMessage, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { isQuoteAttachment } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';

import { settings } from '../../../../app/settings/server';
import { getUserAvatarURL } from '../../../../app/utils/server/getUserAvatarURL';
import { createQuoteAttachment } from '../../../../lib/createQuoteAttachment';

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

/**
 * Transform URLs in messages into quote attachments
 */
export class BeforeSaveJumpToMessage {
	async createAttachmentForMessageURLs({
		message,
		user: currentUser,
	}: {
		message: IMessage;
		user: Pick<IUser, '_id' | 'username' | 'name' | 'language'>;
	}): Promise<IMessage> {
		// if no message is present, or the message doesn't have any URL, skip
		if (!message?.urls?.length) {
			return message;
		}

		for await (const item of message.urls) {
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

			const messageFromUrl = await Messages.findOneById(msgId);

			const jumpToMessage = messageFromUrl && validateAttachmentDeepness(messageFromUrl);
			if (!jumpToMessage) {
				continue;
			}

			// validates if user can see the message
			// user has to belong to the room the message was first wrote in
			const room = await Rooms.findOneById<IOmnichannelRoom>(jumpToMessage.rid);
			if (!room) {
				continue;
			}
			const isLiveChatRoomVisitor = !!message.token && !!room.v?.token && message.token === room.v.token;
			const canAccessRoomForUser = isLiveChatRoomVisitor || (currentUser && (await Authorization.canAccessRoom(room, currentUser)));
			if (!canAccessRoomForUser) {
				continue;
			}

			message.attachments = message.attachments || [];
			// Only QuoteAttachments have "message_link" property
			const index = message.attachments.findIndex((a) => isQuoteAttachment(a) && a.message_link === item.url);
			if (index > -1) {
				message.attachments.splice(index, 1);
			}

			const useRealName = Boolean(settings.get('UI_Use_Real_Name'));

			message.attachments.push(
				createQuoteAttachment(jumpToMessage, item.url, useRealName, getUserAvatarURL(jumpToMessage.u.username || '') as string),
			);
			item.ignoreParse = true;
		}

		return message;
	}
}
