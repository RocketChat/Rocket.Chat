/**
 * Docs: https://github.com/RocketChat/developer-docs/blob/master/reference/api/rest-api/endpoints/team-collaboration-endpoints/im-endpoints
 */
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Uploads, Messages, Rooms, Users } from '@rocket.chat/models';
import {
	isDmDeleteProps,
	isDmFileProps,
	isDmMemberProps,
	isDmMessagesProps,
	isDmCreateProps,
	isDmHistoryProps,
} from '@rocket.chat/rest-typings';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';

import { eraseRoom } from '../../../../server/lib/eraseRoom';
import { openRoom } from '../../../../server/lib/openRoom';
import { createDirectMessage } from '../../../../server/methods/createDirectMessage';
import { hideRoomMethod } from '../../../../server/methods/hideRoom';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasAtLeastOnePermissionAsync, hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { saveRoomSettings } from '../../../channel-settings/server/methods/saveRoomSettings';
import { getRoomByNameOrIdWithOptionToJoin } from '../../../lib/server/functions/getRoomByNameOrIdWithOptionToJoin';
import { getChannelHistory } from '../../../lib/server/methods/getChannelHistory';
import { settings } from '../../../settings/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { addUserToFileObj } from '../helpers/addUserToFileObj';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
import { getPaginationItems } from '../helpers/getPaginationItems';

// TODO: Refact or remove

type findDirectMessageRoomProps =
	| {
			roomId: string;
	  }
	| {
			username: string;
	  };

const findDirectMessageRoom = async (
	keys: findDirectMessageRoomProps,
	uid: string,
): Promise<{ room: IRoom; subscription: ISubscription | null }> => {
	if (!('roomId' in keys) && !('username' in keys)) {
		throw new Meteor.Error('error-room-param-not-provided', 'Query param "roomId" or "username" is required');
	}

	const user = await Users.findOneById(uid, { projection: { username: 1 } });
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'findDirectMessageRoom',
		});
	}

	const room = await getRoomByNameOrIdWithOptionToJoin({
		user,
		nameOrId: 'roomId' in keys ? keys.roomId : keys.username,
		type: 'd',
	});

	if (!room || room?.t !== 'd') {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" param provided does not match any direct message');
	}

	const subscription = await Subscriptions.findOne({ 'rid': room._id, 'u._id': uid });

	return {
		room,
		subscription,
	};
};

API.v1.addRoute(
	['dm.create', 'im.create'],
	{
		authRequired: true,
		validateParams: isDmCreateProps,
	},
	{
		async post() {
			const users =
				'username' in this.bodyParams
					? [this.bodyParams.username]
					: this.bodyParams.usernames.split(',').map((username: string) => username.trim());

			const room = await createDirectMessage(users, this.userId, this.bodyParams.excludeSelf);

			return API.v1.success({
				room: { ...room, _id: room.rid },
			});
		},
	},
);

API.v1.addRoute(
	['dm.delete', 'im.delete'],
	{
		authRequired: true,
		validateParams: isDmDeleteProps,
	},
	{
		async post() {
			const { room } = await findDirectMessageRoom(this.bodyParams, this.userId);

			const canAccess =
				(await canAccessRoomIdAsync(room._id, this.userId)) || (await hasPermissionAsync(this.userId, 'view-room-administration'));
			if (!canAccess) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			await eraseRoom(room._id, this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	['dm.close', 'im.close'],
	{ authRequired: true },
	{
		async post() {
			const { roomId } = this.bodyParams;
			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}

			let subscription;

			const roomExists = !!(await Rooms.findOneById(roomId));
			if (!roomExists) {
				// even if the room doesn't exist, we should allow the user to close the subscription anyways
				subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId);
			} else {
				const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
				if (!canAccess) {
					return API.v1.forbidden();
				}

				const { subscription: subs } = await findDirectMessageRoom({ roomId }, this.userId);

				subscription = subs;
			}

			if (!subscription) {
				return API.v1.failure(`The user is not subscribed to the room`);
			}

			if (!subscription.open) {
				return API.v1.failure(`The direct message room, is already closed to the sender`);
			}

			await hideRoomMethod(this.userId, roomId);

			return API.v1.success();
		},
	},
);

// https://github.com/RocketChat/Rocket.Chat/pull/9679 as reference
API.v1.addRoute(
	['dm.counters', 'im.counters'],
	{ authRequired: true },
	{
		async get() {
			const access = await hasPermissionAsync(this.userId, 'view-room-administration');
			const { roomId, userId: ruserId } = this.queryParams;
			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Query param "roomId" is required');
			}
			let user = this.userId;
			let unreads = null;
			let userMentions = null;
			let unreadsFrom = null;
			let joined = false;
			let msgs = null;
			let latest = null;
			let members = null;
			let lm = null;

			if (ruserId) {
				if (!access) {
					return API.v1.forbidden();
				}
				user = ruserId;
			}
			const canAccess = await canAccessRoomIdAsync(roomId, user);

			if (!canAccess) {
				return API.v1.forbidden();
			}

			const { room, subscription } = await findDirectMessageRoom({ roomId }, user);

			lm = room?.lm ? new Date(room.lm).toISOString() : new Date(room._updatedAt).toISOString(); // lm is the last message timestamp

			if (subscription) {
				unreads = subscription.unread ?? null;
				if (subscription.ls && room.msgs) {
					unreadsFrom = new Date(subscription.ls).toISOString(); // last read timestamp
				}
				userMentions = subscription.userMentions;
				joined = true;
			}

			if (access || joined) {
				msgs = room.msgs;
				latest = lm;
				members = room.usersCount;
			}

			return API.v1.success({
				joined,
				members,
				unreads,
				unreadsFrom,
				msgs,
				latest,
				userMentions,
			});
		},
	},
);

