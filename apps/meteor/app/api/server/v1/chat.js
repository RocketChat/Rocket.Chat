import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Messages } from '../../../models';
import { canAccessRoom, canAccessRoomId, roomAccessAttributes, hasPermission } from '../../../authorization/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { processWebhookMessage } from '../../../lib/server';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import { executeSetReaction } from '../../../reactions/server/setReaction';
import { API } from '../api';
import Rooms from '../../../models/server/models/Rooms';
import Users from '../../../models/server/models/Users';
import Subscriptions from '../../../models/server/models/Subscriptions';
import { settings } from '../../../settings/server';
import {
	findMentionedMessages,
	findStarredMessages,
	findSnippetedMessageById,
	findSnippetedMessages,
	findDiscussionsFromRoom,
} from '../lib/messages';

API.v1.addRoute(
	'chat.delete',
	{ authRequired: true },
	{
		post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					msgId: String,
					roomId: String,
					asUser: Match.Maybe(Boolean),
				}),
			);

			const msg = Messages.findOneById(this.bodyParams.msgId, { fields: { u: 1, rid: 1 } });

			if (!msg) {
				return API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
			}

			if (this.bodyParams.roomId !== msg.rid) {
				return API.v1.failure('The room id provided does not match where the message is from.');
			}

			if (this.bodyParams.asUser && msg.u._id !== this.userId && !hasPermission(this.userId, 'force-delete-message', msg.rid)) {
				return API.v1.failure('Unauthorized. You must have the permission "force-delete-message" to delete other\'s message as them.');
			}

			Meteor.runAsUser(this.bodyParams.asUser ? msg.u._id : this.userId, () => {
				Meteor.call('deleteMessage', { _id: msg._id });
			});

			return API.v1.success({
				_id: msg._id,
				ts: Date.now(),
				message: msg,
			});
		},
	},
);

API.v1.addRoute(
	'chat.syncMessages',
	{ authRequired: true },
	{
		get() {
			const { roomId, lastUpdate } = this.queryParams;

			if (!roomId) {
				throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
			}

			if (!lastUpdate) {
				throw new Meteor.Error('error-lastUpdate-param-not-provided', 'The required "lastUpdate" query param is missing.');
			} else if (isNaN(Date.parse(lastUpdate))) {
				throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
			}

			let result;
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('messages/get', roomId, { lastUpdate: new Date(lastUpdate) });
			});

			if (!result) {
				return API.v1.failure();
			}

			return API.v1.success({
				result: {
					updated: normalizeMessagesForUser(result.updated, this.userId),
					deleted: result.deleted,
				},
			});
		},
	},
);

