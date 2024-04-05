import { Team, Room } from '@rocket.chat/core-services';
import type { IRoom, ISubscription, IUser, RoomType } from '@rocket.chat/core-typings';
import { Integrations, Messages, Rooms, Subscriptions, Uploads, Users } from '@rocket.chat/models';
import {
	isChannelsAddAllProps,
	isChannelsArchiveProps,
	isChannelsHistoryProps,
	isChannelsUnarchiveProps,
	isChannelsRolesProps,
	isChannelsJoinProps,
	isChannelsKickProps,
	isChannelsLeaveProps,
	isChannelsMessagesProps,
	isChannelsOpenProps,
	isChannelsSetAnnouncementProps,
	isChannelsGetAllUserMentionsByChannelProps,
	isChannelsModeratorsProps,
	isChannelsConvertToTeamProps,
	isChannelsSetReadOnlyProps,
	isChannelsDeleteProps,
	isRoomsImagesProps,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { isTruthy } from '../../../../lib/isTruthy';
import { findUsersOfRoom } from '../../../../server/lib/findUsersOfRoom';
import { hideRoomMethod } from '../../../../server/methods/hideRoom';
import { removeUserFromRoomMethod } from '../../../../server/methods/removeUserFromRoom';
import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync, hasAtLeastOnePermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { saveRoomSettings } from '../../../channel-settings/server/methods/saveRoomSettings';
import { mountIntegrationQueryBasedOnPermissions } from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { addUsersToRoomMethod } from '../../../lib/server/methods/addUsersToRoom';
import { createChannelMethod } from '../../../lib/server/methods/createChannel';
import { leaveRoomMethod } from '../../../lib/server/methods/leaveRoom';
import { settings } from '../../../settings/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { addUserToFileObj } from '../helpers/addUserToFileObj';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
import { getLoggedInUser } from '../helpers/getLoggedInUser';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUserFromParams, getUserListFromParams } from '../helpers/getUserFromParams';

// Returns the channel IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
async function findChannelByIdOrName({
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
	userId?: string;
	checkedArchived?: boolean;
}): Promise<IRoom> {
	const projection = { ...API.v1.defaultFieldsToExclude };

	let room;
	if ('roomId' in params) {
		room = await Rooms.findOneById(params.roomId || '', { projection });
	} else if ('roomName' in params) {
		room = await Rooms.findOneByName(params.roomName || '', { projection });
	}

	if (!room || (room.t !== 'c' && room.t !== 'l')) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
	}

	if (checkedArchived && room.archived) {
		throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
	}
	if (userId && room.lastMessage) {
		const [lastMessage] = await normalizeMessagesForUser([room.lastMessage], userId);
		room.lastMessage = lastMessage;
	}

	return room;
}

