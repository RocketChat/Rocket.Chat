/**
 * Docs: https://github.com/RocketChat/developer-docs/blob/master/reference/api/rest-api/endpoints/team-collaboration-endpoints/im-endpoints
 */
import type { IRoom, ISubscription, IUpload, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Users, Rooms } from '../../../models/server';
import { Subscriptions, Uploads, Messages } from '../../../models/server/raw';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasPermission } from '../../../authorization/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { getRoomByNameOrIdWithOptionToJoin } from '../../../lib/server/functions/getRoomByNameOrIdWithOptionToJoin';
import { createDirectMessage } from '../../../../server/methods/createDirectMessage';

interface IImFilesObject extends IUpload {
	userId: string;
}
// TODO: Refact or remove
const findDirectMessageRoom = async ({
	userId,
	roomId,
	username,
}: {
	userId: string;
	roomId?: string;
	username?: string;
}): Promise<{ room: IRoom; subscription: ISubscription | null }> => {
	const room = getRoomByNameOrIdWithOptionToJoin({
		currentUserId: userId,
		nameOrId: username || roomId,
		type: 'd',
	});
	if (!room || room?.t !== 'd') {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" param provided does not match any direct message');
	}

	const subscription = await Subscriptions.findOne({ 'rid': room._id, 'u._id': userId });

	return {
		room,
		subscription,
	};
};

API.v1.addRoute(
	['dm.create', 'im.create'],
	{ authRequired: true },
	{
		post() {
			const { username, usernames, excludeSelf = false } = this.requestParams();

			if (!username && !usernames) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "username" or "usernames" is required');
			}

			const users = username ? [username] : usernames?.split(',').map((username: string) => username.trim());

			const room = createDirectMessage(users, this.userId, excludeSelf);

			return API.v1.success({
				room: { ...room, _id: room.rid },
			});
		},
	},
);

