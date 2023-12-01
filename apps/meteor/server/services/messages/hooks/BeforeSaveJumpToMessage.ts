import QueryString from 'querystring';
import URL from 'url';

import type { MessageAttachment, IMessage, IUser, IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, isQuoteAttachment } from '@rocket.chat/core-typings';

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

const validateAttachmentDeepness = (message: IMessage, quoteChainLimit: number): IMessage => {
	if (!message?.attachments) {
		return message;
	}

	if ((message.attachments && quoteChainLimit < 2) || isNaN(quoteChainLimit)) {
		delete message.attachments;
	}

	message.attachments = message.attachments?.map((attachment) => recursiveRemoveAttachments(attachment, 1, quoteChainLimit));

	return message;
};

type JumpToMessageInit = {
	getMessage(messageId: IMessage['_id']): Promise<IMessage | null>;
	getRoom(roomId: IRoom['_id']): Promise<IRoom | IOmnichannelRoom | null>;
	canAccessRoom(room: IRoom, user: Pick<IUser, '_id' | 'username' | 'name' | 'language'>): Promise<boolean>;
	getUserAvatarURL(user?: string): string;
};

/**
 * Transform URLs in messages into quote attachments
 */
export class BeforeSaveJumpToMessage {
	private getMessage: JumpToMessageInit['getMessage'];

	private getRoom: JumpToMessageInit['getRoom'];

	private canAccessRoom: JumpToMessageInit['canAccessRoom'];

	private getUserAvatarURL: JumpToMessageInit['getUserAvatarURL'];

	constructor(options: JumpToMessageInit) {
		this.getMessage = options.getMessage;
		this.getRoom = options.getRoom;
		this.canAccessRoom = options.canAccessRoom;
		this.getUserAvatarURL = options.getUserAvatarURL;
	}

	async createAttachmentForMessageURLs({
		message,
		user: currentUser,
		config,
	}: {
		message: IMessage;
		user: Pick<IUser, '_id' | 'username' | 'name' | 'language'>;
		config: {
			chainLimit: number;
			siteUrl: string;
			useRealName: boolean;
		};
	}): Promise<IMessage> {
		// if no message is present, or the message doesn't have any URL, skip
		if (!message?.urls?.length) {
			return message;
		}

		for await (const item of message.urls) {
			// if the URL doesn't belong to the current server, skip
			if (!item.url.includes(config.siteUrl)) {
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

			const messageFromUrl = await this.getMessage(msgId);

			const jumpToMessage = messageFromUrl && validateAttachmentDeepness(messageFromUrl, config.chainLimit);
			if (!jumpToMessage) {
				continue;
			}

			// validates if user can see the message
			// user has to belong to the room the message was first wrote in
			const room = await this.getRoom(jumpToMessage.rid);
			if (!room) {
				continue;
			}

			const isLiveChatRoomVisitor = !!message.token && isOmnichannelRoom(room) && !!room.v?.token && message.token === room.v.token;
			const canAccessRoomForUser = isLiveChatRoomVisitor || (currentUser && (await this.canAccessRoom(room, currentUser)));
			if (!canAccessRoomForUser) {
				continue;
			}

			message.attachments = message.attachments || [];
			// Only QuoteAttachments have "message_link" property
			const index = message.attachments.findIndex((a) => isQuoteAttachment(a) && a.message_link === item.url);
			if (index > -1) {
				message.attachments.splice(index, 1);
			}

			const { useRealName } = config;

			message.attachments.push(
				createQuoteAttachment(jumpToMessage, item.url, useRealName, this.getUserAvatarURL(jumpToMessage.u.username)),
			);
			item.ignoreParse = true;
		}

		return message;
	}
}