API.v1.addRoute(
	'chat.getMessage',
	{ authRequired: true },
	{
		get() {
			if (!this.queryParams.msgId) {
				return API.v1.failure('The "msgId" query parameter must be provided.');
			}

			let msg;
			Meteor.runAsUser(this.userId, () => {
				msg = Meteor.call('getSingleMessage', this.queryParams.msgId);
			});

			if (!msg) {
				return API.v1.failure();
			}

			const [message] = normalizeMessagesForUser([msg], this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.pinMessage',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
				throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
			}

			const msg = Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			let pinnedMessage;
			Meteor.runAsUser(this.userId, () => {
				pinnedMessage = Meteor.call('pinMessage', msg);
			});

			const [message] = normalizeMessagesForUser([pinnedMessage], this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.postMessage',
	{ authRequired: true },
	{
		post() {
			const messageReturn = processWebhookMessage(this.bodyParams, this.user)[0];

			if (!messageReturn) {
				return API.v1.failure('unknown-error');
			}

			const [message] = normalizeMessagesForUser([messageReturn.message], this.userId);

			return API.v1.success({
				ts: Date.now(),
				channel: messageReturn.channel,
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.search',
	{ authRequired: true },
	{
		get() {
			const { roomId, searchText } = this.queryParams;
			const { offset, count } = this.getPaginationItems();

			if (!roomId) {
				throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
			}

			if (!searchText) {
				throw new Meteor.Error('error-searchText-param-not-provided', 'The required "searchText" query param is missing.');
			}

			let result;
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('messageSearch', searchText, roomId, count, offset).message.docs;
			});

			return API.v1.success({
				messages: normalizeMessagesForUser(result, this.userId),
			});
		},
	},
);

// The difference between `chat.postMessage` and `chat.sendMessage` is that `chat.sendMessage` allows
// for passing a value for `_id` and the other one doesn't. Also, `chat.sendMessage` only sends it to
// one channel whereas the other one allows for sending to more than one channel at a time.
API.v1.addRoute(
	'chat.sendMessage',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.message) {
				throw new Meteor.Error('error-invalid-params', 'The "message" parameter must be provided.');
			}

			const sent = executeSendMessage(this.userId, this.bodyParams.message);
			const [message] = normalizeMessagesForUser([sent], this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.starMessage',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
				throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
			}

			const msg = Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			Meteor.runAsUser(this.userId, () =>
				Meteor.call('starMessage', {
					_id: msg._id,
					rid: msg.rid,
					starred: true,
				}),
			);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.unPinMessage',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
				throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
			}

			const msg = Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			Meteor.runAsUser(this.userId, () => Meteor.call('unpinMessage', msg));

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.unStarMessage',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
				throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
			}

			const msg = Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			Meteor.runAsUser(this.userId, () =>
				Meteor.call('starMessage', {
					_id: msg._id,
					rid: msg.rid,
					starred: false,
				}),
			);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.update',
	{ authRequired: true },
	{
		post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					msgId: String,
					text: String, // Using text to be consistant with chat.postMessage
				}),
			);

			const msg = Messages.findOneById(this.bodyParams.msgId);

			// Ensure the message exists
			if (!msg) {
				return API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
			}

			if (this.bodyParams.roomId !== msg.rid) {
				return API.v1.failure('The room id provided does not match where the message is from.');
			}

			// Permission checks are already done in the updateMessage method, so no need to duplicate them
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('updateMessage', { _id: msg._id, msg: this.bodyParams.text, rid: msg.rid });
			});

			const [message] = normalizeMessagesForUser([Messages.findOneById(msg._id)], this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.react',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
				throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
			}

			const msg = Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			const emoji = this.bodyParams.emoji || this.bodyParams.reaction;

			if (!emoji) {
				throw new Meteor.Error('error-emoji-param-not-provided', 'The required "emoji" param is missing.');
			}

			Meteor.runAsUser(this.userId, () => Promise.await(executeSetReaction(emoji, msg._id, this.bodyParams.shouldReact)));

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.getMessageReadReceipts',
	{ authRequired: true },
	{
		async get() {
			const { messageId } = this.queryParams;
			if (!messageId) {
				return API.v1.failure({
					error: "The required 'messageId' param is missing.",
				});
			}

			try {
				return API.v1.success({
					receipts: await Meteor.call('getReadReceipts', { messageId }),
				});
			} catch (error) {
				return API.v1.failure({
					error: error.message,
				});
			}
		},
	},
);

