import { Team, isMeteorError } from '@rocket.chat/core-services';
import type { IIntegration, IUser, IRoom, RoomType } from '@rocket.chat/core-typings';
import { Integrations, Messages, Rooms, Subscriptions, Uploads, Users } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { Filter, FindOptions } from 'mongodb';

import { findUsersOfRoom } from '../../../../server/lib/findUsersOfRoom';
import { hideRoomMethod } from '../../../../server/methods/hideRoom';
import { removeUserFromRoomMethod } from '../../../../server/methods/removeUserFromRoom';
import { canAccessRoomAsync, roomAccessAttributes } from '../../../authorization/server';
import {
	hasAllPermissionAsync,
	hasAtLeastOnePermissionAsync,
	hasPermissionAsync,
} from '../../../authorization/server/functions/hasPermission';
import { saveRoomSettings } from '../../../channel-settings/server/methods/saveRoomSettings';
import { mountIntegrationQueryBasedOnPermissions } from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { createPrivateGroupMethod } from '../../../lib/server/methods/createPrivateGroup';
import { leaveRoomMethod } from '../../../lib/server/methods/leaveRoom';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { addUserToFileObj } from '../helpers/addUserToFileObj';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
import { getLoggedInUser } from '../helpers/getLoggedInUser';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUserFromParams, getUserListFromParams } from '../helpers/getUserFromParams';
import { isUserMutedInRoom } from '../lib/rooms';

