import { Message } from '@rocket.chat/core-services';
import type { IThreadMainMessage, IUser, RequiredField } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { Messages, Users, Rooms, Subscriptions } from '@rocket.chat/models';
import {
	BadRequestErrorResponseSchema,
	UnauthorizedErrorResponseSchema,
	SuccessResponseSchema,
	POSTChatDeleteBodySchema,
	POSTChatDeleteResponseSchema,
	GETChatSyncMessagesQuerySchema,
	GETChatSyncMessagesResponseSchema,
	GETChatGetMessageQuerySchema,
	GETChatGetMessageResponseSchema,
	POSTChatPinMessageBodySchema,
	POSTChatPinMessageResponseSchema,
	POSTChatUnPinMessageBodySchema,
	POSTChatUpdateBodySchema,
	POSTChatUpdateResponseSchema,
	POSTChatPostMessageBodySchema,
	POSTChatPostMessageResponseSchema,
	GETChatSearchQuerySchema,
	GETChatSearchResponseSchema,
	POSTChatSendMessageBodySchema,
	POSTChatSendMessageResponseSchema,
	POSTChatStarMessageBodySchema,
	POSTChatUnStarMessageBodySchema,
	POSTChatReactBodySchema,
	POSTChatReportMessageBodySchema,
	GETChatIgnoreUserQuerySchema,
	GETChatGetDeletedMessagesQuerySchema,
	GETChatGetDeletedMessagesResponseSchema,
	GETChatGetPinnedMessagesQuerySchema,
	GETChatGetPinnedMessagesResponseSchema,
	GETChatGetThreadsListQuerySchema,
	GETChatGetThreadsListResponseSchema,
	GETChatSyncThreadsListQuerySchema,
	GETChatSyncThreadsListResponseSchema,
	GETChatGetThreadMessagesQuerySchema,
	GETChatGetThreadMessagesResponseSchema,
	GETChatSyncThreadMessagesQuerySchema,
	GETChatSyncThreadMessagesResponseSchema,
	POSTChatFollowMessageBodySchema,
	POSTChatUnfollowMessageBodySchema,
	GETChatGetMentionedMessagesQuerySchema,
	GETChatGetMentionedMessagesResponseSchema,
	GETChatGetStarredMessagesQuerySchema,
	GETChatGetStarredMessagesResponseSchema,
	GETChatGetDiscussionsQuerySchema,
	GETChatGetDiscussionsResponseSchema,
	GETChatGetURLPreviewQuerySchema,
	GETChatGetURLPreviewResponseSchema,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import type * as z from 'zod';

import { reportMessage } from '../../../../server/lib/moderation/reportMessage';
import { ignoreUser } from '../../../../server/methods/ignoreUser';
import { messageSearch } from '../../../../server/methods/messageSearch';
import { getMessageHistory } from '../../../../server/publications/messages';
import { roomAccessAttributes } from '../../../authorization/server';
import { canAccessRoomAsync, canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { deleteMessageValidatingPermission } from '../../../lib/server/functions/deleteMessage';
import { processWebhookMessage } from '../../../lib/server/functions/processWebhookMessage';
import { getSingleMessage } from '../../../lib/server/methods/getSingleMessage';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import { executeUpdateMessage } from '../../../lib/server/methods/updateMessage';
import { applyAirGappedRestrictionsValidation } from '../../../license/server/airGappedRestrictionsWrapper';
import { pinMessage, unpinMessage } from '../../../message-pin/server/pinMessage';
import { starMessage } from '../../../message-star/server/starMessage';
import { executeSetReaction } from '../../../reactions/server/setReaction';
import { settings } from '../../../settings/server';
import { followMessage } from '../../../threads/server/methods/followMessage';
import { unfollowMessage } from '../../../threads/server/methods/unfollowMessage';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { findDiscussionsFromRoom, findMentionedMessages, findStarredMessages } from '../lib/messages';

const chatEndpoints = API.v1
	.post(
		'chat.delete',
		{
			authRequired: true,
			body: POSTChatDeleteBodySchema,
			response: {
				200: POSTChatDeleteResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.get(
		'chat.syncMessages',
		{
			authRequired: true,
			// FIXME new validation error message breaks the contract (breaking change)
			validateParams: GETChatSyncMessagesQuerySchema,
			response: {
				200: GETChatSyncMessagesResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const { roomId, lastUpdate, count, next, previous, type } = this.queryParams as z.infer<typeof GETChatSyncMessagesQuerySchema>;

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
					deleted: 'deleted' in result ? (result.deleted as any) : [],
					cursor: 'cursor' in result ? result.cursor : undefined,
				},
			});
		},
	)
	.get(
		'chat.getMessage',
		{
			authRequired: true,
			query: GETChatGetMessageQuerySchema,
			response: {
				200: GETChatGetMessageResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.post(
		'chat.pinMessage',
		{
			authRequired: true,
			body: POSTChatPinMessageBodySchema,
			response: {
				200: POSTChatPinMessageResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.post(
		'chat.unPinMessage',
		{
			authRequired: true,
			body: POSTChatUnPinMessageBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const msg = await Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			await unpinMessage(this.userId, msg);

			return API.v1.success();
		},
	)
	.post(
		'chat.update',
		{
			authRequired: true,
			body: POSTChatUpdateBodySchema,
			response: {
				200: POSTChatUpdateResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const { bodyParams } = this;

			const msg = await Messages.findOneById(bodyParams.msgId);

			// Ensure the message exists
			if (!msg) {
				return API.v1.failure(`No message found with the id of "${bodyParams.msgId}".`);
			}

			if (bodyParams.roomId !== msg.rid) {
				return API.v1.failure('The room id provided does not match where the message is from.');
			}

			const hasContent = 'content' in bodyParams;

			if (hasContent && msg.t !== 'e2e') {
				return API.v1.failure('Only encrypted messages can have content updated.');
			}

			const updateData: Parameters<typeof executeUpdateMessage> = [
				this.userId,
				hasContent
					? {
							_id: msg._id,
							rid: msg.rid,
							content: bodyParams.content,
							...(bodyParams.e2eMentions && { e2eMentions: bodyParams.e2eMentions }),
						}
					: {
							_id: msg._id,
							rid: msg.rid,
							msg: bodyParams.text,
							...(bodyParams.customFields && { customFields: bodyParams.customFields }),
						},
				'previewUrls' in bodyParams ? bodyParams.previewUrls : undefined,
			];

			// Permission checks are already done in the updateMessage method, so no need to duplicate them
			await applyAirGappedRestrictionsValidation(() => executeUpdateMessage(...updateData));

			const updatedMessage = await Messages.findOneById(msg._id);
			const [message] = await normalizeMessagesForUser(updatedMessage ? [updatedMessage] : [], this.userId);

			return API.v1.success({
				message,
			});
		},
	)
	.post(
		'chat.postMessage',
		{
			authRequired: true,
			body: POSTChatPostMessageBodySchema,
			response: {
				200: POSTChatPostMessageResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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

			const messageReturn = (
				await applyAirGappedRestrictionsValidation(() =>
					processWebhookMessage(this.bodyParams, this.user as IUser & { username: RequiredField<IUser, 'username'> }),
				)
			)[0];

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
	)
	.get(
		'chat.search',
		{
			authRequired: true,
			query: GETChatSearchQuerySchema,
			response: {
				200: GETChatSearchResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.post(
		'chat.sendMessage',
		{
			description: `Sends a message to a channel.

The difference between \`chat.postMessage\` and \`chat.sendMessage\` is that \`chat.sendMessage\` allows
for passing a value for \`_id\` and the other one doesn't. Also, \`chat.sendMessage\` only sends it to
one channel whereas the other one allows for sending to more than one channel at a time.`,
			authRequired: true,
			body: POSTChatSendMessageBodySchema,
			response: {
				200: POSTChatSendMessageResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			if (MessageTypes.isSystemMessage(this.bodyParams.message)) {
				throw new Error("Cannot send system messages using 'chat.sendMessage'");
			}

			const sent = await applyAirGappedRestrictionsValidation(() =>
				executeSendMessage(this.userId, this.bodyParams.message, { previewUrls: this.bodyParams.previewUrls }),
			);
			const [message] = await normalizeMessagesForUser([sent], this.userId);

			return API.v1.success({
				message,
			});
		},
	)
	.post(
		'chat.starMessage',
		{
			authRequired: true,
			body: POSTChatStarMessageBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
			},
		},
		async function action() {
			const msg = await Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			await starMessage(this.user, {
				_id: msg._id,
				rid: msg.rid,
				starred: true,
			});

			return API.v1.success();
		},
	)
	.post(
		'chat.unStarMessage',
		{
			authRequired: true,
			body: POSTChatUnStarMessageBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
			},
		},
		async function action() {
			const msg = await Messages.findOneById(this.bodyParams.messageId);

			if (!msg) {
				throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
			}

			await starMessage(this.user, {
				_id: msg._id,
				rid: msg.rid,
				starred: false,
			});

			return API.v1.success();
		},
	)
	.post(
		'chat.react',
		{
			authRequired: true,
			body: POSTChatReactBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.post(
		'chat.reportMessage',
		{
			authRequired: true,
			body: POSTChatReportMessageBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	// FIXME mutating GET route???
	.get(
		'chat.ignoreUser',
		{
			authRequired: true,
			query: GETChatIgnoreUserQuerySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.get(
		'chat.getDeletedMessages',
		{
			authRequired: true,
			query: GETChatGetDeletedMessagesQuerySchema,
			response: {
				200: GETChatGetDeletedMessagesResponseSchema,
				400: BadRequestErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.get(
		'chat.getPinnedMessages',
		{
			authRequired: true,
			query: GETChatGetPinnedMessagesQuerySchema,
			response: {
				200: GETChatGetPinnedMessagesResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.get(
		'chat.getThreadsList',
		{
			authRequired: true,
			// FIXME new validation error message breaks the contract (breaking change)
			validateParams: GETChatGetThreadsListQuerySchema,
			response: {
				200: GETChatGetThreadsListResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const { rid, type, text } = this.queryParams as z.infer<typeof GETChatGetThreadsListQuerySchema>;

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
	)
	.get(
		'chat.syncThreadsList',
		{
			authRequired: true,
			// FIXME new validation error message breaks the contract (breaking change)
			validateParams: GETChatSyncThreadsListQuerySchema,
			response: {
				200: GETChatSyncThreadsListResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const { rid } = this.queryParams as z.infer<typeof GETChatSyncThreadsListQuerySchema>;
			const { query, fields, sort } = await this.parseJsonQuery();
			const { updatedSince } = this.queryParams as z.infer<typeof GETChatSyncThreadsListQuerySchema>;
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
	)
	.get(
		'chat.getThreadMessages',
		{
			authRequired: true,
			validateParams: GETChatGetThreadMessagesQuerySchema,
			response: {
				200: GETChatGetThreadMessagesResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.get(
		'chat.syncThreadMessages',
		{
			authRequired: true,
			// FIXME new validation error message breaks the contract (breaking change)
			validateParams: GETChatSyncThreadMessagesQuerySchema,
			response: {
				200: GETChatSyncThreadMessagesResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.post(
		'chat.followMessage',
		{
			authRequired: true,
			body: POSTChatFollowMessageBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const { mid } = this.bodyParams;

			if (!mid) {
				throw new Meteor.Error('The required "mid" body param is missing.');
			}

			await followMessage(this.userId, { mid });

			return API.v1.success();
		},
	)
	.post(
		'chat.unfollowMessage',
		{
			authRequired: true,
			body: POSTChatUnfollowMessageBodySchema,
			response: {
				200: SuccessResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const { mid } = this.bodyParams;

			if (!mid) {
				throw new Meteor.Error('The required "mid" body param is missing.');
			}

			await unfollowMessage(this.userId, { mid });

			return API.v1.success();
		},
	)
	.get(
		'chat.getMentionedMessages',
		{
			authRequired: true,
			// FIXME new validation error message breaks the contract (breaking change)
			validateParams: GETChatGetMentionedMessagesQuerySchema,
			response: {
				200: GETChatGetMentionedMessagesResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			// FIXME new validation error message breaks the contract (breaking change)
			const { roomId } = this.queryParams as z.infer<typeof GETChatGetMentionedMessagesQuerySchema>;
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
	)
	.get(
		'chat.getStarredMessages',
		{
			authRequired: true,
			// FIXME new validation error message breaks the contract (breaking change)
			validateParams: GETChatGetStarredMessagesQuerySchema,
			response: {
				200: GETChatGetStarredMessagesResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const { roomId } = this.queryParams as z.infer<typeof GETChatGetStarredMessagesQuerySchema>;
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
	)
	.get(
		'chat.getDiscussions',
		{
			authRequired: true,
			query: GETChatGetDiscussionsQuerySchema,
			response: {
				200: GETChatGetDiscussionsResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
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
	)
	.get(
		'chat.getURLPreview',
		{
			authRequired: true,
			query: GETChatGetURLPreviewQuerySchema,
			response: {
				200: GETChatGetURLPreviewResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			const { roomId, url } = this.queryParams;

			if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			const { urlPreview } = await Message.parseOEmbedUrl(url);
			urlPreview.ignoreParse = true;

			return API.v1.success({ urlPreview });
		},
	);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ExtractRoutesFromAPI<typeof chatEndpoints> {
		// FIXME new validation error message breaks the contract (breaking change)
		'/v1/chat.getMentionedMessages': {
			GET: (query: z.infer<typeof GETChatGetMentionedMessagesQuerySchema>) => z.infer<typeof GETChatGetMentionedMessagesResponseSchema>;
		};
		// FIXME new validation error message breaks the contract (breaking change)
		'/v1/chat.getStarredMessages': {
			GET: (query: z.infer<typeof GETChatGetStarredMessagesQuerySchema>) => z.infer<typeof GETChatGetStarredMessagesResponseSchema>;
		};
		// FIXME new validation error message breaks the contract (breaking change)
		'/v1/chat.getDiscussions': {
			GET: (query: z.infer<typeof GETChatGetDiscussionsQuerySchema>) => z.infer<typeof GETChatGetDiscussionsResponseSchema>;
		};
		'/v1/chat.syncMessages': {
			GET: (query: z.infer<typeof GETChatSyncMessagesQuerySchema>) => z.infer<typeof GETChatSyncMessagesResponseSchema>;
		};
		// FIXME new validation error message breaks the contract (breaking change)
		'/v1/chat.getThreadsList': {
			GET: (query: z.infer<typeof GETChatGetThreadsListQuerySchema>) => z.infer<typeof GETChatGetThreadsListResponseSchema>;
		};
		'/v1/chat.syncThreadsList': {
			GET: (query: z.infer<typeof GETChatSyncThreadsListQuerySchema>) => z.infer<typeof GETChatSyncThreadsListResponseSchema>;
		};
		'/v1/chat.syncThreadMessages': {
			GET: (query: z.infer<typeof GETChatSyncThreadMessagesQuerySchema>) => z.infer<typeof GETChatSyncThreadMessagesResponseSchema>;
		};
	}
}
