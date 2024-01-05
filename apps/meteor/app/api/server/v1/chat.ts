import { Message } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, Users, Rooms, Subscriptions } from '@rocket.chat/models';
import { isChatReportMessageProps } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { reportMessage } from '../../../../server/lib/moderation/reportMessage';
import { roomAccessAttributes } from '../../../authorization/server';
import { canAccessRoomAsync, canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { canSendMessageAsync } from '../../../authorization/server/functions/canSendMessage';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { deleteMessageValidatingPermission } from '../../../lib/server/functions/deleteMessage';
import { processWebhookMessage } from '../../../lib/server/functions/processWebhookMessage';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import { executeUpdateMessage } from '../../../lib/server/methods/updateMessage';
import { executeSetReaction } from '../../../reactions/server/setReaction';
import { settings } from '../../../settings/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { findDiscussionsFromRoom, findMentionedMessages, findStarredMessages } from '../lib/messages';

API.v1.addRoute(
	'chat.delete',
	{ authRequired: true },
	{
		async post() {
			try {
				check(
					this.bodyParams,
					Match.ObjectIncluding({
						msgId: String,
						roomId: String,
						asUser: Match.Maybe(Boolean),
					}),
				);

				const msg = await Messages.findOneById(this.bodyParams.msgId, { projection: { u: 1, rid: 1 } });

				if (!msg) {
					return API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
				}

				if (this.bodyParams.roomId !== msg.rid) {
					return API.v1.failure('The room id provided does not match where the message is from.');
				}

				if (
					this.bodyParams.asUser &&
					msg.u._id !== this.userId &&
					!(await hasPermissionAsync(this.userId, 'force-delete-message', msg.rid))
				) {
					return API.v1.failure('Unauthorized. You must have the permission "force-delete-message" to delete other\'s message as them.');
				}

				const userId = this.bodyParams.asUser ? msg.u._id : this.userId;
				const user = await Users.findOneById(userId, { projection: { _id: 1 } });

				if (!user) {
					return API.v1.failure('User not found');
				}

				await deleteMessageValidatingPermission(msg, user._id);

				return API.v1.success({
					_id: msg._id,
					ts: Date.now().toString(),
					message: msg,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.syncMessages',
	{ authRequired: true },
	{
		async get() {
			try {
				const { roomId, lastUpdate } = this.queryParams;

				if (!roomId) {
					throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
				}

				if (!lastUpdate) {
					throw new Meteor.Error('error-lastUpdate-param-not-provided', 'The required "lastUpdate" query param is missing.');
				} else if (isNaN(Date.parse(lastUpdate))) {
					throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
				}

				const result = await Meteor.callAsync('messages/get', roomId, { lastUpdate: new Date(lastUpdate) });

				if (!result) {
					return API.v1.failure();
				}

				return API.v1.success({
					result: {
						updated: await normalizeMessagesForUser(result.updated, this.userId),
						deleted: result.deleted,
					},
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.getMessage',
	{
		authRequired: true,
	},
	{
		async get() {
			try {
				if (!this.queryParams.msgId) {
					return API.v1.failure('The "msgId" query parameter must be provided.');
				}

				const msg = await Meteor.callAsync('getSingleMessage', this.queryParams.msgId);

				if (!msg) {
					return API.v1.failure();
				}

				const [message] = await normalizeMessagesForUser([msg], this.userId);

				return API.v1.success({
					message,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.pinMessage',
	{ authRequired: true },
	{
		async post() {
			try {
				if (!this.bodyParams.messageId?.trim()) {
					throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
				}

				const msg = await Messages.findOneById(this.bodyParams.messageId);

				if (!msg) {
					throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
				}

				const pinnedMessage = await Meteor.callAsync('pinMessage', msg);

				const [message] = await normalizeMessagesForUser([pinnedMessage], this.userId);

				return API.v1.success({
					message,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.postMessage',
	{ authRequired: true },
	{
		async post() {
			try {
				if (this.user) return API.v1.failure('srfvresdfv');
				const messageReturn = (await processWebhookMessage(this.bodyParams, this.user))[0];

				if (!messageReturn) {
					return API.v1.failure('unknown-error');
				}

				const [message] = await normalizeMessagesForUser([messageReturn.message], this.userId);

				return API.v1.success({
					ts: Date.now(),
					channel: messageReturn.channel,
					message,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.search',
	{ authRequired: true },
	{
		async get() {
			try {
				const { roomId, searchText } = this.queryParams;
				const { offset, count } = await getPaginationItems(this.queryParams);

				if (!roomId) {
					throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
				}

				if (!searchText) {
					throw new Meteor.Error('error-searchText-param-not-provided', 'The required "searchText" query param is missing.');
				}

				const result = (await Meteor.callAsync('messageSearch', searchText, roomId, count, offset)).message.docs;

				return API.v1.success({
					messages: await normalizeMessagesForUser(result, this.userId),
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
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
		async post() {
			try {
				if (!this.bodyParams.message) {
					throw new Meteor.Error('error-invalid-params', 'The "message" parameter must be provided.');
				}

				const sent = await executeSendMessage(this.userId, this.bodyParams.message as Pick<IMessage, 'rid'>, this.bodyParams.previewUrls);
				const [message] = await normalizeMessagesForUser([sent], this.userId);

				return API.v1.success({
					message,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.starMessage',
	{ authRequired: true },
	{
		async post() {
			try {
				if (!this.bodyParams.messageId?.trim()) {
					throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
				}

				const msg = await Messages.findOneById(this.bodyParams.messageId);

				if (!msg) {
					throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
				}

				await Meteor.callAsync('starMessage', {
					_id: msg._id,
					rid: msg.rid,
					starred: true,
				});

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.unPinMessage',
	{ authRequired: true },
	{
		async post() {
			try {
				if (!this.bodyParams.messageId?.trim()) {
					throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
				}

				const msg = await Messages.findOneById(this.bodyParams.messageId);

				if (!msg) {
					throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
				}

				await Meteor.callAsync('unpinMessage', msg);

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.unStarMessage',
	{ authRequired: true },
	{
		async post() {
			try {
				if (!this.bodyParams.messageId?.trim()) {
					throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
				}

				const msg = await Messages.findOneById(this.bodyParams.messageId);

				if (!msg) {
					throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
				}

				await Meteor.callAsync('starMessage', {
					_id: msg._id,
					rid: msg.rid,
					starred: false,
				});

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.update',
	{ authRequired: true },
	{
		async post() {
			try {
				check(
					this.bodyParams,
					Match.ObjectIncluding({
						roomId: String,
						msgId: String,
						text: String, // Using text to be consistant with chat.postMessage
						previewUrls: Match.Maybe([String]),
					}),
				);

				const msg = await Messages.findOneById(this.bodyParams.msgId);

				// Ensure the message exists
				if (!msg) {
					return API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
				}

				if (this.bodyParams.roomId !== msg.rid) {
					return API.v1.failure('The room id provided does not match where the message is from.');
				}

				// Permission checks are already done in the updateMessage method, so no need to duplicate them
				await executeUpdateMessage(this.userId, { _id: msg._id, msg: this.bodyParams.text, rid: msg.rid }, this.bodyParams.previewUrls);

				const updatedMessage = await Messages.findOneById(msg._id);
				const [message] = await normalizeMessagesForUser(updatedMessage ? [updatedMessage] : [], this.userId);

				return API.v1.success({
					message,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.react',
	{ authRequired: true },
	{
		async post() {
			try {
				if (!this.bodyParams.messageId?.trim()) {
					throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
				}

				const msg = await Messages.findOneById(this.bodyParams.messageId);

				if (!msg) {
					throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
				}

				const emoji = 'emoji' in this.bodyParams ? this.bodyParams.emoji : (this.bodyParams as { reaction: string }).reaction;

				if (!emoji) {
					throw new Meteor.Error('error-emoji-param-not-provided', 'The required "emoji" param is missing.');
				}

				await executeSetReaction(this.userId, emoji, msg._id, this.bodyParams.shouldReact);

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.reportMessage',
	{ authRequired: true, validateParams: isChatReportMessageProps },
	{
		async post() {
			try {
				const { messageId, description } = this.bodyParams;
				if (!messageId) {
					return API.v1.failure('The required "messageId" param is missing.');
				}

				if (!description) {
					return API.v1.failure('The required "description" param is missing.');
				}

				await reportMessage(messageId, description, this.userId);

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.ignoreUser',
	{ authRequired: true },
	{
		async get() {
			try {
				const { rid, userId } = this.queryParams;
				let { ignore = true } = this.queryParams;

				ignore = typeof ignore === 'string' ? /true|1/.test(ignore) : ignore;

				if (!rid?.trim()) {
					throw new Meteor.Error('error-room-id-param-not-provided', 'The required "rid" param is missing.');
				}

				if (!userId?.trim()) {
					throw new Meteor.Error('error-user-id-param-not-provided', 'The required "userId" param is missing.');
				}

				await Meteor.callAsync('ignoreUser', { rid, userId, ignore });

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.getDeletedMessages',
	{ authRequired: true },
	{
		async get() {
			try {
				const { roomId, since } = this.queryParams;
				const { offset, count } = await getPaginationItems(this.queryParams);

				if (!roomId) {
					throw new Meteor.Error('The required "roomId" query param is missing.');
				}

				if (!since) {
					throw new Meteor.Error('The required "since" query param is missing.');
				} else if (isNaN(Date.parse(since))) {
					throw new Meteor.Error('The "since" query parameter must be a valid date.');
				}

				const { cursor, totalCount } = await Messages.trashFindPaginatedDeletedAfter(
					new Date(since),
					{ rid: roomId },
					{
						skip: offset,
						limit: count,
						projection: { _id: 1 },
					},
				);

				const [messages, total]: [any[], number] = await Promise.all([cursor.toArray(), totalCount]);

				return API.v1.success({
					messages,
					count: messages.length,
					offset,
					total,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.getPinnedMessages',
	{ authRequired: true },
	{
		async get() {
			try {
				const { roomId } = this.queryParams;
				const { offset, count } = await getPaginationItems(this.queryParams);

				if (!roomId) {
					throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
				}

				if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
					throw new Meteor.Error('error-not-allowed', 'Not allowed');
				}

				const { cursor, totalCount } = await Messages.findPaginatedPinnedByRoom(roomId, {
					skip: offset,
					limit: count,
				});

				const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

				return API.v1.success({
					messages: await normalizeMessagesForUser(messages, this.userId),
					count: messages.length,
					offset,
					total,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.getThreadsList',
	{ authRequired: true },
	{
		async get() {
			try {
				const { rid, type, text } = this.queryParams;
				check(rid, String);
				check(type, Match.Maybe(String));
				check(text, Match.Maybe(String));

				const { offset, count } = await getPaginationItems(this.queryParams);
				const { sort, fields, query } = await this.parseJsonQuery();

				if (!settings.get<boolean>('Threads_enabled')) {
					throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
				}
				const user = await Users.findOneById(this.userId, { projection: { _id: 1 } });
				const room = await Rooms.findOneById(rid, { projection: { ...roomAccessAttributes, t: 1, _id: 1 } });

				if (!room || !user || !(await canAccessRoomAsync(room, user))) {
					throw new Meteor.Error('error-not-allowed', 'Not Allowed');
				}

				const typeThread = {
					_hidden: { $ne: true },
					...(type === 'following' && { replies: { $in: [this.userId] } }),
					...(type === 'unread' && { _id: { $in: (await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id))?.tunread || [] } }),
					msg: new RegExp(escapeRegExp(text || ''), 'i'),
				};

				const threadQuery = { ...query, ...typeThread, rid: room._id, tcount: { $exists: true } };
				const { cursor, totalCount } = await Messages.findPaginated(threadQuery, {
					sort: sort || { tlm: -1 },
					skip: offset,
					limit: count,
					projection: fields,
				});

				const [threads, total] = await Promise.all([cursor.toArray(), totalCount]);

				return API.v1.success({
					threads: await normalizeMessagesForUser(threads, this.userId),
					count: threads.length,
					offset,
					total,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.syncThreadsList',
	{ authRequired: true },
	{
		async get() {
			try {
				const { rid } = this.queryParams;
				const { query, fields, sort } = await this.parseJsonQuery();
				const { updatedSince } = this.queryParams;
				let updatedSinceDate;
				if (!settings.get<boolean>('Threads_enabled')) {
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
				const user = await Users.findOneById(this.userId, { projection: { _id: 1 } });
				const room = await Rooms.findOneById(rid, { projection: { ...roomAccessAttributes, t: 1, _id: 1 } });

				if (!room || !user || !(await canAccessRoomAsync(room, user))) {
					throw new Meteor.Error('error-not-allowed', 'Not Allowed');
				}
				const threadQuery = Object.assign({}, query, { rid, tcount: { $exists: true } });
				return API.v1.success({
					threads: {
						update: await Messages.find(
							{ ...threadQuery, _updatedAt: { $gt: updatedSinceDate } },
							{
								sort,
								projection: fields,
							},
						).toArray(),
						remove: await Messages.trashFindDeletedAfter(updatedSinceDate, threadQuery, {
							sort,
							projection: fields,
						}).toArray(),
					},
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.getThreadMessages',
	{ authRequired: true },
	{
		async get() {
			try {
				const { tmid } = this.queryParams;
				const { query, fields, sort } = await this.parseJsonQuery();
				const { offset, count } = await getPaginationItems(this.queryParams);

				if (!settings.get('Threads_enabled')) {
					throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
				}
				if (!tmid) {
					throw new Meteor.Error('error-invalid-params', 'The required "tmid" query param is missing.');
				}
				const thread = await Messages.findOneById(tmid, { projection: { rid: 1 } });
				if (!thread?.rid) {
					throw new Meteor.Error('error-invalid-message', 'Invalid Message');
				}
				const user = await Users.findOneById(this.userId, { projection: { _id: 1 } });
				const room = await Rooms.findOneById(thread.rid, { projection: { ...roomAccessAttributes, t: 1, _id: 1 } });

				if (!room || !user || !(await canAccessRoomAsync(room, user))) {
					throw new Meteor.Error('error-not-allowed', 'Not Allowed');
				}
				const { cursor, totalCount } = await Messages.findPaginated(
					{ ...query, tmid },
					{
						sort: sort || { ts: 1 },
						skip: offset,
						limit: count,
						projection: fields,
					},
				);

				const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

				return API.v1.success({
					messages,
					count: messages.length,
					offset,
					total,
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.syncThreadMessages',
	{ authRequired: true },
	{
		async get() {
			try {
				const { tmid } = this.queryParams;
				const { query, fields, sort } = await this.parseJsonQuery();
				const { updatedSince } = this.queryParams;
				let updatedSinceDate;
				if (!settings.get<boolean>('Threads_enabled')) {
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
				const thread = await Messages.findOneById(tmid, { projection: { rid: 1 } });
				if (!thread?.rid) {
					throw new Meteor.Error('error-invalid-message', 'Invalid Message');
				}
				const user = await Users.findOneById(this.userId, { projection: { _id: 1 } });
				const room = await Rooms.findOneById(thread.rid, { projection: { ...roomAccessAttributes, t: 1, _id: 1 } });

				if (!room || !user || !(await canAccessRoomAsync(room, user))) {
					throw new Meteor.Error('error-not-allowed', 'Not Allowed');
				}
				return API.v1.success({
					messages: {
						update: await Messages.find({ ...query, tmid, _updatedAt: { $gt: updatedSinceDate } }, { projection: fields, sort }).toArray(),
						remove: await Messages.trashFindDeletedAfter(updatedSinceDate, { ...query, tmid }, { projection: fields, sort }).toArray(),
					},
				});
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.followMessage',
	{ authRequired: true },
	{
		async post() {
			try {
				const { mid } = this.bodyParams;

				if (!mid) {
					throw new Meteor.Error('The required "mid" body param is missing.');
				}

				await Meteor.callAsync('followMessage', { mid });

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.unfollowMessage',
	{ authRequired: true },
	{
		async post() {
			try {
				const { mid } = this.bodyParams;

				if (!mid) {
					throw new Meteor.Error('The required "mid" body param is missing.');
				}

				await Meteor.callAsync('unfollowMessage', { mid });

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.getMentionedMessages',
	{ authRequired: true },
	{
		async get() {
			try {
				const { roomId } = this.queryParams;
				const { sort } = await this.parseJsonQuery();
				const { offset, count } = await getPaginationItems(this.queryParams);
				if (!roomId) {
					throw new Meteor.Error('error-invalid-params', 'The required "roomId" query param is missing.');
				}
				const messages = await findMentionedMessages({
					uid: this.userId,
					roomId,
					pagination: {
						offset,
						count,
						sort,
					},
				});

				return API.v1.success(messages);
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.getStarredMessages',
	{ authRequired: true },
	{
		async get() {
			try {
				const { roomId } = this.queryParams;
				const { sort } = await this.parseJsonQuery();
				const { offset, count } = await getPaginationItems(this.queryParams);

				if (!roomId) {
					throw new Meteor.Error('error-invalid-params', 'The required "roomId" query param is missing.');
				}
				const messages = await findStarredMessages({
					uid: this.userId,
					roomId,
					pagination: {
						offset,
						count,
						sort,
					},
				});

				messages.messages = await normalizeMessagesForUser(messages.messages, this.userId);

				return API.v1.success(messages);
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.getDiscussions',
	{ authRequired: true },
	{
		async get() {
			try {
				const { roomId, text } = this.queryParams;
				const { sort } = await this.parseJsonQuery();
				const { offset, count } = await getPaginationItems(this.queryParams);

				if (!roomId) {
					throw new Meteor.Error('error-invalid-params', 'The required "roomId" query param is missing.');
				}
				const messages = await findDiscussionsFromRoom({
					uid: this.userId,
					roomId,
					text: text || '',
					pagination: {
						offset,
						count,
						sort,
					},
				});
				return API.v1.success(messages);
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);

API.v1.addRoute(
	'chat.otr',
	{ authRequired: true },
	{
		async post() {
			try {
				const { roomId, type: otrType } = this.bodyParams;

				if (!roomId) {
					throw new Meteor.Error('error-invalid-params', 'The required "roomId" query param is missing.');
				}

				if (!otrType) {
					throw new Meteor.Error('error-invalid-params', 'The required "type" query param is missing.');
				}

				const { username, type } = this.user;

				if (!username) {
					throw new Meteor.Error('error-invalid-user', 'Invalid user');
				}

				await canSendMessageAsync(roomId, { uid: this.userId, username, type });

				await Message.saveSystemMessage(otrType, roomId, username, { _id: this.userId, username });

				return API.v1.success();
			} catch (e: any) {
				return API.v1.failure(e.message);
			}
		},
	},
);