API.v1.addRoute(
	'chat.reportMessage',
	{ authRequired: true },
	{
		post() {
			const { messageId, description } = this.bodyParams;
			if (!messageId) {
				return API.v1.failure('The required "messageId" param is missing.');
			}

			if (!description) {
				return API.v1.failure('The required "description" param is missing.');
			}

			Meteor.call('reportMessage', messageId, description);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.ignoreUser',
	{ authRequired: true },
	{
		get() {
			const { rid, userId } = this.queryParams;
			let { ignore = true } = this.queryParams;

			ignore = typeof ignore === 'string' ? /true|1/.test(ignore) : ignore;

			if (!rid || !rid.trim()) {
				throw new Meteor.Error('error-room-id-param-not-provided', 'The required "rid" param is missing.');
			}

			if (!userId || !userId.trim()) {
				throw new Meteor.Error('error-user-id-param-not-provided', 'The required "userId" param is missing.');
			}

			Meteor.runAsUser(this.userId, () => Meteor.call('ignoreUser', { rid, userId, ignore }));

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.getDeletedMessages',
	{ authRequired: true },
	{
		get() {
			const { roomId, since } = this.queryParams;
			const { offset, count } = this.getPaginationItems();

			if (!roomId) {
				throw new Meteor.Error('The required "roomId" query param is missing.');
			}

			if (!since) {
				throw new Meteor.Error('The required "since" query param is missing.');
			} else if (isNaN(Date.parse(since))) {
				throw new Meteor.Error('The "since" query parameter must be a valid date.');
			}
			const cursor = Messages.trashFindDeletedAfter(
				new Date(since),
				{ rid: roomId },
				{
					skip: offset,
					limit: count,
					fields: { _id: 1 },
				},
			);

			const total = cursor.count();

			const messages = cursor.fetch();

			return API.v1.success({
				messages,
				count: messages.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'chat.getPinnedMessages',
	{ authRequired: true },
	{
		get() {
			const { roomId } = this.queryParams;
			const { offset, count } = this.getPaginationItems();

			if (!roomId) {
				throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
			}

			if (!canAccessRoomId(roomId, this.userId)) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			const cursor = Messages.findPinnedByRoom(roomId, {
				skip: offset,
				limit: count,
			});

			const total = cursor.count();

			const messages = cursor.fetch();

			return API.v1.success({
				messages,
				count: messages.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'chat.getThreadsList',
	{ authRequired: true },
	{
		get() {
			const { rid, type, text } = this.queryParams;
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			if (!rid) {
				throw new Meteor.Error('The required "rid" query param is missing.');
			}
			if (!settings.get('Threads_enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
			}
			const user = Users.findOneById(this.userId, { fields: { _id: 1 } });
			const room = Rooms.findOneById(rid, { fields: { ...roomAccessAttributes, t: 1, _id: 1 } });

			if (!canAccessRoom(room, user)) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}

			const typeThread = {
				_hidden: { $ne: true },
				...(type === 'following' && { replies: { $in: [this.userId] } }),
				...(type === 'unread' && { _id: { $in: Subscriptions.findOneByRoomIdAndUserId(room._id, user._id).tunread } }),
				msg: new RegExp(escapeRegExp(text), 'i'),
			};

			const threadQuery = { ...query, ...typeThread, rid, tcount: { $exists: true } };
			const cursor = Messages.find(threadQuery, {
				sort: sort || { tlm: -1 },
				skip: offset,
				limit: count,
				fields,
			});

			const total = cursor.count();

			const threads = cursor.fetch();

			return API.v1.success({
				threads,
				count: threads.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'chat.syncThreadsList',
	{ authRequired: true },
	{
		get() {
			const { rid } = this.queryParams;
			const { query, fields, sort } = this.parseJsonQuery();
			const { updatedSince } = this.queryParams;
			let updatedSinceDate;
			if (!settings.get('Threads_enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
			}
			if (!rid) {
				throw new Meteor.Error('error-room-id-param-not-provided', 'The required "rid" query param is missing.');
			}
			if (!updatedSince) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The required param "updatedSince" is missing.');
			}
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
			const user = Users.findOneById(this.userId, { fields: { _id: 1 } });
			const room = Rooms.findOneById(rid, { fields: { ...roomAccessAttributes, t: 1, _id: 1 } });

			if (!canAccessRoom(room, user)) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}
			const threadQuery = Object.assign({}, query, { rid, tcount: { $exists: true } });
			return API.v1.success({
				threads: {
					update: Messages.find({ ...threadQuery, _updatedAt: { $gt: updatedSinceDate } }, { fields, sort }).fetch(),
					remove: Messages.trashFindDeletedAfter(updatedSinceDate, threadQuery, { fields, sort }).fetch(),
				},
			});
		},
	},
);

API.v1.addRoute(
	'chat.getThreadMessages',
	{ authRequired: true },
	{
		get() {
			const { tmid } = this.queryParams;
			const { query, fields, sort } = this.parseJsonQuery();
			const { offset, count } = this.getPaginationItems();

			if (!settings.get('Threads_enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
			}
			if (!tmid) {
				throw new Meteor.Error('error-invalid-params', 'The required "tmid" query param is missing.');
			}
			const thread = Messages.findOneById(tmid, { fields: { rid: 1 } });
			if (!thread || !thread.rid) {
				throw new Meteor.Error('error-invalid-message', 'Invalid Message');
			}
			const user = Users.findOneById(this.userId, { fields: { _id: 1 } });
			const room = Rooms.findOneById(thread.rid, { fields: { ...roomAccessAttributes, t: 1, _id: 1 } });

			if (!canAccessRoom(room, user)) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}
			const cursor = Messages.find(
				{ ...query, tmid },
				{
					sort: sort || { ts: 1 },
					skip: offset,
					limit: count,
					fields,
				},
			);

			const total = cursor.count();

			const messages = cursor.fetch();

			return API.v1.success({
				messages,
				count: messages.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'chat.syncThreadMessages',
	{ authRequired: true },
	{
		get() {
			const { tmid } = this.queryParams;
			const { query, fields, sort } = this.parseJsonQuery();
			const { updatedSince } = this.queryParams;
			let updatedSinceDate;
			if (!settings.get('Threads_enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
			}
			if (!tmid) {
				throw new Meteor.Error('error-invalid-params', 'The required "tmid" query param is missing.');
			}
			if (!updatedSince) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The required param "updatedSince" is missing.');
			}
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
			const thread = Messages.findOneById(tmid, { fields: { rid: 1 } });
			if (!thread || !thread.rid) {
				throw new Meteor.Error('error-invalid-message', 'Invalid Message');
			}
			const user = Users.findOneById(this.userId, { fields: { _id: 1 } });
			const room = Rooms.findOneById(thread.rid, { fields: { ...roomAccessAttributes, t: 1, _id: 1 } });

			if (!canAccessRoom(room, user)) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}
			return API.v1.success({
				messages: {
					update: Messages.find({ ...query, tmid, _updatedAt: { $gt: updatedSinceDate } }, { fields, sort }).fetch(),
					remove: Messages.trashFindDeletedAfter(updatedSinceDate, { ...query, tmid }, { fields, sort }).fetch(),
				},
			});
		},
	},
);

API.v1.addRoute(
	'chat.followMessage',
	{ authRequired: true },
	{
		post() {
			const { mid } = this.bodyParams;

			if (!mid) {
				throw new Meteor.Error('The required "mid" body param is missing.');
			}
			Meteor.runAsUser(this.userId, () => Meteor.call('followMessage', { mid }));
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.unfollowMessage',
	{ authRequired: true },
	{
		post() {
			const { mid } = this.bodyParams;

			if (!mid) {
				throw new Meteor.Error('The required "mid" body param is missing.');
			}
			Meteor.runAsUser(this.userId, () => Meteor.call('unfollowMessage', { mid }));
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.getMentionedMessages',
	{ authRequired: true },
	{
		get() {
			const { roomId } = this.queryParams;
			const { sort } = this.parseJsonQuery();
			const { offset, count } = this.getPaginationItems();
			if (!roomId) {
				throw new Meteor.Error('error-invalid-params', 'The required "roomId" query param is missing.');
			}
			const messages = Promise.await(
				findMentionedMessages({
					uid: this.userId,
					roomId,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
			return API.v1.success(messages);
		},
	},
);

API.v1.addRoute(
	'chat.getStarredMessages',
	{ authRequired: true },
	{
		get() {
			const { roomId } = this.queryParams;
			const { sort } = this.parseJsonQuery();
			const { offset, count } = this.getPaginationItems();

			if (!roomId) {
				throw new Meteor.Error('error-invalid-params', 'The required "roomId" query param is missing.');
			}
			const messages = Promise.await(
				findStarredMessages({
					uid: this.userId,
					roomId,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);

			messages.messages = normalizeMessagesForUser(messages.messages, this.userId);

			return API.v1.success(messages);
		},
	},
);

API.v1.addRoute(
	'chat.getSnippetedMessageById',
	{ authRequired: true },
	{
		get() {
			const { messageId } = this.queryParams;

			if (!messageId) {
				throw new Meteor.Error('error-invalid-params', 'The required "messageId" query param is missing.');
			}
			const message = Promise.await(
				findSnippetedMessageById({
					uid: this.userId,
					messageId,
				}),
			);
			return API.v1.success(message);
		},
	},
);

API.v1.addRoute(
	'chat.getSnippetedMessages',
	{ authRequired: true },
	{
		get() {
			const { roomId } = this.queryParams;
			const { sort } = this.parseJsonQuery();
			const { offset, count } = this.getPaginationItems();

			if (!roomId) {
				throw new Meteor.Error('error-invalid-params', 'The required "roomId" query param is missing.');
			}
			const messages = Promise.await(
				findSnippetedMessages({
					uid: this.userId,
					roomId,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
			return API.v1.success(messages);
		},
	},
);

API.v1.addRoute(
	'chat.getDiscussions',
	{ authRequired: true },
	{
		async get() {
			const { roomId, text } = this.queryParams;
			const { sort } = this.parseJsonQuery();
			const { offset, count } = this.getPaginationItems();

			if (!roomId) {
				throw new Meteor.Error('error-invalid-params', 'The required "roomId" query param is missing.');
			}
			const messages = await findDiscussionsFromRoom({
				uid: this.userId,
				roomId,
				text,
				pagination: {
					offset,
					count,
					sort,
				},
			});
			return API.v1.success(messages);
		},
	},
);
