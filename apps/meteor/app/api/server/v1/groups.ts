import { Meteor } from 'meteor/meteor';
import type { IIntegration, IUser, RoomType } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms, Messages, Users, Uploads, Integrations } from '@rocket.chat/models';
import {
	isGroupsAddAllProps,
	isGroupsAddModeratorProps,
	isGroupsAddOwnerProps,
	isGroupsAddLeaderProps,
	isGroupsArchiveProps,
	isGroupsCloseProps,
	isGroupsCountersProps,
	isGroupsCreateProps,
	isGroupsDeleteProps,
	isGroupsFilesProps,
	isGroupsGetIntegrationsProps,
	isGroupsHistoryProps,
	isGroupsInviteProps,
	isGroupsKickProps,
	isGroupsLeaveProps,
	isGroupsListProps,
	isGroupsInfoProps,
	isGroupsMembersProps,
	isGroupsMessageProps,
	isGroupsOnlineProps,
	isGroupsOpenProps,
	isGroupsRemoveModeratorProps,
	isGroupsRemoveOwnerProps,
	isGroupsRemoveLeaderProps,
	isGroupsRenameProps,
	isGroupsSetCustomFieldsProps,
	isGroupsSetDescriptionProps,
	isGroupsSetPurposeProps,
	isGroupsSetReadOnlyProps,
	isGroupsSetTopicProps,
	isGroupsSetTypeProps,
	isGroupsSetAnnouncementProps,
	isGroupsUnarchiveProps,
	isGroupsRolesProps,
	isGroupsModeratorsProps,
	isGroupsSetEncryptedProps,
	isGroupsConvertToTeamProps,
} from '@rocket.chat/rest-typings';
import { Team } from '@rocket.chat/core-services';
import type { Filter } from 'mongodb';

import { Rooms as RoomSync, Users as UsersSync, Messages as MessageSync, Subscriptions as SubscriptionsSync } from '../../../models/server';
import {
	hasPermission,
	hasAtLeastOnePermission,
	canAccessRoom,
	hasAllPermission,
	roomAccessAttributes,
} from '../../../authorization/server';
import { API } from '../api';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
import { getUserFromParams, getUserListFromParams } from '../helpers/getUserFromParams';
import { addUserToFileObj } from '../helpers/addUserToFileObj';
import { mountIntegrationQueryBasedOnPermissions } from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { findUsersOfRoom } from '../../../../server/lib/findUsersOfRoom';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { getLoggedInUser } from '../helpers/getLoggedInUser';