API.v1.addRoute(
	'channels.addAll',
	{
		authRequired: true,
		validateParams: isChannelsAddAllProps,
	},
	{
		async post() {
			const { activeUsersOnly, ...params } = this.bodyParams;
			const findResult = await findChannelByIdOrName({ params, userId: this.userId });

			await Meteor.callAsync('addAllUserToRoom', findResult._id, activeUsersOnly);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.archive',
	{
		authRequired: true,
		validateParams: isChannelsArchiveProps,
	},
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			await Meteor.callAsync('archiveRoom', findResult._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.unarchive',
	{
		authRequired: true,
		validateParams: isChannelsUnarchiveProps,
	},
	{
		async post() {
			const findResult = await findChannelByIdOrName({
				params: this.bodyParams,
				checkedArchived: false,
			});

			if (!findResult.archived) {
				return API.v1.failure(`The channel, ${findResult.name}, is not archived`);
			}

			await Meteor.callAsync('unarchiveRoom', findResult._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.history',
	{
		authRequired: true,
		validateParams: isChannelsHistoryProps,
	},
	{
		async get() {
			const { unreads, oldest, latest, showThreadMessages, inclusive, ...params } = this.queryParams;
			const findResult = await findChannelByIdOrName({
				params,
				checkedArchived: false,
			});

			const { count = 20, offset = 0 } = await getPaginationItems(this.queryParams);

			const result = await Meteor.callAsync('getChannelHistory', {
				rid: findResult._id,
				latest: latest ? new Date(latest) : new Date(),
				oldest: oldest && new Date(oldest),
				inclusive: inclusive === 'true',
				offset,
				count,
				unreads: unreads === 'true',
				showThreadMessages: showThreadMessages === 'true',
			});

			if (!result) {
				return API.v1.unauthorized();
			}

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'channels.roles',
	{
		authRequired: true,
		validateParams: isChannelsRolesProps,
	},
	{
		async get() {
			const findResult = await findChannelByIdOrName({ params: this.queryParams });

			const roles = await Meteor.callAsync('getRoomRoles', findResult._id);

			return API.v1.success({
				roles,
			});
		},
	},
);

API.v1.addRoute(
	'channels.join',
	{
		authRequired: true,
		validateParams: isChannelsJoinProps,
	},
	{
		async post() {
			const { joinCode, ...params } = this.bodyParams;
			const findResult = await findChannelByIdOrName({ params });

			await Room.join({ room: findResult, user: this.user, joinCode });

			return API.v1.success({
				channel: await findChannelByIdOrName({ params, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.kick',
	{
		authRequired: true,
		validateParams: isChannelsKickProps,
	},
	{
		async post() {
			const { ...params /* userId */ } = this.bodyParams;
			const findResult = await findChannelByIdOrName({ params });

			const user = await getUserFromParams(this.bodyParams);
			if (!user?.username) {
				return API.v1.failure('Invalid user');
			}

			await removeUserFromRoomMethod(this.userId, { rid: findResult._id, username: user.username });

			return API.v1.success({
				channel: await findChannelByIdOrName({ params, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.leave',
	{
		authRequired: true,
		validateParams: isChannelsLeaveProps,
	},
	{
		async post() {
			const { ...params } = this.bodyParams;
			const findResult = await findChannelByIdOrName({ params });

			const user = await Users.findOneById(this.userId);
			if (!user) {
				return API.v1.failure('Invalid user');
			}
			await leaveRoomMethod(user, findResult._id);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.messages',
	{
		authRequired: true,
		validateParams: isChannelsMessagesProps,
	},
	{
		async get() {
			const { roomId } = this.queryParams;
			const findResult = await findChannelByIdOrName({
				params: { roomId },
				checkedArchived: false,
			});
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const ourQuery = { ...query, rid: findResult._id };

			// Special check for the permissions
			if (
				(await hasPermissionAsync(this.userId, 'view-joined-room')) &&
				!(await Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId, { projection: { _id: 1 } }))
			) {
				return API.v1.unauthorized();
			}
			if (!(await hasPermissionAsync(this.userId, 'view-c-room'))) {
				return API.v1.unauthorized();
			}

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

API.v1.addRoute(
	'channels.open',
	{
		authRequired: true,
		validateParams: isChannelsOpenProps,
	},
	{
		async post() {
			const { ...params } = this.bodyParams;

			const findResult = await findChannelByIdOrName({
				params,
				checkedArchived: false,
			});

			const sub = await Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

			if (!sub) {
				return API.v1.failure(`The user/callee is not in the channel "${findResult.name}".`);
			}

			if (sub.open) {
				return API.v1.failure(`The channel, ${findResult.name}, is already open to the sender`);
			}

			await Meteor.callAsync('openRoom', findResult._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.setReadOnly',
	{
		authRequired: true,
		validateParams: isChannelsSetReadOnlyProps,
	},
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			if (findResult.ro === this.bodyParams.readOnly) {
				return API.v1.failure('The channel read only setting is the same as what it would be changed to.');
			}

			await saveRoomSettings(this.userId, findResult._id, 'readOnly', this.bodyParams.readOnly);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.setAnnouncement',
	{
		authRequired: true,
		validateParams: isChannelsSetAnnouncementProps,
	},
	{
		async post() {
			const { announcement, ...params } = this.bodyParams;

			const findResult = await findChannelByIdOrName({ params });

			await saveRoomSettings(this.userId, findResult._id, 'roomAnnouncement', announcement);

			return API.v1.success({
				announcement: this.bodyParams.announcement,
			});
		},
	},
);

API.v1.addRoute(
	'channels.getAllUserMentionsByChannel',
	{
		authRequired: true,
		validateParams: isChannelsGetAllUserMentionsByChannelProps,
	},
	{
		async get() {
			const { roomId } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const mentions = await Meteor.callAsync('getUserMentionsByChannel', {
				roomId,
				options: {
					sort: sort || { ts: 1 },
					skip: offset,
					limit: count,
				},
			});

			const allMentions = await Meteor.callAsync('getUserMentionsByChannel', {
				roomId,
				options: {},
			});

			return API.v1.success({
				mentions,
				count: mentions.length,
				offset,
				total: allMentions.length,
			});
		},
	},
);

API.v1.addRoute(
	'channels.moderators',
	{
		authRequired: true,
		validateParams: isChannelsModeratorsProps,
	},
	{
		async get() {
			const { ...params } = this.queryParams;

			const findResult = await findChannelByIdOrName({ params });

			const moderators = (
				await Subscriptions.findByRoomIdAndRoles(findResult._id, ['moderator'], {
					projection: { u: 1 },
				}).toArray()
			).map((sub: ISubscription) => sub.u);

			return API.v1.success({
				moderators,
			});
		},
	},
);

API.v1.addRoute(
	'channels.delete',
	{
		authRequired: true,
		validateParams: isChannelsDeleteProps,
	},
	{
		async post() {
			const room = await findChannelByIdOrName({
				params: this.bodyParams,
				checkedArchived: false,
			});

			await Meteor.callAsync('eraseRoom', room._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.convertToTeam',
	{
		authRequired: true,
		validateParams: isChannelsConvertToTeamProps,
	},
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'create-team'))) {
				return API.v1.unauthorized();
			}

			const { channelId, channelName } = this.bodyParams;

			if (!channelId && !channelName) {
				return API.v1.failure('The parameter "channelId" or "channelName" is required');
			}

			if (channelId && !(await hasPermissionAsync(this.userId, 'edit-room', channelId))) {
				return API.v1.unauthorized();
			}

			const room = await findChannelByIdOrName({
				params: channelId !== undefined ? { roomId: channelId } : { roomName: channelName },
				userId: this.userId,
			});

			if (!room) {
				return API.v1.failure('Channel not found');
			}

			const subscriptions = await Subscriptions.findByRoomId(room._id, {
				projection: { 'u._id': 1 },
			});

			const members = (await subscriptions.toArray()).map((s: ISubscription) => s.u?._id);

			const teamData = {
				team: {
					name: room.name ?? '',
					type: room.t === 'c' ? 0 : 1,
				},
				members,
				room: {
					name: room.name,
					id: room._id,
				},
			};

			const team = await Team.create(this.userId, teamData);

			return API.v1.success({ team });
		},
	},
);

API.v1.addRoute(
	'channels.addModerator',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('addRoomModerator', findResult._id, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.addOwner',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('addRoomOwner', findResult._id, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.close',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({
				params: this.bodyParams,
				checkedArchived: false,
			});

			const sub = await Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

			if (!sub) {
				return API.v1.failure(`The user/callee is not in the channel "${findResult.name}.`);
			}

			if (!sub.open) {
				return API.v1.failure(`The channel, ${findResult.name}, is already closed to the sender`);
			}

			await hideRoomMethod(this.userId, findResult._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.counters',
	{ authRequired: true },
	{
		async get() {
			const access = await hasPermissionAsync(this.userId, 'view-room-administration');
			const { userId } = this.queryParams;
			let user = this.userId;
			let unreads = null;
			let userMentions = null;
			let unreadsFrom = null;
			let joined = false;
			let msgs = null;
			let latest = null;
			let members = null;

			if (userId) {
				if (!access) {
					return API.v1.unauthorized();
				}
				user = userId;
			}
			const room = await findChannelByIdOrName({
				params: this.queryParams,
			});
			const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user);
			const lm = room.lm ? room.lm : room._updatedAt;

			if (subscription?.open) {
				unreads = await Messages.countVisibleByRoomIdBetweenTimestampsInclusive(subscription.rid, subscription.ls, lm);
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

async function createChannelValidator(params: {
	user: { value: string };
	name?: { key: string; value?: string };
	members?: { key: string; value?: string[] };
	customFields?: { key: string; value?: string };
	teams?: { key: string; value?: string[] };
}) {
	if (!(await hasPermissionAsync(params.user.value, 'create-c'))) {
		throw new Error('unauthorized');
	}

	if (!params.name?.value) {
		throw new Error(`Param "${params.name?.key}" is required`);
	}

	if (params.members?.value && !Array.isArray(params.members.value)) {
		throw new Error(`Param "${params.members.key}" must be an array if provided`);
	}

	if (params.customFields?.value && !(typeof params.customFields.value === 'object')) {
		throw new Error(`Param "${params.customFields.key}" must be an object if provided`);
	}

	if (params.teams?.value && !Array.isArray(params.teams.value)) {
		throw new Error(`Param ${params.teams.key} must be an array`);
	}
}

async function createChannel(
	userId: string,
	params: {
		name?: string;
		members?: string[];
		customFields?: Record<string, any>;
		extraData?: Record<string, any>;
		readOnly?: boolean;
		excludeSelf?: boolean;
	},
): Promise<{ channel: IRoom }> {
	const readOnly = typeof params.readOnly !== 'undefined' ? params.readOnly : false;
	const id = await createChannelMethod(
		userId,
		params.name || '',
		params.members ? params.members : [],
		readOnly,
		params.customFields,
		params.extraData,
		params.excludeSelf,
	);

	return {
		channel: await findChannelByIdOrName({ params: { roomId: id.rid }, userId }),
	};
}

API.channels = {
	create: {
		validate: createChannelValidator,
		execute: createChannel,
	},
};

API.v1.addRoute(
	'channels.create',
	{ authRequired: true },
	{
		async post() {
			const { userId, bodyParams } = this;

			let error;

			try {
				await API.channels?.create.validate({
					user: {
						value: userId,
					},
					name: {
						value: bodyParams.name,
						key: 'name',
					},
					members: {
						value: bodyParams.members,
						key: 'members',
					},
					teams: {
						value: bodyParams.teams,
						key: 'teams',
					},
				});
			} catch (e: any) {
				if (e.message === 'unauthorized') {
					error = API.v1.unauthorized();
				} else {
					error = API.v1.failure(e.message);
				}
			}

			if (error) {
				return error;
			}

			if (bodyParams.teams) {
				const canSeeAllTeams = await hasPermissionAsync(this.userId, 'view-all-teams');
				const teams = await Team.listByNames(bodyParams.teams, { projection: { _id: 1 } });
				const teamMembers = [];

				for (const team of teams) {
					// eslint-disable-next-line no-await-in-loop
					const { records: members } = await Team.members(this.userId, team._id, canSeeAllTeams, {
						offset: 0,
						count: Number.MAX_SAFE_INTEGER,
					});
					const uids = members.map((member) => member.user.username);
					teamMembers.push(...uids);
				}

				const membersToAdd = new Set([...teamMembers, ...(bodyParams.members || [])]);
				bodyParams.members = [...membersToAdd].filter(Boolean) as string[];
			}

			return API.v1.success(await API.channels?.create.execute(userId, bodyParams));
		},
	},
);

API.v1.addRoute(
	'channels.files',
	{ authRequired: true },
	{
		async get() {
			const findResult = await findChannelByIdOrName({
				params: this.queryParams,
				checkedArchived: false,
			});

			if (!(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
				return API.v1.unauthorized();
			}

			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { rid: findResult._id });

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
	'channels.images',
	{ authRequired: true, validateParams: isRoomsImagesProps },
	{
		async get() {
			const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'teamId' | 'prid'>>(this.queryParams.roomId, {
				projection: { t: 1, teamId: 1, prid: 1 },
			});

			if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
				return API.v1.unauthorized();
			}

			let initialImage: IUpload | null = null;
			if (this.queryParams.startingFromId) {
				initialImage = await Uploads.findOneById(this.queryParams.startingFromId);
			}

			const { offset, count } = await getPaginationItems(this.queryParams);

			const { cursor, totalCount } = Uploads.findImagesByRoomId(room._id, initialImage?.uploadedAt, {
				skip: offset,
				limit: count,
			});

			const [files, total] = await Promise.all([cursor.toArray(), totalCount]);

			// If the initial image was not returned in the query, insert it as the first element of the list
			if (initialImage && !files.find(({ _id }) => _id === (initialImage as IUpload)._id)) {
				files.splice(0, 0, initialImage);
			}

			return API.v1.success({
				files,
				count,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'channels.getIntegrations',
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

			const findResult = await findChannelByIdOrName({
				params: this.queryParams,
				checkedArchived: false,
			});

			let includeAllPublicChannels = true;
			if (typeof this.queryParams.includeAllPublicChannels !== 'undefined') {
				includeAllPublicChannels = this.queryParams.includeAllPublicChannels === 'true';
			}

			let ourQuery: { channel: string | { $in: string[] } } = {
				channel: `#${findResult.name}`,
			};

			if (includeAllPublicChannels) {
				ourQuery.channel = {
					$in: [ourQuery.channel as string, 'all_public_channels'],
				};
			}

			const params = this.queryParams;
			const { offset, count } = await getPaginationItems(params);
			const { sort, fields: projection, query } = await this.parseJsonQuery();

			ourQuery = Object.assign(await mountIntegrationQueryBasedOnPermissions(this.userId), query, ourQuery);

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
	'channels.info',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success({
				channel: await findChannelByIdOrName({
					params: this.queryParams,
					checkedArchived: false,
					userId: this.userId,
				}),
			});
		},
	},
);

API.v1.addRoute(
	'channels.invite',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			const users = await getUserListFromParams(this.bodyParams);

			if (!users.length) {
				return API.v1.failure('invalid-user-invite-list', 'Cannot invite if no users are provided');
			}

			await addUsersToRoomMethod(this.userId, { rid: findResult._id, users: users.map((u) => u.username).filter(isTruthy) });

			return API.v1.success({
				channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();
			const hasPermissionToSeeAllPublicChannels = await hasPermissionAsync(this.userId, 'view-c-room');

			const ourQuery: Record<string, any> = { ...query, t: 'c' };

			if (!hasPermissionToSeeAllPublicChannels) {
				if (!(await hasPermissionAsync(this.userId, 'view-joined-room'))) {
					return API.v1.unauthorized();
				}
				const roomIds = (
					await Subscriptions.findByUserIdAndType(this.userId, 'c', {
						projection: { rid: 1 },
					}).toArray()
				).map((s) => s.rid);
				ourQuery._id = { $in: roomIds };
			}

			// teams filter - I would love to have a way to apply this filter @ db level :(
			const ids = (await Subscriptions.findByUserId(this.userId, { projection: { rid: 1 } }).toArray()).map(
				(item: Record<string, any>) => item.rid,
			);

			ourQuery.$or = [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: ids,
					},
				},
			];

			const { cursor, totalCount } = await Rooms.findPaginated(ourQuery, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				projection: fields,
			});

			const [channels, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				channels: await Promise.all(channels.map((room) => composeRoomWithLastMessage(room, this.userId))),
				count: channels.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'channels.list.joined',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields } = await this.parseJsonQuery();

			const subs = await Subscriptions.findByUserIdAndTypes(this.userId, ['c'], { projection: { rid: 1 } }).toArray();
			const rids = subs.map(({ rid }) => rid).filter(Boolean);

			if (rids.length === 0) {
				return API.v1.success({
					channels: [],
					offset,
					count: 0,
					total: 0,
				});
			}

			const { cursor, totalCount } = await Rooms.findPaginatedByTypeAndIds('c', rids, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				projection: fields,
			});

			const [channels, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				channels: await Promise.all(channels.map((room) => composeRoomWithLastMessage(room, this.userId))),
				offset,
				count: channels.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'channels.members',
	{ authRequired: true },
	{
		async get() {
			const findResult = await findChannelByIdOrName({
				params: this.queryParams,
				checkedArchived: false,
			});

			if (findResult.broadcast && !(await hasPermissionAsync(this.userId, 'view-broadcast-member-list', findResult._id))) {
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
				rid: findResult._id,
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
	'channels.online',
	{ authRequired: true },
	{
		async get() {
			const { query } = await this.parseJsonQuery();
			if (!query || Object.keys(query).length === 0) {
				return API.v1.failure('Invalid query');
			}

			const ourQuery = Object.assign({}, query, { t: 'c' });

			const room = await Rooms.findOne(ourQuery as Record<string, any>);
			if (!room) {
				return API.v1.failure('Channel does not exists');
			}

			const user = await getLoggedInUser(this.request);

			if (!room || !user || !(await canAccessRoomAsync(room, user))) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}

			const online: Pick<IUser, '_id' | 'username'>[] = await Users.findUsersNotOffline({
				projection: { username: 1 },
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
	'channels.removeModerator',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('removeRoomModerator', findResult._id, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.removeOwner',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('removeRoomOwner', findResult._id, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.rename',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.name?.trim()) {
				return API.v1.failure('The bodyParam "name" is required');
			}

			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			if (findResult.name === this.bodyParams.name) {
				return API.v1.failure('The channel name is the same as what it would be renamed to.');
			}

			await saveRoomSettings(this.userId, findResult._id, 'roomName', this.bodyParams.name);

			return API.v1.success({
				channel: await findChannelByIdOrName({
					params: this.bodyParams,
					userId: this.userId,
				}),
			});
		},
	},
);

API.v1.addRoute(
	'channels.setCustomFields',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.customFields || !(typeof this.bodyParams.customFields === 'object')) {
				return API.v1.failure('The bodyParam "customFields" is required with a type like object.');
			}

			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			await saveRoomSettings(this.userId, findResult._id, 'roomCustomFields', this.bodyParams.customFields);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.setDefault',
	{ authRequired: true },
	{
		async post() {
			if (typeof this.bodyParams.default === 'undefined') {
				return API.v1.failure('The bodyParam "default" is required', 'error-channels-setdefault-is-same');
			}

			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			if (findResult.default === this.bodyParams.default) {
				return API.v1.failure(
					'The channel default setting is the same as what it would be changed to.',
					'error-channels-setdefault-missing-default-param',
				);
			}

			await saveRoomSettings(
				this.userId,
				findResult._id,
				'default',
				['true', '1'].includes(this.bodyParams.default.toString().toLowerCase()),
			);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.setDescription',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.hasOwnProperty('description')) {
				return API.v1.failure('The bodyParam "description" is required');
			}

			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			if (findResult.description === this.bodyParams.description) {
				return API.v1.failure('The channel description is the same as what it would be changed to.');
			}

			await saveRoomSettings(this.userId, findResult._id, 'roomDescription', this.bodyParams.description || '');

			return API.v1.success({
				description: this.bodyParams.description || '',
			});
		},
	},
);

API.v1.addRoute(
	'channels.setPurpose',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.hasOwnProperty('purpose')) {
				return API.v1.failure('The bodyParam "purpose" is required');
			}

			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			if (findResult.description === this.bodyParams.purpose) {
				return API.v1.failure('The channel purpose (description) is the same as what it would be changed to.');
			}

			await saveRoomSettings(this.userId, findResult._id, 'roomDescription', this.bodyParams.purpose || '');

			return API.v1.success({
				purpose: this.bodyParams.purpose || '',
			});
		},
	},
);

API.v1.addRoute(
	'channels.setTopic',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.hasOwnProperty('topic')) {
				return API.v1.failure('The bodyParam "topic" is required');
			}

			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			if (findResult.topic === this.bodyParams.topic) {
				return API.v1.failure('The channel topic is the same as what it would be changed to.');
			}

			await saveRoomSettings(this.userId, findResult._id, 'roomTopic', this.bodyParams.topic || '');

			return API.v1.success({
				topic: this.bodyParams.topic || '',
			});
		},
	},
);

API.v1.addRoute(
	'channels.setType',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.type?.trim()) {
				return API.v1.failure('The bodyParam "type" is required');
			}

			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			if (findResult.t === this.bodyParams.type) {
				return API.v1.failure('The channel type is the same as what it would be changed to.');
			}

			await saveRoomSettings(this.userId, findResult._id, 'roomType', this.bodyParams.type as RoomType);

			const room = await Rooms.findOneById(findResult._id, { projection: API.v1.defaultFieldsToExclude });

			if (!room) {
				return API.v1.failure('The channel does not exist');
			}

			return API.v1.success({
				channel: await composeRoomWithLastMessage(room, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'channels.addLeader',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('addRoomLeader', findResult._id, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.removeLeader',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			const user = await getUserFromParams(this.bodyParams);

			await Meteor.callAsync('removeRoomLeader', findResult._id, user._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.setJoinCode',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.joinCode?.trim()) {
				return API.v1.failure('The bodyParam "joinCode" is required');
			}

			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			await saveRoomSettings(this.userId, findResult._id, 'joinCode', this.bodyParams.joinCode);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'channels.anonymousread',
	{ authRequired: false },
	{
		async get() {
			const findResult = await findChannelByIdOrName({
				params: this.queryParams,
				checkedArchived: false,
			});
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { rid: findResult._id });

			if (!settings.get<boolean>('Accounts_AllowAnonymousRead')) {
				throw new Meteor.Error('error-not-allowed', 'Enable "Allow Anonymous Read"', {
					method: 'channels.anonymousread',
				});
			}

			const { cursor, totalCount } = await Messages.findPaginated(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				projection: fields,
			});

			const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				messages: await normalizeMessagesForUser(messages, this.userId || ''),
				count: messages.length,
				offset,
				total,
			});
		},
	},
);
