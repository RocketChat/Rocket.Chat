import URL from 'url';
import QueryString from 'querystring';

import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import type { ITranslatedMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { isQuoteAttachment } from '@rocket.chat/core-typings';

import { createQuoteAttachment } from '../../../lib/createQuoteAttachment';
import { Messages, Rooms, Users } from '../../models/server';
import { settings } from '../../settings/server';
import { callbacks } from '../../../lib/callbacks';
import { canAccessRoom } from '../../authorization/server/functions/canAccessRoom';

const recursiveRemove = (attachments: MessageAttachment, deep = 1): MessageAttachment => {
	if (attachments && isQuoteAttachment(attachments)) {
		if (deep < settings.get<number>('Message_QuoteChainLimit')) {
			attachments.attachments?.map((msg) => recursiveRemove(msg, deep + 1));
		} else {
			delete attachments.attachments;
		}
	}

	return attachments;
};

const validateAttachmentDeepness = (message: ITranslatedMessage): ITranslatedMessage => {
	if (!message || !message.attachments) {
		return message;
	}

	message.attachments = message.attachments?.map((attachment) => recursiveRemove(attachment));

	return message;
};

callbacks.add(
	'beforeSaveMessage',
	(msg) => {
		// if no message is present, or the message doesn't have any URL, skip
		if (!msg || !msg.urls || !msg.urls.length) {
			return msg;
		}

		const currentUser = Users.findOneById(msg.u._id);

		msg.urls.forEach((item) => {
			// if the URL is not internal, skip
			if (!item.url.includes(Meteor.absoluteUrl())) {
				return;
			}

			const urlObj = URL.parse(item.url);

			// if the URL doesn't have query params (doesn't reference message) skip
			if (!urlObj.query) {
				return;
			}

			const { msg: msgId } = QueryString.parse(urlObj.query);

			if (!_.isString(msgId)) {
				return;
			}

			const jumpToMessage = validateAttachmentDeepness(Messages.findOneById(msgId));
			if (!jumpToMessage) {
				return;
			}

			// validates if user can see the message
			// user has to belong to the room the message was first wrote in
			const room = Rooms.findOneById(jumpToMessage.rid);
			const isLiveChatRoomVisitor = !!msg.token && !!room.v?.token && msg.token === room.v.token;
			const canAccessRoomForUser = isLiveChatRoomVisitor || canAccessRoom(room, currentUser);
			if (!canAccessRoomForUser) {
				return;
			}

			msg.attachments = msg.attachments || [];
			// Only QuoteAttachments have "message_link" property
			const index = msg.attachments.findIndex((a) => isQuoteAttachment(a) && a.message_link === item.url);
			if (index > -1) {
				msg.attachments.splice(index, 1);
			}

			msg.attachments.push(createQuoteAttachment(jumpToMessage, item.url));
			item.ignoreParse = true;
		});

		return msg;
	},
	callbacks.priority.LOW,
	'jumpToMessage',
);