API.v1.addRoute(
	['dm.delete', 'im.delete'],
	{ authRequired: true },
	{
		async post() {
			const { roomId, username } = this.requestParams();
			if (!roomId && !username) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" or "username" is required');
			}
			const { room } = await findDirectMessageRoom({ roomId, username, userId: this.userId });

			const canAccess = (await canAccessRoomIdAsync(room._id, this.userId)) || hasPermission(this.userId, 'view-room-administration');
			if (!canAccess) {
				return API.v1.unauthorized();
			}

			Meteor.call('eraseRoom', room._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	['dm.close', 'im.close'],
	{ authRequired: true },
	{
		async post() {
			const { roomId } = this.requestParams();
			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
			if (!canAccess) {
				return API.v1.unauthorized();
			}

			const { room, subscription } = await findDirectMessageRoom({ roomId, userId: this.userId });

			if (!subscription?.open) {
				return API.v1.failure(`The direct message room, is already closed to the sender`);
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('hideRoom', room._id);
			});

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
			const access = hasPermission(this.userId, 'view-room-administration');
			const { roomId, userId: ruserId } = this.requestParams();
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
					return API.v1.unauthorized();
				}
				user = ruserId;
			}
			const canAccess = await canAccessRoomIdAsync(roomId, user);

			if (!canAccess) {
				return API.v1.unauthorized();
			}

			const { room, subscription } = await findDirectMessageRoom({ roomId, userId: user });

			lm = room?.lm ? new Date(room.lm).toISOString() : new Date(room._updatedAt).toISOString(); // lm is the last message timestamp

			if (subscription?.open) {
				if (subscription.ls && room.msgs) {
					unreads = subscription.unread;
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
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();
			const { roomId, username } = this.requestParams();

			if (!roomId && !username) {
				throw new Meteor.Error('error-room-param-not-provided', 'Query param "roomId" or "username" is required');
			}

			const { room } = await findDirectMessageRoom({ roomId, username, userId: this.userId });

			const canAccess = await canAccessRoomIdAsync(room._id, this.userId);
			if (!canAccess) {
				return API.v1.unauthorized();
			}

			const ourQuery = query ? { rid: room._id, ...query } : { rid: room._id };

			const files = await Uploads.find<IUpload & { userId: string }>(ourQuery, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				projection: fields,
			})
				.map((file): IImFilesObject | (IImFilesObject & { user: Pick<IUser, '_id' | 'name' | 'username'> }) => {
					if (file.userId) {
						return this.insertUserObject<IImFilesObject & { user: Pick<IUser, '_id' | 'name' | 'username'> }>({
							object: { ...file },
							userId: file.userId,
						});
					}
					return file;
				})
				.toArray();
			const total = await Uploads.find(ourQuery).count();
			return API.v1.success({
				files,
				count: files.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	['dm.history', 'im.history'],
	{ authRequired: true },
	{
		async get() {
			const { offset = 0, count = 20 } = this.getPaginationItems();
			const { roomId } = this.requestParams();
			const { latest, oldest, inclusive, unreads, showThreadMessages } = this.queryParams;

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Query param "roomId" is required');
			}
			const { room } = await findDirectMessageRoom({ roomId, userId: this.userId });

			const objectParams = {
				rid: room._id,
				latest: latest ? new Date(latest).toISOString() : new Date().toISOString(),
				oldest: oldest && new Date(oldest).toISOString(),
				inclusive: inclusive === 'true',
				offset,
				count,
				unreads: unreads === 'true',
				showThreadMessages: showThreadMessages === 'true',
			};
			const result = Meteor.call('getChannelHistory', objectParams);

			if (!result) {
				return API.v1.unauthorized();
			}

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	['dm.members', 'im.members'],
	{ authRequired: true },
	{
		async get() {
			const { roomId, username } = this.requestParams();

			if (!roomId && !username) {
				throw new Meteor.Error('error-room-param-not-provided', 'Query param "roomId" or "username" is required');
			}

			const { room } = await findDirectMessageRoom({ roomId, username, userId: this.userId });

			const canAccess = await canAccessRoomIdAsync(room._id, this.userId);
			if (!canAccess) {
				return API.v1.unauthorized();
			}

			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

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

			const options = {
				sort: { username: sort?.username ? sort.username : 1 },
				projection: { _id: 1, username: 1, name: 1, status: 1, statusText: 1, utcOffset: 1 },
				skip: offset,
				limit: count,
			};

			const cursor = Users.findByActiveUsersExcept(filter, [], options, null, [extraQuery]);

			const members = cursor.fetch();
			const total = cursor.count();

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
	{ authRequired: true },
	{
		async get() {
			const { roomId, username } = this.requestParams();

			if (!roomId && !username) {
				throw new Meteor.Error('error-room-param-not-provided', 'Query param "roomId" or "username" is required');
			}

			const { room } = await findDirectMessageRoom({ roomId, username, userId: this.userId });

			const canAccess = await canAccessRoomIdAsync(room._id, this.userId);
			if (!canAccess) {
				return API.v1.unauthorized();
			}

			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { rid: room._id });
			const sortObj = sort?.ts ? { ts: sort.ts } : { ts: -1 };
			const messages = await Messages.find(ourQuery, {
				sort: sortObj,
				skip: offset,
				limit: count,
				fields,
			}).toArray();

			return API.v1.success({
				messages: normalizeMessagesForUser(messages, this.userId),
				count: messages.length,
				offset,
				total: await Messages.find(ourQuery).count(),
			});
		},
	},
);

// TODO: fix return
// API.v1.addRoute(
// 	['dm.messages.others', 'im.messages.others'],
// 	{ authRequired: true },
// 	{
// 		async get() {
// 			// if (settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
// 			// 	throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
// 			// 		route: '/api/v1/im.messages.others',
// 			// 	});
// 			// }

// 			try {
// 				if (!hasPermission(this.userId, 'view-room-administration')) {
// 					return API.v1.unauthorized();
// 				}

// 				const { roomId } = this.requestParams();
// 				if (!roomId || !roomId.trim()) {
// 					throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
// 				}

// 				const room = Rooms.findOneById(roomId);
// 				if (!room || room.t !== 'd') {
// 					throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${roomId}`);
// 				}

// 				const { offset, count } = this.getPaginationItems();
// 				const { sort, fields, query } = this.parseJsonQuery();
// 				const ourQuery = Object.assign({}, query, { rid: room._id });

// 				const msgs = await Messages.find<IMessage>(ourQuery, {
// 					sort: sort || { ts: -1 },
// 					skip: offset,
// 					limit: count,
// 					fields,
// 				}).toArray();

// 				if (!msgs) {
// 					throw new Meteor.Error('error-no-messages', 'No messages found');
// 				}

// 				return API.v1.success({
// 					messages: msgs, //normalizeMessagesForUser(msgs, this.userId),
// 					offset: 0,
// 					count: 0,
// 					total: 0, //await Messages.find(ourQuery).count(),
// 				});
// 			} catch (error) {
// 				console.log(error, `${error}`);
// 				API.v1.failure(`${error}`);
// 			}
// 		},
// 	},
// );

API.v1.addRoute(
	['dm.list', 'im.list'],
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort = { name: 1 }, fields } = this.parseJsonQuery();

			// TODO: CACHE: Add Breacking notice since we removed the query param

			const cursor = Rooms.findBySubscriptionTypeAndUserId('d', this.userId, {
				sort,
				skip: offset,
				limit: count,
				fields,
			});

			const total = cursor.count();
			const rooms = cursor.fetch();

			return API.v1.success({
				ims: rooms.map((room: IRoom) => this.composeRoomWithLastMessage(room, this.userId)),
				offset,
				count: rooms.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	['dm.list.everyone', 'im.list.everyone'],
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-room-administration')) {
				return API.v1.unauthorized();
			}

			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { t: 'd' });

			const rooms = Rooms.find(ourQuery, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				fields,
			}).fetch();

			return API.v1.success({
				ims: rooms.map((room: IRoom) => this.composeRoomWithLastMessage(room, this.userId)),
				offset,
				count: rooms.length,
				total: Rooms.find(ourQuery).count(),
			});
		},
	},
);

API.v1.addRoute(
	['dm.open', 'im.open'],
	{ authRequired: true },
	{
		async post() {
			const { roomId } = this.requestParams();

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
			if (!canAccess) {
				return API.v1.unauthorized();
			}

			const { room, subscription } = await findDirectMessageRoom({ roomId, userId: this.userId });

			if (!subscription?.open) {
				Meteor.runAsUser(this.userId, () => {
					Meteor.call('openRoom', room._id);
				});
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
			const { roomId, topic } = this.requestParams();

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
			if (!canAccess) {
				return API.v1.unauthorized();
			}

			if (!topic) {
				return API.v1.failure('The bodyParam "topic" is required');
			}

			const { room } = await findDirectMessageRoom({ roomId, userId: this.userId });

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', room._id, 'roomTopic', topic);
			});

			return API.v1.success({
				topic,
			});
		},
	},
);