// Returns the private group subscription IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
async function findPrivateGroupByIdOrName({
	params,
	checkedArchived = true,
	userId,
}: {
	params:
		| {
				roomId: string;
		  }
		| {
				roomName: string;
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
	if (('roomId' in params && !params.roomId) || ('roomName' in params && !params.roomName)) {
		throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	const roomOptions = {
		fields: {
			...roomAccessAttributes,
			t: 1,
			ro: 1,
			name: 1,
			fname: 1,
			prid: 1,
			archived: 1,
			broadcast: 1,
		},
	};
	const room =
		'roomId' in params ? await Rooms.findOneById(params.roomId, roomOptions) : await Rooms.findOneByName(params.roomName, roomOptions);

	if (!room || room.t !== 'p') {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	const user = await Users.findOneById(userId, { projections: { username: 1 } });

	if (!room || !user || !canAccessRoom(room, user)) {
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
		ro: room.ro,
		t: room.t,
		name: roomName,
		broadcast: room.broadcast,
	};
}

API.v1.addRoute(
	'groups.addAll',
	{ authRequired: true, validateParams: isGroupsAddAllProps },
	{
		async post() {
			const { activeUsersOnly, ...params } = this.bodyParams;
			const findResult = await findPrivateGroupByIdOrName({
				params,
				userId: this.userId,
			});

			await Meteor.call('addAllUserToRoom', findResult.rid, this.bodyParams.activeUsersOnly);

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
	{ authRequired: true, validateParams: isGroupsAddModeratorProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.call('addRoomModerator', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.addOwner',
	{ authRequired: true, validateParams: isGroupsAddOwnerProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.call('addRoomOwner', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.addLeader',
	{ authRequired: true, validateParams: isGroupsAddLeaderProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});
			const user = await getUserFromParams(this.bodyParams);

			await Meteor.call('addRoomLeader', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

// Archives a private group only if it wasn't
API.v1.addRoute(
	'groups.archive',
	{ authRequired: true, validateParams: isGroupsArchiveProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('archiveRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.close',
	{ authRequired: true, validateParams: isGroupsCloseProps },
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

			await Meteor.call('hideRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.counters',
	{ authRequired: true, validateParams: isGroupsCountersProps },
	{
		async get() {
			const access = await hasPermission(this.userId, 'view-room-administration');
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

			if ('roomId' in params) {
				room = await Rooms.findOneById(params.roomId);
			} else if ('roomName' in params) {
				room = await Rooms.findOneByName(params.roomName);
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
				unreads = await MessageSync.countVisibleByRoomIdBetweenTimestampsInclusive(
					subscription.rid,
					subscription.ls || subscription.ts,
					lm,
				);
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
	{ authRequired: true, validateParams: isGroupsCreateProps },
	{
		async post() {
			if (!(await hasPermission(this.userId, 'create-p'))) {
				return API.v1.unauthorized();
			}

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

			const result = await Meteor.call(
				'createPrivateGroup',
				this.bodyParams.name,
				this.bodyParams.members ? this.bodyParams.members : [],
				readOnly,
				this.bodyParams.customFields,
				this.bodyParams.extraData,
			);

			const room = await Rooms.findOneById(result.rid, { projection: API.v1.defaultFieldsToExclude });

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
	'groups.delete',
	{ authRequired: true, validateParams: isGroupsDeleteProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
				checkedArchived: false,
			});

			await Meteor.call('eraseRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.files',
	{ authRequired: true, validateParams: isGroupsFilesProps },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
				checkedArchived: false,
			});

			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

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
	{ authRequired: true, validateParams: isGroupsGetIntegrationsProps },
	{
		async get() {
			if (
				!(await hasAtLeastOnePermission(this.userId, [
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

			const { offset, count } = this.getPaginationItems();
			const { sort, fields: projection, query } = this.parseJsonQuery();

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
	{ authRequired: true, validateParams: isGroupsHistoryProps },
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

			const result = await Meteor.call('getChannelHistory', {
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
	{ authRequired: true, validateParams: isGroupsInfoProps },
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
	{ authRequired: true, validateParams: isGroupsInviteProps },
	{
		async post() {
			const roomId = 'roomId' in this.bodyParams && this.bodyParams.roomId;
			const roomName = 'roomName' in this.bodyParams && this.bodyParams.roomName;
			const idOrName = roomId || roomName;
			const { _id: rid, t: type } = (await RoomSync.findOneByIdOrName(idOrName)) || {};

			if (!rid || type !== 'p') {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			const users = await getUserListFromParams(this.bodyParams);

			if (!users.length) {
				throw new Meteor.Error('error-empty-invite-list', 'Cannot invite if no valid users are provided');
			}

			await Meteor.call('addUsersToRoom', { rid, users: users.map((u) => u.username) });

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
	{ authRequired: true, validateParams: isGroupsKickProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.call('removeUserFromRoom', { rid: findResult.rid, username: user.username });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.leave',
	{ authRequired: true, validateParams: isGroupsLeaveProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('leaveRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

// List Private Groups a user has access to
API.v1.addRoute(
	'groups.list',
	{ authRequired: true, validateParams: isGroupsListProps },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields } = this.parseJsonQuery();

			const subs = await Subscriptions.findByUserIdAndTypes(this.userId, ['p'], { projection: { rid: 1 } }).toArray();
			const rids = subs.map(({ rid }) => rid).filter(Boolean);

			if (rids.length === 0) {
				return API.v1.notFound();
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
	{ authRequired: true, validateParams: isGroupsListProps },
	{
		async get() {
			if (!(await hasPermission(this.userId, 'view-room-administration'))) {
				return API.v1.unauthorized();
			}
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();
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
	{ authRequired: true, validateParams: isGroupsMembersProps },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
			});

			if (findResult.broadcast && !(await hasPermission(this.userId, 'view-broadcast-member-list', findResult.rid))) {
				return API.v1.unauthorized();
			}

			const { offset: skip, count: limit } = this.getPaginationItems();
			const { sort = {} } = this.parseJsonQuery();

			const { status, filter } = this.queryParams;

			const { cursor, totalCount } = await findUsersOfRoom({
				rid: findResult.rid,
				...(status && { status: { $in: status } }),
				skip,
				limit,
				filter,
				...(sort?.username && { sort: { username: sort.username } }),
			});

			const [members, total] = await Promise.all([cursor.toArray(), totalCount]);

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
	{ authRequired: true, validateParams: isGroupsMessageProps },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
			});
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

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
	{ authRequired: true, validateParams: isGroupsOnlineProps },
	{
		async get() {
			const { query } = this.parseJsonQuery();
			if (!query || Object.keys(query).length === 0) {
				return API.v1.failure('Invalid query');
			}

			const ourQuery = Object.assign({}, query, { t: 'p' });

			const room = await Rooms.findOne(ourQuery as Record<string, any>);

			if (!room) {
				return API.v1.failure('Group does not exists');
			}
			const user = await getLoggedInUser(this.request.headers['x-auth-token'] as string, this.request.headers['x-user-id'] as string);

			if (!user) {
				return API.v1.failure('User does not exists');
			}

			if (!(await canAccessRoom(room, user))) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}

			const online: Pick<IUser, '_id' | 'username'>[] = await UsersSync.findUsersNotOffline({
				fields: {
					username: 1,
				},
			}).fetch();

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
	{ authRequired: true, validateParams: isGroupsOpenProps },
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

			await Meteor.call('openRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeModerator',
	{ authRequired: true, validateParams: isGroupsRemoveModeratorProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.call('removeRoomModerator', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeOwner',
	{ authRequired: true, validateParams: isGroupsRemoveOwnerProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.call('removeRoomOwner', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeLeader',
	{ authRequired: true, validateParams: isGroupsRemoveLeaderProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.call('removeRoomLeader', findResult.rid, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.rename',
	{ authRequired: true, validateParams: isGroupsRenameProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('saveRoomSettings', findResult.rid, 'roomName', this.bodyParams.name);

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
	{ authRequired: true, validateParams: isGroupsSetCustomFieldsProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('saveRoomSettings', findResult.rid, 'roomCustomFields', this.bodyParams.customFields);

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
	{ authRequired: true, validateParams: isGroupsSetDescriptionProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.description);

			return API.v1.success({
				description: this.bodyParams.description,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setPurpose',
	{ authRequired: true, validateParams: isGroupsSetPurposeProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.purpose);

			return API.v1.success({
				purpose: this.bodyParams.purpose,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setReadOnly',
	{ authRequired: true, validateParams: isGroupsSetReadOnlyProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			if (findResult.ro === this.bodyParams.readOnly) {
				return API.v1.failure('The private group read only setting is the same as what it would be changed to.');
			}

			await Meteor.call('saveRoomSettings', findResult.rid, 'readOnly', this.bodyParams.readOnly);

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
	{ authRequired: true, validateParams: isGroupsSetTopicProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);

			return API.v1.success({
				topic: this.bodyParams.topic,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setType',
	{ authRequired: true, validateParams: isGroupsSetTypeProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			if (findResult.t === this.bodyParams.type) {
				return API.v1.failure('The private group type is the same as what it would be changed to.');
			}

			await Meteor.call('saveRoomSettings', findResult.rid, 'roomType', this.bodyParams.type);

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
	{ authRequired: true, validateParams: isGroupsSetAnnouncementProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('saveRoomSettings', findResult.rid, 'roomAnnouncement', this.bodyParams.announcement);

			return API.v1.success({
				announcement: this.bodyParams.announcement,
			});
		},
	},
);

API.v1.addRoute(
	'groups.unarchive',
	{ authRequired: true, validateParams: isGroupsUnarchiveProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
				checkedArchived: false,
			});

			await Meteor.call('unarchiveRoom', findResult.rid);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.roles',
	{ authRequired: true, validateParams: isGroupsRolesProps },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
			});

			const roles = await Meteor.call('getRoomRoles', findResult.rid);

			return API.v1.success({
				roles,
			});
		},
	},
);

API.v1.addRoute(
	'groups.moderators',
	{ authRequired: true, validateParams: isGroupsModeratorsProps },
	{
		async get() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.queryParams,
				userId: this.userId,
			});

			const moderators = await SubscriptionsSync.findByRoomIdAndRoles(findResult.rid, ['moderator'], {
				fields: { u: 1 },
			})
				.fetch()
				.map((sub: any) => sub.u);

			return API.v1.success({
				moderators,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setEncrypted',
	{ authRequired: true, validateParams: isGroupsSetEncryptedProps },
	{
		async post() {
			const findResult = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			await Meteor.call('saveRoomSettings', findResult.rid, 'encrypted', this.bodyParams.encrypted);

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
	{ authRequired: true, validateParams: isGroupsConvertToTeamProps },
	{
		async post() {
			const room = await findPrivateGroupByIdOrName({
				params: this.bodyParams,
				userId: this.userId,
			});

			if (!room) {
				return API.v1.failure('Private group not found');
			}

			if (!(await hasAllPermission(this.userId, ['create-team', 'edit-room'], room.rid))) {
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