API.v1.addRoute(
	['dm.files', 'im.files'],
	{
		authRequired: true,
		validateParams: isDmFileProps,
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const { room } = await findDirectMessageRoom(this.queryParams, this.userId);

			const canAccess = await canAccessRoomIdAsync(room._id, this.userId);
			if (!canAccess) {
				return API.v1.forbidden();
			}

			const ourQuery = query ? { rid: room._id, ...query } : { rid: room._id };

			const { cursor, totalCount } = Uploads.findPaginatedWithoutThumbs(ourQuery, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				projection: fields,
			});

			const [files, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				files: await addUserToFileObj(files),
				count: files.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	['dm.history', 'im.history'],
	{ authRequired: true, validateParams: isDmHistoryProps },
	{
		async get() {
			const { offset = 0, count = 20 } = await getPaginationItems(this.queryParams);
			const { roomId, latest, oldest, inclusive, unreads, showThreadMessages } = this.queryParams;

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Query param "roomId" is required');
			}
			const { room } = await findDirectMessageRoom({ roomId }, this.userId);

			const objectParams = {
				rid: room._id,
				fromUserId: this.userId,
				latest: latest ? new Date(latest) : new Date(),
				oldest: oldest ? new Date(oldest) : undefined,
				inclusive: inclusive === 'true',
				offset,
				count,
				unreads: unreads === 'true',
				showThreadMessages: showThreadMessages === 'true',
			};

			const result = await getChannelHistory(objectParams);

			if (!result) {
				return API.v1.forbidden();
			}

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	['dm.members', 'im.members'],
	{
		authRequired: true,
		validateParams: isDmMemberProps,
	},
	{
		async get() {
			const { room } = await findDirectMessageRoom(this.queryParams, this.userId);

			const canAccess = await canAccessRoomIdAsync(room._id, this.userId);
			if (!canAccess) {
				return API.v1.forbidden();
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			check(
				this.queryParams,
				Match.ObjectIncluding({
					status: Match.Maybe([String]),
					filter: Match.Maybe(String),
				}),
			);
			const { status, filter } = this.queryParams;

			const extraQuery = {
				_id: { $in: room.uids },
				...(status && { status: { $in: status } }),
			};

			const canSeeExtension = await hasAtLeastOnePermissionAsync(
				this.userId,
				['view-full-other-user-info', 'view-user-voip-extension'],
				room._id,
			);

			const options: FindOptions<IUser> = {
				projection: {
					_id: 1,
					username: 1,
					name: 1,
					status: 1,
					statusText: 1,
					utcOffset: 1,
					federated: 1,
					...(canSeeExtension && { freeSwitchExtension: 1 }),
				},
				skip: offset,
				limit: count,
				sort: {
					_updatedAt: -1,
					username: sort?.username ? sort.username : 1,
				},
			};

			const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

			const { cursor, totalCount } = Users.findPaginatedByActiveUsersExcept(filter, [], options, searchFields, [extraQuery]);

			const [members, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				members,
				count: members.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	['dm.messages', 'im.messages'],
	{
		authRequired: true,
		validateParams: isDmMessagesProps,
	},
	{
		async get() {
			const { roomId, username, mentionIds, starredIds, pinned } = this.queryParams;

			const { room } = await findDirectMessageRoom({ ...(roomId ? { roomId } : { username }) }, this.userId);

			const canAccess = await canAccessRoomIdAsync(room._id, this.userId);
			if (!canAccess) {
				return API.v1.forbidden();
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const parseIds = (ids: string | undefined, field: string) =>
				typeof ids === 'string' && ids ? { [field]: { $in: ids.split(',').map((id) => id.trim()) } } : {};

			const ourQuery = {
				rid: room._id,
				...query,
				...parseIds(mentionIds, 'mentions._id'),
				...parseIds(starredIds, 'starred._id'),
				...(pinned && pinned.toLowerCase() === 'true' ? { pinned: true } : {}),
			};
			const sortObj = sort || { ts: -1 };

			const { cursor, totalCount } = Messages.findPaginated(ourQuery, {
				sort: sortObj,
				skip: offset,
				limit: count,
				...(fields && { projection: fields }),
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
	['dm.messages.others', 'im.messages.others'],
	{ authRequired: true, permissionsRequired: ['view-room-administration'] },
	{
		async get() {
			if (settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
				throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
					route: '/api/v1/im.messages.others',
				});
			}

			const { roomId } = this.queryParams;
			if (!roomId) {
				throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
			}

			const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't'>>(roomId, { projection: { _id: 1, t: 1 } });
			if (!room || room?.t !== 'd') {
				throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${roomId}`);
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();
			const ourQuery = Object.assign({}, query, { rid: room._id });

			const { cursor, totalCount } = Messages.findPaginated<IMessage>(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				projection: fields,
			});

			const [msgs, total] = await Promise.all([cursor.toArray(), totalCount]);

			if (!msgs) {
				throw new Meteor.Error('error-no-messages', 'No messages found');
			}

			return API.v1.success({
				messages: await normalizeMessagesForUser(msgs, this.userId),
				offset,
				count: msgs.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	['dm.list', 'im.list'],
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort = { name: 1 }, fields } = await this.parseJsonQuery();

			// TODO: CACHE: Add Breaking notice since we removed the query param

			const subscriptions = await Subscriptions.find({ 'u._id': this.userId, 't': 'd' }, { projection: { rid: 1 } })
				.map((item) => item.rid)
				.toArray();

			const { cursor, totalCount } = Rooms.findPaginated(
				{ t: 'd', _id: { $in: subscriptions } },
				{
					sort,
					skip: offset,
					limit: count,
					projection: fields,
				},
			);

			const [ims, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				ims: await Promise.all(ims.map((room: IRoom) => composeRoomWithLastMessage(room, this.userId))),
				offset,
				count: ims.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	['dm.list.everyone', 'im.list.everyone'],
	{ authRequired: true, permissionsRequired: ['view-room-administration'] },
	{
		async get() {
			const { offset, count }: { offset: number; count: number } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const { cursor, totalCount } = Rooms.findPaginated(
				{ ...query, t: 'd' },
				{
					sort: sort || { name: 1 },
					skip: offset,
					limit: count,
					projection: fields,
				},
			);

			const [rooms, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				ims: await Promise.all(rooms.map((room: IRoom) => composeRoomWithLastMessage(room, this.userId))),
				offset,
				count: rooms.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	['dm.open', 'im.open'],
	{ authRequired: true },
	{
		async post() {
			const { roomId } = this.bodyParams;

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
			if (!canAccess) {
				return API.v1.forbidden();
			}

			const { room, subscription } = await findDirectMessageRoom({ roomId }, this.userId);

			if (!subscription?.open) {
				await openRoom(this.userId, room._id);
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	['dm.setTopic', 'im.setTopic'],
	{ authRequired: true },
	{
		async post() {
			const { roomId, topic } = this.bodyParams;

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}

			const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
			if (!canAccess) {
				return API.v1.forbidden();
			}

			const { room } = await findDirectMessageRoom({ roomId }, this.userId);

			await saveRoomSettings(this.userId, room._id, 'roomTopic', topic);

			return API.v1.success({
				topic,
			});
		},
	},
);
