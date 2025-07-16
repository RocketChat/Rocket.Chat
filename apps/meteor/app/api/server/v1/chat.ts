import { Message } from '@rocket.chat/core-services';
import type { IMessage, IThreadMainMessage, IScheduledMessage } from '@rocket.chat/core-typings';
import { Messages, Users, Rooms, Subscriptions, ScheduledMessages } from '@rocket.chat/models';
import {
	isChatReportMessageProps,
	isChatGetURLPreviewProps,
	isChatUpdateProps,
	isChatGetThreadsListProps,
	isChatDeleteProps,
	isChatSyncMessagesProps,
	isChatGetMessageProps,
	isChatPinMessageProps,
	isChatPostMessageProps,
	isChatSearchProps,
	isChatSendMessageProps,
	isChatStarMessageProps,
	isChatUnpinMessageProps,
	isChatUnstarMessageProps,
	isChatIgnoreUserProps,
	isChatGetPinnedMessagesProps,
	isChatFollowMessageProps,
	isChatUnfollowMessageProps,
	isChatGetMentionedMessagesProps,
	isChatOTRProps,
	isChatReactProps,
	isChatGetDeletedMessagesProps,
	isChatSyncThreadsListProps,
	isChatGetThreadMessagesProps,
	isChatSyncThreadMessagesProps,
	isChatGetStarredMessagesProps,
	isChatGetDiscussionsProps,
	isChatScheduleMessageProps,
	isChatUpdateScheduledMessageProps,
	isChatDeleteScheduledMessageProps,
	isChatGetScheduledMessagesProps
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';

import { reportMessage } from '../../../../server/lib/moderation/reportMessage';
import { ignoreUser } from '../../../../server/methods/ignoreUser';
import { messageSearch } from '../../../../server/methods/messageSearch';
import { getMessageHistory } from '../../../../server/publications/messages';
import { roomAccessAttributes } from '../../../authorization/server';
import { canAccessRoomAsync, canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { canSendMessageAsync } from '../../../authorization/server/functions/canSendMessage';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { deleteMessageValidatingPermission } from '../../../lib/server/functions/deleteMessage';
import { processWebhookMessage } from '../../../lib/server/functions/processWebhookMessage';
import { getSingleMessage } from '../../../lib/server/methods/getSingleMessage';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import { executeUpdateMessage } from '../../../lib/server/methods/updateMessage';
import { applyAirGappedRestrictionsValidation } from '../../../license/server/airGappedRestrictionsWrapper';
import { pinMessage, unpinMessage } from '../../../message-pin/server/pinMessage';
import { starMessage } from '../../../message-star/server/starMessage';
import { OEmbed } from '../../../oembed/server/server';
import { executeSetReaction } from '../../../reactions/server/setReaction';
import { settings } from '../../../settings/server';
import { followMessage } from '../../../threads/server/methods/followMessage';
import { unfollowMessage } from '../../../threads/server/methods/unfollowMessage';
import { MessageTypes } from '../../../ui-utils/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { findDiscussionsFromRoom, findMentionedMessages, findStarredMessages } from '../lib/messages';


API.v1.addRoute(
	'chat.delete',
	{ authRequired: true, validateParams: isChatDeleteProps },
	{
		async post() {
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
		},
	},
);

API.v1.addRoute(
	'chat.syncMessages',
	{ authRequired: true, validateParams: isChatSyncMessagesProps },
	{
		async get() {
			const { roomId, lastUpdate, count, next, previous, type } = this.queryParams;

			if (!roomId) {
				throw new Meteor.Error('error-param-required', 'The required "roomId" query param is missing');
			}

			if (!lastUpdate && !type) {
				throw new Meteor.Error('error-param-required', 'The "type" or "lastUpdate" parameters must be provided');
			}

			if (lastUpdate && isNaN(Date.parse(lastUpdate))) {
				throw new Meteor.Error('error-lastUpdate-param-invalid', 'The "lastUpdate" query parameter must be a valid date');
			}

			const getMessagesQuery = {
				...(lastUpdate && { lastUpdate: new Date(lastUpdate) }),
				...(next && { next }),
				...(previous && { previous }),
				...(count && { count }),
				...(type && { type }),
			};

			const result = await getMessageHistory(roomId, this.userId, getMessagesQuery);

			if (!result) {
				return API.v1.failure();
			}

			return API.v1.success({
				result: {
					updated: 'updated' in result ? await normalizeMessagesForUser(result.updated, this.userId) : [],
					deleted: 'deleted' in result ? result.deleted : [],
					cursor: 'cursor' in result ? result.cursor : undefined,
				},
			});
		},
	},
);

API.v1.addRoute(
	'chat.getMessage',
	{
		authRequired: true,
		validateParams: isChatGetMessageProps,
	},
	{
		async get() {
			if (!this.queryParams.msgId) {
				return API.v1.failure('The "msgId" query parameter must be provided.');
			}

			const msg = await getSingleMessage(this.userId, this.queryParams.msgId);

			if (!msg) {
				return API.v1.failure();
			}

			const [message] = await normalizeMessagesForUser([msg], this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.pinMessage',
	{ authRequired: true, validateParams: isChatPinMessageProps },
	{
		async post() {
			const msg = await Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			const pinnedMessage = await pinMessage(msg, this.userId);

			const [message] = await normalizeMessagesForUser([pinnedMessage], this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.postMessage',
	{ authRequired: true, validateParams: isChatPostMessageProps },
	{
		async post() {
			const { text, attachments } = this.bodyParams;
			const maxAllowedSize = settings.get<number>('Message_MaxAllowedSize') ?? 0;

			if (text && text.length > maxAllowedSize) {
				return API.v1.failure('error-message-size-exceeded');
			}

			if (attachments && attachments.length > 0) {
				for (const attachment of attachments) {
					if (attachment.text && attachment.text.length > maxAllowedSize) {
						return API.v1.failure('error-message-size-exceeded');
					}
				}
			}

			const messageReturn = (await applyAirGappedRestrictionsValidation(() => processWebhookMessage(this.bodyParams, this.user)))[0];

			if (!messageReturn?.message) {
				return API.v1.failure('unknown-error');
			}

			const [message] = await normalizeMessagesForUser([messageReturn.message], this.userId);

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
	{ authRequired: true, validateParams: isChatSearchProps },
	{
		async get() {
			const { roomId, searchText } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!roomId) {
				throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
			}

			if (!searchText) {
				throw new Meteor.Error('error-searchText-param-not-provided', 'The required "searchText" query param is missing.');
			}

			const searchResult = await messageSearch(this.userId, searchText, roomId, count, offset);
			if (searchResult === false) {
				return API.v1.failure();
			}
			if (!searchResult.message) {
				return API.v1.failure();
			}
			const result = searchResult.message.docs;

			return API.v1.success({
				messages: await normalizeMessagesForUser(result, this.userId),
			});
		},
	},
);

// The difference between `chat.postMessage` and `chat.sendMessage` is that `chat.sendMessage` allows
// for passing a value for `_id` and the other one doesn't. Also, `chat.sendMessage` only sends it to
// one channel whereas the other one allows for sending to more than one channel at a time.
API.v1.addRoute(
	'chat.sendMessage',
	{ authRequired: true, validateParams: isChatSendMessageProps },
	{
		async post() {
			if (MessageTypes.isSystemMessage(this.bodyParams.message)) {
				throw new Error("Cannot send system messages using 'chat.sendMessage'");
			}

			const sent = await applyAirGappedRestrictionsValidation(() =>
				executeSendMessage(this.userId, this.bodyParams.message as Pick<IMessage, 'rid'>, this.bodyParams.previewUrls),
			);
			const [message] = await normalizeMessagesForUser([sent], this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.starMessage',
	{ authRequired: true, validateParams: isChatStarMessageProps },
	{
		async post() {
			const msg = await Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			await starMessage(this.userId, {
				_id: msg._id,
				rid: msg.rid,
				starred: true,
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.unPinMessage',
	{ authRequired: true, validateParams: isChatUnpinMessageProps },
	{
		async post() {
			const msg = await Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			await unpinMessage(this.userId, msg);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.unStarMessage',
	{ authRequired: true, validateParams: isChatUnstarMessageProps },
	{
		async post() {
			const msg = await Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			await starMessage(this.userId, {
				_id: msg._id,
				rid: msg.rid,
				starred: false,
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.update',
	{ authRequired: true, validateParams: isChatUpdateProps },
	{
		async post() {
			const msg = await Messages.findOneById(this.bodyParams.msgId);

			// Ensure the message exists
			if (!msg) {
				return API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
			}

			if (this.bodyParams.roomId !== msg.rid) {
				return API.v1.failure('The room id provided does not match where the message is from.');
			}

			const msgFromBody = this.bodyParams.text;

			// Permission checks are already done in the updateMessage method, so no need to duplicate them
			await applyAirGappedRestrictionsValidation(() =>
				executeUpdateMessage(
					this.userId,
					{
						_id: msg._id,
						msg: msgFromBody,
						rid: msg.rid,
						...(this.bodyParams.customFields && { customFields: this.bodyParams.customFields }),
					},
					this.bodyParams.previewUrls,
				),
			);

			const updatedMessage = await Messages.findOneById(msg._id);
			const [message] = await normalizeMessagesForUser(updatedMessage ? [updatedMessage] : [], this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'chat.react',
	{ authRequired: true, validateParams: isChatReactProps },
	{
		async post() {
			const msg = await Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			const emoji = 'emoji' in this.bodyParams ? this.bodyParams.emoji : (this.bodyParams as { reaction: string }).reaction;

			if (!emoji) {
				throw new Meteor.Error('error-emoji-param-not-provided', 'The required "emoji" param is missing.');
			}

			await executeSetReaction(this.userId, emoji, msg, this.bodyParams.shouldReact);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.reportMessage',
	{ authRequired: true, validateParams: isChatReportMessageProps },
	{
		async post() {
			const { messageId, description } = this.bodyParams;
			if (!messageId) {
				return API.v1.failure('The required "messageId" param is missing.');
			}

			if (!description) {
				return API.v1.failure('The required "description" param is missing.');
			}

			await reportMessage(messageId, description, this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.ignoreUser',
	{ authRequired: true, validateParams: isChatIgnoreUserProps },
	{
		async get() {
			const { rid, userId } = this.queryParams;
			let { ignore = true } = this.queryParams;

			ignore = typeof ignore === 'string' ? /true|1/.test(ignore) : ignore;

			if (!rid?.trim()) {
				throw new Meteor.Error('error-room-id-param-not-provided', 'The required "rid" param is missing.');
			}

			if (!userId?.trim()) {
				throw new Meteor.Error('error-user-id-param-not-provided', 'The required "userId" param is missing.');
			}

			await ignoreUser(this.userId, { rid, userId, ignore });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.getDeletedMessages',
	{ authRequired: true, validateParams: isChatGetDeletedMessagesProps },
	{
		async get() {
			const { roomId, since } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			const { cursor, totalCount } = Messages.trashFindPaginatedDeletedAfter(
				new Date(since),
				{ rid: roomId },
				{
					skip: offset,
					limit: count,
					projection: { _id: 1 },
				},
			);

			const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

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
	{ authRequired: true, validateParams: isChatGetPinnedMessagesProps },
	{
		async get() {
			const { roomId } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			const { cursor, totalCount } = Messages.findPaginatedPinnedByRoom(roomId, {
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
		},
	},
);

API.v1.addRoute(
	'chat.getThreadsList',
	{ authRequired: true, validateParams: isChatGetThreadsListProps },
	{
		async get() {
			const { rid, type, text } = this.queryParams;

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
			const { cursor, totalCount } = await Messages.findPaginated<IThreadMainMessage>(threadQuery, {
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
		},
	},
);

API.v1.addRoute(
	'chat.syncThreadsList',
	{ authRequired: true, validateParams: isChatSyncThreadsListProps },
	{
		async get() {
			const { rid } = this.queryParams;
			const { query, fields, sort } = await this.parseJsonQuery();
			const { updatedSince } = this.queryParams;
			let updatedSinceDate;
			if (!settings.get<boolean>('Threads_enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
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
		},
	},
);

API.v1.addRoute(
	'chat.getThreadMessages',
	{ authRequired: true, validateParams: isChatGetThreadMessagesProps },
	{
		async get() {
			const { tmid } = this.queryParams;
			const { query, fields, sort } = await this.parseJsonQuery();
			const { offset, count } = await getPaginationItems(this.queryParams);

			if (!settings.get('Threads_enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
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
			const { cursor, totalCount } = Messages.findPaginated(
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
		},
	},
);

API.v1.addRoute(
	'chat.syncThreadMessages',
	{ authRequired: true, validateParams: isChatSyncThreadMessagesProps },
	{
		async get() {
			const { tmid } = this.queryParams;
			const { query, fields, sort } = await this.parseJsonQuery();
			const { updatedSince } = this.queryParams;
			let updatedSinceDate;
			if (!settings.get<boolean>('Threads_enabled')) {
				throw new Meteor.Error('error-not-allowed', 'Threads Disabled');
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
			// TODO: promise.all? this.user?
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
		},
	},
);

API.v1.addRoute(
	'chat.followMessage',
	{ authRequired: true, validateParams: isChatFollowMessageProps },
	{
		async post() {
			const { mid } = this.bodyParams;

			if (!mid) {
				throw new Meteor.Error('The required "mid" body param is missing.');
			}

			await followMessage(this.userId, { mid });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.unfollowMessage',
	{ authRequired: true, validateParams: isChatUnfollowMessageProps },
	{
		async post() {
			const { mid } = this.bodyParams;

			if (!mid) {
				throw new Meteor.Error('The required "mid" body param is missing.');
			}

			await unfollowMessage(this.userId, { mid });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.getMentionedMessages',
	{ authRequired: true, validateParams: isChatGetMentionedMessagesProps },
	{
		async get() {
			const { roomId } = this.queryParams;
			const { sort } = await this.parseJsonQuery();
			const { offset, count } = await getPaginationItems(this.queryParams);

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
		},
	},
);

API.v1.addRoute(
	'chat.getStarredMessages',
	{ authRequired: true, validateParams: isChatGetStarredMessagesProps },
	{
		async get() {
			const { roomId } = this.queryParams;
			const { sort } = await this.parseJsonQuery();
			const { offset, count } = await getPaginationItems(this.queryParams);

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
		},
	},
);

API.v1.addRoute(
	'chat.getDiscussions',
	{ authRequired: true, validateParams: isChatGetDiscussionsProps },
	{
		async get() {
			const { roomId, text } = this.queryParams;
			const { sort } = await this.parseJsonQuery();
			const { offset, count } = await getPaginationItems(this.queryParams);

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
		},
	},
);

API.v1.addRoute(
	'chat.otr',
	{ authRequired: true, validateParams: isChatOTRProps },
	{
		async post() {
			const { roomId, type: otrType } = this.bodyParams;

			const { username, type } = this.user;

			if (!username) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			await canSendMessageAsync(roomId, { uid: this.userId, username, type });

			await Message.saveSystemMessage(otrType, roomId, username, { _id: this.userId, username });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'chat.getURLPreview',
	{ authRequired: true, validateParams: isChatGetURLPreviewProps },
	{
		async get() {
			const { roomId, url } = this.queryParams;

			if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			const { urlPreview } = await OEmbed.parseUrl(url);
			urlPreview.ignoreParse = true;

			return API.v1.success({ urlPreview });
		},
	},
);

API.v1.addRoute(
	'chat.scheduleMessage',
	{ authRequired: true , validateParams: isChatScheduleMessageProps },
	{
	  async post() {
		const { rid, msg, scheduledAt: scheduledAtStr, tmid } = this.bodyParams;
		const user = this.user;

		// Validate required fields
		if (!rid || !msg || !scheduledAtStr) {
		  return API.v1.failure('Missing required fields: rid, msg, or scheduledAt');
		}

		// Validate scheduledAt
		const scheduledAt = new Date(scheduledAtStr);
		if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
		  return API.v1.failure('Invalid scheduledAt: Must be a future date');
		}

		// Validate message size
		const maxAllowedSize = settings.get<number>('Message_MaxAllowedSize') ?? 0;
		if (msg.length > maxAllowedSize) {
		  return API.v1.failure('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize');
		}

		// Validate thread
		if (tmid && !settings.get('Threads_enabled')) {
		  return API.v1.failure('error-not-allowed', 'Threads are disabled');
		}

		// Validate room
		const room = await Rooms.findOneById(rid);
		if (!room) {
		  return API.v1.failure('Invalid room ID');
		}

		// Validate permissions
		try {
			await canSendMessageAsync(rid, { uid: this.userId, username: user.username, type: user.type });
		} catch (error) {
		  return API.v1.failure('error-not-allowed', 'Not allowed to send messages in this room');
		}

		const scheduledMessage: Omit<IScheduledMessage, '_id'> = {
		  t: 'scheduled_message',
		  rid,
		  msg,
		  u: { _id: user._id, username: user.username, name: user.name },
		  ts: new Date(),
		  scheduledAt,
		  tmid,
		  _updatedAt: new Date(),
		};

		try {
		  const scheduledMessageId = await ScheduledMessages.insertAsync(scheduledMessage);
		  const createdScheduledMessage = await ScheduledMessages.findOneAsync({ _id: scheduledMessageId });
		  if (!createdScheduledMessage) {
			console.error('Failed to find scheduled message after insertion:', scheduledMessageId);
			return API.v1.failure('Scheduled message created but could not be retrieved');
		  }
		  return API.v1.success({ message: createdScheduledMessage });
		} catch (error) {
		  console.error('Error creating scheduled message:', error);
		  return API.v1.failure(`Failed to schedule message: ${(error as Error).message}`);
		}
	  },
	},
  );


API.v1.addRoute(
  'chat.updateScheduledMessage',
  {
    authRequired: true,
    validateParams: isChatUpdateScheduledMessageProps,
    permissionsRequired: ['force-delete-message'],
  },
  {
    async POST() {
      const { userId } = this;
      const { scheduledMessageId, rid, msg, scheduledAt, tmid } = this.bodyParams;

      // Validate room exists
      const room = await Rooms.findOneById(rid);
      if (!room) {
        throw new Error('Room not found');
      }

      // Validate user has access to the room
      const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId, { projection: { _id: 1 } });
      if (!subscription) {
        throw new Error('User does not have access to this room');
      }

      // Find the scheduled message
      const message = await ScheduledMessages.findOneAsync(scheduledMessageId);
      if (!message) {
        throw new Error('Scheduled message not found');
      }

      // Check if user is the owner or has force-delete-message permission
      if (message.u._id !== userId && !(await this.hasPermission(['force-delete-message']))) {
        throw new Error('Not allowed to edit messages created by other users');
      }

      // Validate scheduledAt is in the future
      const scheduledAtDate = new Date(scheduledAt);
      if (scheduledAtDate <= new Date()) {
        throw new Error('Invalid scheduledAt: Must be a future date');
      }

      // Update the message
      await ScheduledMessages.updateAsync(
        { _id: scheduledMessageId },
        { $set: { msg, scheduledAt: scheduledAtDate, tmid, _updatedAt: new Date() } }
      );

      // Fetch the updated message
      const updatedMessage = await ScheduledMessages.findOneAsync(scheduledMessageId);

      return API.v1.success({ message: updatedMessage });
    },
  }
);


API.v1.addRoute(
	'chat.deleteScheduledMessage',
	{ authRequired: true, validateParams: isChatDeleteScheduledMessageProps },
	{
		async post() {
			const { scheduledMessageId } = this.bodyParams;

			// Validate required field
			if (!scheduledMessageId) {
				return API.v1.failure('Missing required field: scheduledMessageId');
			}

			// Check if scheduled message exists
			const scheduledMessage = await ScheduledMessages.findOneAsync({ _id: scheduledMessageId });
			if (!scheduledMessage) {
				return API.v1.failure('Scheduled message not found');
			}

			// Verify user is the message owner or has permission
			if (scheduledMessage.u._id !== this.userId) {
				const hasForceDeletePermission = await hasPermissionAsync(this.userId, 'force-delete-message', scheduledMessage.rid);
				if (!hasForceDeletePermission) {
					return API.v1.failure('error-not-allowed', 'Not allowed to delete messages created by other users');
				}
			}

			// Validate room
			const room = await Rooms.findOneById(scheduledMessage.rid);
			if (!room) {
				return API.v1.failure('Invalid room ID');
			}

			// Delete the scheduled message
			try {
				const result = await ScheduledMessages.removeAsync({ _id: scheduledMessageId });
				if (result.deletedCount === 0) {
					return API.v1.failure('Failed to delete scheduled message');
				}

				return API.v1.success({
					_id: scheduledMessageId,
					ts: Date.now().toString(),
					message: scheduledMessage,
				});
			} catch (error) {
				console.error('Error deleting scheduled message:', error);
				return API.v1.failure(`Failed to delete scheduled message: ${(error as Error).message}`);
			}
		},
	},
)

API.v1.addRoute(
	'chat.getScheduledMessages',
	{ authRequired: true, validateParams:  isChatGetScheduledMessagesProps},
	{
		async get() {
			const userId = this.userId;

			if (!userId) {
				return API.v1.unauthorized();
			}

			const scheduledMessages = await ScheduledMessages.find(
				{ 'u._id': userId },
				{ sort: { scheduledAt: 1 } } // sort by schedule time ascending
			).toArray();

			return API.v1.success({ messages: scheduledMessages });
		},
	}
);
