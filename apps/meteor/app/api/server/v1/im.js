import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Subscriptions, Users, Messages, Rooms } from '../../../models/server';
import { Uploads } from '../../../models/server/raw';
import { canAccessRoom, hasPermission } from '../../../authorization/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { settings } from '../../../settings/server';
import { API } from '../api';
import { getDirectMessageByNameOrIdWithOptionToJoin } from '../../../lib/server/functions/getDirectMessageByNameOrIdWithOptionToJoin';
import { createDirectMessage } from '../../../../server/methods/createDirectMessage';

// TODO: Refact or remove
function findDirectMessageRoom(params, user, allowAdminOverride) {
	if ((!params.roomId || !params.roomId.trim()) && (!params.username || !params.username.trim())) {
		throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" or "username" is required');
	}

	const room = getDirectMessageByNameOrIdWithOptionToJoin({
		currentUserId: user._id,
		nameOrId: params.username || params.roomId,
	});

	const canAccess = canAccessRoom(room, user) || (allowAdminOverride && hasPermission(user._id, 'view-room-administration'));
	if (!canAccess || !room || room.t !== 'd') {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "username" param provided does not match any direct message');
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);

	return {
		room,
		subscription,
	};
}

API.v1.addRoute(
	['dm.create', 'im.create'],
	{ authRequired: true },
	{
		post() {
			const { username, usernames, excludeSelf } = this.requestParams();

			const users = username ? [username] : usernames && usernames.split(',').map((username) => username.trim());

			if (!users) {
				throw new Meteor.Error(
					'error-room-not-found',
					'The required "username" or "usernames" param provided does not match any direct message',
				);
			}

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
		post() {
			if (!hasPermission(this.userId, 'view-room-administration')) {
				return API.v1.unauthorized();
			}
			const { roomId } = this.requestParams();
			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}

			const findResult = findDirectMessageRoom({ roomId }, this.user, true);

			Meteor.call('eraseRoom', findResult.room._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	['dm.close', 'im.close'],
	{ authRequired: true },
	{
		post() {
			const { roomId } = this.requestParams();
			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}

			const findResult = findDirectMessageRoom({ roomId }, this.user);

			if (!findResult.subscription.open) {
				return API.v1.failure(`The direct message room, ${this.bodyParams.name}, is already closed to the sender`);
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('hideRoom', findResult.room._id);
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
		get() {
			const access = hasPermission(this.userId, 'view-room-administration');
			const { roomId, userId: ruserId } = this.requestParams();
			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
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
			const rs = findDirectMessageRoom({ roomId }, { _id: user });
			const { room } = rs;
			const dm = rs.subscription;
			lm = room.lm ? room.lm : room._updatedAt; // lm is the last message timestamp

			if (typeof dm !== 'undefined' && dm.open) {
				if (dm.ls && room.msgs) {
					unreads = dm.unread;
					unreadsFrom = dm.ls; // last read timestamp
				}
				userMentions = dm.userMentions;
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
			const { roomId } = this.requestParams();

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}

			const findResult = findDirectMessageRoom({ roomId }, this.user);
			const addUserObjectToEveryObject = (file) => {
				if (file.userId) {
					file = this.insertUserObject({ object: file, userId: file.userId });
				}
				return file;
			};

			const ourQuery = Object.assign({}, query, { rid: findResult.room._id });

			const files = await Uploads.find(ourQuery, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				fields,
			})
				.map(addUserObjectToEveryObject)
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

// https://github.com/xbolshe/docs/blob/cf09dff1b654ca861dac539aa01956a508df49aa/developer-guides/rest-api/im/history/README.md
API.v1.addRoute(
	['dm.history', 'im.history'],
	{ authRequired: true },
	{
		get() {
			const { offset = 0, count = 20 } = this.getPaginationItems();
			const { roomId } = this.requestParams();
			let { latest, oldest, inclusive, unreads, showThreadMessages } = this.queryParams;

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			const findResult = findDirectMessageRoom({ roomId }, this.user);

			latest = latest ? new Date(latest) : new Date();

			oldest = oldest && new Date(oldest);
			inclusive = inclusive === 'true';
			unreads = unreads === 'true';
			showThreadMessages = showThreadMessages === 'true';

			const result = Meteor.call('getChannelHistory', {
				rid: findResult.room._id,
				latest,
				oldest,
				inclusive,
				offset,
				count,
				unreads,
				showThreadMessages,
			});

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
		get() {
			const { roomId } = this.requestParams();

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			const findResult = findDirectMessageRoom({ roomId }, this.user);

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
				_id: { $in: findResult.room.uids },
				...(status && { status: { $in: status } }),
			};

			const options = {
				sort: { username: sort && sort.username ? sort.username : 1 },
				fields: { _id: 1, username: 1, name: 1, status: 1, statusText: 1, utcOffset: 1 },
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
		get() {
			const { roomId } = this.requestParams();

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			const findResult = findDirectMessageRoom({ roomId }, this.user);

			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { rid: findResult.room._id });
			const sortObj = sort?.ts ? { ts: sort.ts } : { ts: -1 };
			const messages = Messages.find(ourQuery, {
				sort: sortObj,
				skip: offset,
				limit: count,
				fields,
			}).fetch();

			return API.v1.success({
				messages: normalizeMessagesForUser(messages, this.userId),
				count: messages.length,
				offset,
				total: Messages.find(ourQuery).count(),
			});
		},
	},
);

API.v1.addRoute(
	['dm.messages.others', 'im.messages.others'],
	{ authRequired: true },
	{
		get() {
			if (settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
				throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
					route: '/api/v1/im.messages.others',
				});
			}

			if (!hasPermission(this.userId, 'view-room-administration')) {
				return API.v1.unauthorized();
			}

			const { roomId } = this.queryParams;
			if (!roomId || !roomId.trim()) {
				throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
			}

			const room = Rooms.findOneById(roomId);
			if (!room || room.t !== 'd') {
				throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${roomId}`);
			}

			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();
			const ourQuery = Object.assign({}, query, { rid: room._id });

			const msgs = Messages.find(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				fields,
			}).fetch();

			return API.v1.success({
				messages: normalizeMessagesForUser(msgs, this.userId),
				offset,
				count: msgs.length,
				total: Messages.find(ourQuery).count(),
			});
		},
	},
);

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
				ims: rooms.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
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
				ims: rooms.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
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
		post() {
			const { roomId } = this.requestParams();

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			const findResult = findDirectMessageRoom({ roomId }, this.user);

			if (!findResult.subscription.open) {
				Meteor.runAsUser(this.userId, () => {
					Meteor.call('openRoom', findResult.room._id);
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
		post() {
			const { roomId, topic } = this.requestParams();

			if (!roomId) {
				throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
			}
			if (!topic) {
				return API.v1.failure('The bodyParam "topic" is required');
			}

			const findResult = findDirectMessageRoom({ roomId }, this.user);

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.room._id, 'roomTopic', topic);
			});

			return API.v1.success({
				topic,
			});
		},
	},
);
