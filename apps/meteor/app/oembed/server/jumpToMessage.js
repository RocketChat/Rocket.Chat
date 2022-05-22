import URL from 'url';
import QueryString from 'querystring';

import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Messages, Rooms, Users } from '../../models/server';
import { settings } from '../../settings/server';
import { callbacks } from '../../../lib/callbacks';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';
import { canAccessRoom } from '../../authorization/server/functions/canAccessRoom';

const recursiveRemove = (message, deep = 1) => {
	if (message) {
		if ('attachments' in message && message.attachments !== null && deep < settings.get('Message_QuoteChainLimit')) {
			message.attachments.map((msg) => recursiveRemove(msg, deep + 1));
		} else {
			delete message.attachments;
		}
	}
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

			const jumpToMessage = recursiveRemove(Messages.findOneById(msgId));
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
			const index = msg.attachments.findIndex((a) => a.message_link === item.url);
			if (index > -1) {
				msg.attachments.splice(index, 1);
			}

			msg.attachments.push({
				text: jumpToMessage.msg,
				translations: jumpToMessage.translations,
				author_name: jumpToMessage.alias || jumpToMessage.u.username,
				author_icon: getUserAvatarURL(jumpToMessage.u.username),
				message_link: item.url,
				attachments: jumpToMessage.attachments || [],
				ts: jumpToMessage.ts,
			});
			item.ignoreParse = true;
		});

		return msg;
	},
	callbacks.priority.LOW,
	'jumpToMessage',
);