async function getRoomFromParams(
	params: { roomId?: string } | { roomName?: string },
	roomFields: FindOptions<IRoom>['projection'] = {},
): Promise<IRoom> {
	if (
		(!('roomId' in params) && !('roomName' in params)) ||
		('roomId' in params && !(params as { roomId?: string }).roomId && 'roomName' in params && !(params as { roomName?: string }).roomName)
	) {
		throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	const roomOptions = {
		projection: {
			...roomAccessAttributes,
			...roomFields,
			t: 1,
			ro: 1,
			name: 1,
			fname: 1,
			prid: 1,
			archived: 1,
			broadcast: 1,
		},
	};

	const room = await (() => {
		if ('roomId' in params) {
			return Rooms.findOneById(params.roomId || '', roomOptions);
		}
		if ('roomName' in params) {
			return Rooms.findOneByName(params.roomName || '', roomOptions);
		}
	})();

	if (!room || room.t !== 'p') {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	return room;
}

// Returns the private group subscription IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
async function findPrivateGroupByIdOrName({
	params,
	checkedArchived = true,
	userId,
}: {
	params:
		| {
				roomId?: string;
		  }
		| {
				roomName?: string;
		  };
	userId: string;
	checkedArchived?: boolean;
}): Promise<{
	rid: string;
	open: boolean;
	ro: boolean;
	t: string;
	name: string;
	broadcast: boolean;
}> {
	const room = await getRoomFromParams(params);

	const user = await Users.findOneById(userId, { projections: { username: 1 } });

	if (!room || !user || !(await canAccessRoomAsync(room, user))) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	// discussions have their names saved on `fname` property
	const roomName = room.prid ? room.fname : room.name;

	if (checkedArchived && room.archived) {
		throw new Meteor.Error('error-room-archived', `The private group, ${roomName}, is archived`);
	}

	const sub = await Subscriptions.findOneByRoomIdAndUserId(room._id, userId, { projection: { open: 1 } });

	return {
		rid: room._id,
		open: Boolean(sub?.open),
		ro: Boolean(room.ro),
		t: room.t,
		name: roomName ?? '',
		broadcast: Boolean(room.broadcast),
	};
}

API.v1.addRoute(
	'groups.addAll',
	{ authRequired: true },
	{
		async post() {
			const { activeUsersOnly, ...params } = this.bodyParams;
			const findResult = await findPrivateGroupByIdOrName({
				params,
				userId: this.userId,
			});

			await Meteor.callAsync('addAllUserToRoom', findResult.rid, this.bodyParams.activeUsersOnly);

			const room = await Rooms.findOneById(findResult.rid, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			return API.v1.success({
				group: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.addModerator',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('addRoomModerator', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.addOwner',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('addRoomOwner', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.addLeader',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});
			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('addRoomLeader', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

// Archives a private group only if it wasn't
API.v1.addRoute(
	'groups.archive',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.callAsync('archiveRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.close',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
				checkedArchived: false,
			});

			if (!findResult.open) {
				return API.v1.failure(`The private group, ${findResult.name}, is already closed to the sender`);
			}

			await hideRoomMethod(this.userId, findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.counters',
	{ authRequired: true },
	{
		async get() {
			const access = await hasPermissionAsync(this.userId, 'view-room-administration');
			const params = this.queryParams;
			let user = this.userId;
			let room;
			let unreads = null;
			let userMentions = null;
			let unreadsFrom = null;
			let joined = false;
			let msgs = null;
			let latest = null;
			let members = null;

			if (('roomId' in params && !params.roomId) || ('roomName' in params && !params.roomName)) {
				throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
			}

			if ('roomId' in params) {
				room = await Rooms.findOneById(params.roomId || '');
			} else if ('roomName' in params) {
				room = await Rooms.findOneByName(params.roomName || '');
			}

			if (!room || room.t !== 'p') {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			if (room.archived) {
				throw new Meteor.Error('error-room-archived', `The private group, ${room.name}, is archived`);
			}

			if (params.userId) {
				if (!access) {
					return API.v1.unauthorized();
				}
				user = params.userId;
			}
			const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user);
			const lm = room.lm ? room.lm : room._updatedAt;

			if (subscription?.open) {
				unreads = await Messages.countVisibleByRoomIdBetweenTimestampsInclusive(subscription.rid, subscription.ls || subscription.ts, lm);
				unreadsFrom = subscription.ls || subscription.ts;
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

// Create Private Group
API.v1.addRoute(
	'groups.create',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.name) {
				return API.v1.failure('Body param "name" is required');
			}

			if (this.bodyParams.members && !Array.isArray(this.bodyParams.members)) {
				return API.v1.failure('Body param "members" must be an array if provided');
			}

			if (this.bodyParams.customFields && !(typeof this.bodyParams.customFields === 'object')) {
				return API.v1.failure('Body param "customFields" must be an object if provided');
			}
			if (this.bodyParams.extraData && !(typeof this.bodyParams.extraData === 'object')) {
				return API.v1.failure('Body param "extraData" must be an object if provided');
			}

			const readOnly = typeof this.bodyParams.readOnly !== 'undefined' ? this.bodyParams.readOnly : false;

			try {
				const result = await createPrivateGroupMethod(
					this.user,
					this.bodyParams.name,
					this.bodyParams.members ? this.bodyParams.members : [],
					readOnly,
					this.bodyParams.customFields,
					this.bodyParams.extraData,
					this.bodyParams.excludeSelf ?? false,
				);

				const room = await Rooms.findOneById(result.rid, { projection: API.v1.defaultFieldsToExclude });
				if (!room) {
					throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
				}

				return API.v1.success({
					group: await composeRoomWithLastMessage(room, this.userId),
				});
			} catch (error: unknown) {
				if (isMeteorError(error) && error.reason === 'error-not-allowed') {
					return API.v1.unauthorized();
				}
				throw error;
			}
		},
	},
);

API.v1.addRoute(
	'groups.delete',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
				checkedArchived: false,
			});

			await Meteor.callAsync('eraseRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.files',
	{ authRequired: true },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
				checkedArchived: false,
			});

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { rid: findResult.rid });

			const { cursor, totalCount } = await Uploads.findPaginatedWithoutThumbs(ourQuery, {
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
	'groups.getIntegrations',
	{ authRequired: true },
	{
		async get() {
			if (
				!(await hasAtLeastOnePermissionAsync(this.userId, [
					'manage-outgoing-integrations',
					'manage-own-outgoing-integrations',
					'manage-incoming-integrations',
					'manage-own-incoming-integrations',
				]))
			) {
				return API.v1.unauthorized();
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
				checkedArchived: false,
			});

			let includeAllPrivateGroups = true;
			if (this.queryParams.includeAllPrivateGroups) {
				includeAllPrivateGroups = this.queryParams.includeAllPrivateGroups === 'true';
			}

			const channelsToSearch = [`#${findResult.name}`];
			if (includeAllPrivateGroups) {
				channelsToSearch.push('all_private_groups');
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields: projection, query } = await this.parseJsonQuery();

			const ourQuery = Object.assign(await mountIntegrationQueryBasedOnPermissions(this.userId), query, {
				channel: { $in: channelsToSearch },
			}) as Filter<IIntegration>;
			const { cursor, totalCount } = await Integrations.findPaginated(ourQuery, {
				sort: sort || { _createdAt: 1 },
				skip: offset,
				limit: count,
				projection,
			});

			const [integrations, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				integrations,
				count: integrations.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'groups.history',
	{ authRequired: true },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
				checkedArchived: false,
			});

			let latestDate = new Date();
			if (this.queryParams.latest) {
				latestDate = new Date(this.queryParams.latest);
			}

			let oldestDate = undefined;
			if (this.queryParams.oldest) {
				oldestDate = new Date(this.queryParams.oldest);
			}

			const inclusive = this.queryParams.inclusive || false;

			let count = 20;
			if (this.queryParams.count) {
				count = parseInt(String(this.queryParams.count));
			}

			let offset = 0;
			if (this.queryParams.offset) {
				offset = parseInt(String(this.queryParams.offset));
			}

			const unreads = this.queryParams.unreads || false;

			const showThreadMessages = this.queryParams.showThreadMessages !== 'false';

			const result = await Meteor.callAsync('getChannelHistory', {
				rid: findResult.rid,
				latest: latestDate,
				oldest: oldestDate,
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
	'groups.info',
	{ authRequired: true },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
				checkedArchived: false,
			});

			const room = await Rooms.findOneById(findResult.rid, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			return API.v1.success({
				group: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.invite',
	{ authRequired: true },
	{
		async post() {
			const roomId = 'roomId' in this.bodyParams ? this.bodyParams.roomId : '';
			const roomName = 'roomName' in this.bodyParams ? this.bodyParams.roomName : '';
			const idOrName = roomId || roomName;

			if (!idOrName?.trim()) {
				throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
			}

			const { _id: rid, t: type } = (await Rooms.findOneByIdOrName(idOrName)) || {};

			if (!rid || type !== 'p') {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			const users = await getUserListFromParams(this.bodyParams);

			if (!users.length) {
				throw new Meteor.Error('error-empty-invite-list', 'Cannot invite if no valid users are provided');
			}

			await Meteor.callAsync('addUsersToRoom', { rid, users: users.map((u) => u.username) });

			const room = await Rooms.findOneById(rid, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			return API.v1.success({
				group: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.kick',
	{ authRequired: true },
	{
		async post() {
			const room = await getRoomFromParams(this.bodyParams);

			const user = await getUserFromParams(this.bodyParams);
			if (!user?.username) {
				return API.v1.failure('Invalid user');
			}

			await removeUserFromRoomMethod(this.userId, { rid: room._id, username: user.username });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.leave',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await Users.findOneById(this.userId);
			if (!user) {
				return API.v1.failure('Invalid user');
			}
			await leaveRoomMethod(user, findResult.rid);

			return API.v1.success();
		},
	},
);

// List Private Groups a user has access to
API.v1.addRoute(
	'groups.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields } = await this.parseJsonQuery();

			const subs = await Subscriptions.findByUserIdAndTypes(this.userId, ['p'], { projection: { rid: 1 } }).toArray();
			const rids = subs.map(({ rid }) => rid).filter(Boolean);

			if (rids.length === 0) {
				return API.v1.success({
					groups: [],
					offset,
					count: 0,
					total: 0,
				});
			}

			const { cursor, totalCount } = await Rooms.findPaginatedByTypeAndIds('p', rids, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				projection: fields,
			});

			const [groups, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				groups: await Promise.all(groups.map((room) => composeRoomWithLastMessage(room, this.userId))),
				offset,
				count: groups.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'groups.listAll',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'view-room-administration'))) {
				return API.v1.unauthorized();
			}
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();
			const ourQuery = Object.assign({}, query, { t: 'p' as RoomType });

			const { cursor, totalCount } = await Rooms.findPaginated(ourQuery, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				projection: fields,
			});

			const [rooms, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				groups: await Promise.all(rooms.map((room) => composeRoomWithLastMessage(room, this.userId))),
				offset,
				count: rooms.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'groups.members',
	{ authRequired: true },
	{
		async get() {
			const room = await getRoomFromParams(this.queryParams, { muted: 1, unmuted: 1 });

			if (room?.broadcast && !(await hasPermissionAsync(this.userId, 'view-broadcast-member-list', room._id))) {
				return API.v1.unauthorized();
			}

			const { offset: skip, count: limit } = await getPaginationItems(this.queryParams);
			const { sort = {} } = await this.parseJsonQuery();

			check(
				this.queryParams,
				Match.ObjectIncluding({
					status: Match.Maybe([String]),
					filter: Match.Maybe(String),
				}),
			);

			const { status, filter } = this.queryParams;

			const { cursor, totalCount } = await findUsersOfRoom({
				rid: room._id,
				...(status && { status: { $in: status } }),
				skip,
				limit,
				filter,
				...(sort?.username && { sort: { username: sort.username } }),
			});

			const [membersList, total] = await Promise.all<[Promise<IUser[]>, Promise<number>]>([cursor.toArray(), totalCount]);

			const members = await Promise.all(
				membersList.map(async (member) => {
					const isMuted = await isUserMutedInRoom(member, room);
					return { ...member, isMuted };
				}),
			);

			return API.v1.success({
				members,
				count: members.length,
				offset: skip,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'groups.messages',
	{ authRequired: true },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
			});
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { rid: findResult.rid });

			const { cursor, totalCount } = await Messages.findPaginated(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				projection: fields,
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

// TODO: CACHE: same as channels.online
API.v1.addRoute(
	'groups.online',
	{ authRequired: true },
	{
		async get() {
			const { query } = await this.parseJsonQuery();
			if (!query || Object.keys(query).length === 0) {
				return API.v1.failure('Invalid query');
			}

			const ourQuery = Object.assign({}, query, { t: 'p' });

			const room = await Rooms.findOne(ourQuery as Record<string, any>);

			if (!room) {
				return API.v1.failure('Group does not exists');
			}
			const user = await getLoggedInUser(this.request);

			if (!user) {
				return API.v1.failure('User does not exists');
			}

			if (!(await canAccessRoomAsync(room, user))) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}

			const online: Pick<IUser, '_id' | 'username'>[] = await Users.findUsersNotOffline({
				projection: {
					username: 1,
				},
			}).toArray();

			const onlineInRoom = await Promise.all(
				online.map(async (user) => {
					const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
						projection: { _id: 1, username: 1 },
					});
					if (subscription) {
						return {
							_id: user._id,
							username: user.username,
						};
					}
				}),
			);

			return API.v1.success({
				online: onlineInRoom.filter(Boolean) as IUser[],
			});
		},
	},
);

API.v1.addRoute(
	'groups.open',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
				checkedArchived: false,
			});

			if (findResult.open) {
				return API.v1.failure(`The private group, ${findResult.name}, is already open for the sender`);
			}

			await Meteor.callAsync('openRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeModerator',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('removeRoomModerator', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeOwner',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('removeRoomOwner', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeLeader',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('removeRoomLeader', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.rename',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.name?.trim()) {
				return API.v1.failure('The bodyParam "name" is required');
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await saveRoomSettings(this.userId, findResult.rid, 'roomName', this.bodyParams.name);

			const room = await Rooms.findOneById(findResult.rid, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			return API.v1.success({
				group: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.setCustomFields',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.customFields || !(typeof this.bodyParams.customFields === 'object')) {
				return API.v1.failure('The bodyParam "customFields" is required with a type like object.');
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await saveRoomSettings(this.userId, findResult.rid, 'roomCustomFields', this.bodyParams.customFields);

			const room = await Rooms.findOneById(findResult.rid, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			return API.v1.success({
				group: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.setDescription',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.hasOwnProperty('description')) {
				return API.v1.failure('The bodyParam "description" is required');
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await saveRoomSettings(this.userId, findResult.rid, 'roomDescription', this.bodyParams.description || '');

			return API.v1.success({
				description: this.bodyParams.description || '',
			});
		},
	},
);

API.v1.addRoute(
	'groups.setPurpose',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.hasOwnProperty('purpose')) {
				return API.v1.failure('The bodyParam "purpose" is required');
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await saveRoomSettings(this.userId, findResult.rid, 'roomDescription', this.bodyParams.purpose || '');

			return API.v1.success({
				purpose: this.bodyParams.purpose || '',
			});
		},
	},
);

API.v1.addRoute(
	'groups.setReadOnly',
	{ authRequired: true },
	{
		async post() {
			if (typeof this.bodyParams.readOnly === 'undefined') {
				return API.v1.failure('The bodyParam "readOnly" is required');
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			if (findResult.ro === this.bodyParams.readOnly) {
				return API.v1.failure('The private group read only setting is the same as what it would be changed to.');
			}

			await saveRoomSettings(this.userId, findResult.rid, 'readOnly', this.bodyParams.readOnly);

			const room = await Rooms.findOneById(findResult.rid, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			return API.v1.success({
				group: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.setTopic',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.hasOwnProperty('topic')) {
				return API.v1.failure('The bodyParam "topic" is required');
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await saveRoomSettings(this.userId, findResult.rid, 'roomTopic', this.bodyParams.topic || '');

			return API.v1.success({
				topic: this.bodyParams.topic || '',
			});
		},
	},
);

API.v1.addRoute(
	'groups.setType',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.type?.trim()) {
				return API.v1.failure('The bodyParam "type" is required');
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			if (findResult.t === this.bodyParams.type) {
				return API.v1.failure('The private group type is the same as what it would be changed to.');
			}

			await saveRoomSettings(this.userId, findResult.rid, 'roomType', this.bodyParams.type as RoomType);

			const room = await Rooms.findOneById(findResult.rid, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			return API.v1.success({
				group: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.setAnnouncement',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.hasOwnProperty('announcement')) {
				return API.v1.failure('The bodyParam "announcement" is required');
			}

			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await saveRoomSettings(this.userId, findResult.rid, 'roomAnnouncement', this.bodyParams.announcement || '');

			return API.v1.success({
				announcement: this.bodyParams.announcement || '',
			});
		},
	},
);

API.v1.addRoute(
	'groups.unarchive',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
				checkedArchived: false,
			});

			await Meteor.callAsync('unarchiveRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.roles',
	{ authRequired: true },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
			});

			const roles = await Meteor.callAsync('getRoomRoles', findResult.rid);

			return API.v1.success({
				roles,
			});
		},
	},
);

API.v1.addRoute(
	'groups.moderators',
	{ authRequired: true },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
			});

			const moderators = (
				await Subscriptions.findByRoomIdAndRoles(findResult.rid, ['moderator'], {
					projection: { u: 1 },
				}).toArray()
			).map((sub: any) => sub.u);

			return API.v1.success({
				moderators,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setEncrypted',
	{ authRequired: true },
	{
		async post() {
			if (!Match.test(this.bodyParams, Match.ObjectIncluding({ encrypted: Boolean }))) {
				return API.v1.failure('The bodyParam "encrypted" is required');
			}
			const { encrypted, ...params } = this.bodyParams;

			const findResult = await findPrivateGroupByIdOrName({
				params,
				userId: this.userId,
			});

			await saveRoomSettings(this.userId, findResult.rid, 'encrypted', encrypted);

			const room = await Rooms.findOneById(findResult.rid, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			return API.v1.success({
				group: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.convertToTeam',
	{ authRequired: true },
	{
		async post() {
			if (('roomId' in this.bodyParams && !this.bodyParams.roomId) || ('roomName' in this.bodyParams && !this.bodyParams.roomName)) {
				return API.v1.failure('The parameter "roomId" or "roomName" is required');
			}

			const room = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			if (!room) {
				return API.v1.failure('Private group not found');
			}

			if (!(await hasAllPermissionAsync(this.userId, ['create-team', 'edit-room'], room.rid))) {
				return API.v1.unauthorized();
			}

			const subscriptions = await Subscriptions.findByRoomId(room.rid, {
				projection: { 'u._id': 1 },
			}).toArray();

			const members = subscriptions.map((s) => s.u?._id);

			const teamData = {
				team: {
					name: room.name,
					type: 1,
				},
				members,
				room: {
					name: room.name,
					id: room.rid,
				},
			};

			const team = await Team.create(this.userId, teamData);

			return API.v1.success({ team });
		},
	},
);
