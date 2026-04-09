import URL from 'url';

import type { MessageAttachment, MessageUrl, IMessage, IUser, IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, isQuoteAttachment } from '@rocket.chat/core-typings';

import { createQuoteAttachment } from '../../../../lib/createQuoteAttachment';

const getMessageIdFromUrl = (url: string): string | undefined => {
	const { query } = URL.parse(url, true);
	return typeof query?.msg === 'string' ? query.msg : undefined;
};

const recursiveRemoveAttachments = (attachments: MessageAttachment, deep = 1, quoteChainLimit: number): MessageAttachment => {
	if (attachments && isQuoteAttachment(attachments)) {
		if (deep < quoteChainLimit - 1) {
			attachments.attachments?.map((msg) => recursiveRemoveAttachments(msg, deep + 1, quoteChainLimit));
		} else if (attachments.attachments) {
			attachments.attachments = attachments.attachments.filter((attachment) => !isQuoteAttachment(attachment));
			if (attachments.attachments.length === 0) {
				delete attachments.attachments;
			}
		}
	}

	return attachments;
};

const validateAttachmentDeepness = (message: IMessage, quoteChainLimit: number): IMessage => {
	if (!message?.attachments) {
		return message;
	}

	if ((message.attachments && quoteChainLimit < 2) || isNaN(quoteChainLimit)) {
		message.attachments = message.attachments.filter((attachment) => !isQuoteAttachment(attachment));
		if (message.attachments.length === 0) {
			delete message.attachments;
		}
	}

	message.attachments = message.attachments?.map((attachment) => recursiveRemoveAttachments(attachment, 1, quoteChainLimit));

	return message;
};

const removeQuoteAttachments = (message: IMessage) => {
	if (!message.attachments) {
		return;
	}
	message.attachments = message.attachments.filter((attachment) => !isQuoteAttachment(attachment));
};

type JumpToMessageInit = {
	getMessages(messageIds: IMessage['_id'][]): Promise<IMessage[]>;
	getRooms(roomIds: IRoom['_id'][]): Promise<IRoom[] | IOmnichannelRoom[] | null>;
	canAccessRoom(room: IRoom, user: Pick<IUser, '_id' | 'username' | 'name' | 'language'>): Promise<boolean>;
	getUserAvatarURL(user?: string): string;
};

/**
 * Transform URLs in messages into quote attachments
 */
export class BeforeSaveJumpToMessage {
	private getMessages: JumpToMessageInit['getMessages'];

	private getRooms: JumpToMessageInit['getRooms'];

	private canAccessRoom: JumpToMessageInit['canAccessRoom'];

	private getUserAvatarURL: JumpToMessageInit['getUserAvatarURL'];

	constructor(options: JumpToMessageInit) {
		this.getMessages = options.getMessages;
		this.getRooms = options.getRooms;
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
			useRealName: boolean;
		};
	}): Promise<IMessage> {
		// Quote attachments are always rebuilt. Do not keep old ones since they may not still be linked to the message
		removeQuoteAttachments(message);

		// if no message is present, or the message doesn't have any URL, skip
		if (!message?.urls?.length) {
			return message;
		}

		const linkedMessages: { msgId: string; urlItem: MessageUrl }[] = [];
		for (const urlItem of message.urls) {
			const msgId = getMessageIdFromUrl(urlItem.url);
			if (msgId) {
				linkedMessages.push({ msgId, urlItem });
			}
		}

		const msgs = await this.getMessages(linkedMessages.map((linkedMsg) => linkedMsg.msgId));

		const validMessages = msgs.filter((msg) => validateAttachmentDeepness(msg, config.chainLimit));

		const rooms = await this.getRooms(validMessages.map((msg) => msg.rid));

		const roomsWithPermission =
			rooms &&
			(await Promise.all(
				rooms.map(async (room) => {
					if (!!message.token && isOmnichannelRoom(room) && !!room.v?.token && message.token === room.v.token) {
						return room;
					}

					if (currentUser && (await this.canAccessRoom(room, currentUser))) {
						return room;
					}
				}),
			));

		const validRooms = roomsWithPermission?.filter((room) => !!room);

		const { useRealName } = config;

		const quotes = [];

		for (const { msgId, urlItem } of linkedMessages) {
			const messageFromUrl = validMessages.find((msg) => msg._id === msgId);
			if (!messageFromUrl) {
				continue;
			}

			if (!validRooms?.find((room) => room?._id === messageFromUrl.rid)) {
				continue;
			}

			// prevent OEmbed from also fetching this URL for a link preview
			urlItem.ignoreParse = true;

			quotes.push(createQuoteAttachment(messageFromUrl, urlItem.url, useRealName, this.getUserAvatarURL(messageFromUrl.u.username)));
		}

		if (quotes.length > 0) {
			const currentAttachments = message.attachments || [];
			message.attachments = [...currentAttachments, ...quotes];
		}

		return message;
	}
}
