import { Team, Room } from '@rocket.chat/core-services';
import { TeamType, type IRoom, type ISubscription, type IUser, type RoomType, type UserStatus } from '@rocket.chat/core-typings';
import { Integrations, Messages, Rooms, Subscriptions, Uploads, Users } from '@rocket.chat/models';
import {
	ajv,
	ajvQuery,
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
	isChannelsGetIntegrationsProps,
	isChannelsModeratorsProps,
	isChannelsConvertToTeamProps,
	isChannelsSetReadOnlyProps,
	isChannelsDeleteProps,
	isChannelsListProps,
	isChannelsFilesListProps,
	isChannelsOnlineProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import { isTruthy } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';

import { eraseRoom } from '../../../../server/lib/eraseRoom';
import { findUsersOfRoom } from '../../../../server/lib/findUsersOfRoom';
import { openRoom } from '../../../../server/lib/openRoom';
import { addAllUserToRoomFn } from '../../../../server/methods/addAllUserToRoom';
import { addRoomLeader } from '../../../../server/methods/addRoomLeader';
import { addRoomModerator } from '../../../../server/methods/addRoomModerator';
import { addRoomOwner } from '../../../../server/methods/addRoomOwner';
import { hideRoomMethod } from '../../../../server/methods/hideRoom';
import { removeRoomLeader } from '../../../../server/methods/removeRoomLeader';
import { removeRoomModerator } from '../../../../server/methods/removeRoomModerator';
import { removeRoomOwner } from '../../../../server/methods/removeRoomOwner';
import { removeUserFromRoomMethod } from '../../../../server/methods/removeUserFromRoom';
import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { saveRoomSettings } from '../../../channel-settings/server/methods/saveRoomSettings';
import { mountIntegrationQueryBasedOnPermissions } from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { addUsersToRoomMethod } from '../../../lib/server/methods/addUsersToRoom';
import { executeArchiveRoom } from '../../../lib/server/methods/archiveRoom';
import { createChannelMethod } from '../../../lib/server/methods/createChannel';
import { getChannelHistory } from '../../../lib/server/methods/getChannelHistory';
import { executeGetRoomRoles } from '../../../lib/server/methods/getRoomRoles';
import { leaveRoomMethod } from '../../../lib/server/methods/leaveRoom';
import { executeUnarchiveRoom } from '../../../lib/server/methods/unarchiveRoom';
import { getUserMentionsByChannel } from '../../../mentions/server/methods/getUserMentionsByChannel';
import { settings } from '../../../settings/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { addUserToFileObj } from '../helpers/addUserToFileObj';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
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

type ChannelsInfoParams = { roomId: string } | { roomName: string };

const isChannelsInfoProps = ajvQuery.compile<ChannelsInfoParams>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
});

const channelsInfoResponse = ajv.compile<{ channel: IRoom; success: true }>({
	type: 'object',
	properties: {
		channel: {
			type: 'object',
			additionalProperties: true,
		},
		success: {
			type: 'boolean',
			enum: [true],
		},
	},
	required: ['channel', 'success'],
	additionalProperties: false,
});

type ChannelsCountersProps = ({ roomId: string } | { roomName: string }) & {
	userId?: string;
};

const isChannelsCountersProps = ajvQuery.compile<ChannelsCountersProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: { type: 'string' },
				userId: { type: 'string', nullable: true },
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: { type: 'string' },
				userId: { type: 'string', nullable: true },
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
});

const channelsCountersResponse = ajv.compile<{
	joined: boolean;
	members: number | null;
	unreads: number | null;
	unreadsFrom: string | null;
	msgs: number | null;
	latest: string | null;
	userMentions: number | null;
	success: true;
}>({
	type: 'object',
	properties: {
		joined: { type: 'boolean' },
		members: { type: 'number', nullable: true },
		unreads: { type: 'number', nullable: true },
		unreadsFrom: { type: 'string', nullable: true },
		msgs: { type: 'number', nullable: true },
		latest: { type: 'string', nullable: true },
		userMentions: { type: 'number', nullable: true },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['joined', 'members', 'unreads', 'unreadsFrom', 'msgs', 'latest', 'userMentions', 'success'],
	additionalProperties: false,
});

type ChannelsMembersProps =
	| {
			roomId: string;
			status?: string[];
			filter?: string;
			query?: string;
			sort?: string;
			count?: number;
			offset?: number;
	  }
	| {
			roomName: string;
			status?: string[];
			filter?: string;
			query?: string;
			sort?: string;
			count?: number;
			offset?: number;
	  };

const isChannelsMembersProps = ajvQuery.compile<ChannelsMembersProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: { type: 'string' },
				status: { type: 'array', items: { type: 'string' } },
				filter: { type: 'string' },
				query: { type: 'string' },
				sort: { type: 'string' },
				count: { type: 'number' },
				offset: { type: 'number' },
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: { type: 'string' },
				status: { type: 'array', items: { type: 'string' } },
				filter: { type: 'string' },
				query: { type: 'string' },
				sort: { type: 'string' },
				count: { type: 'number' },
				offset: { type: 'number' },
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
});

const channelsMembersResponse = ajv.compile<{
	members: object[];
	count: number;
	offset: number;
	total: number;
	success: true;
}>({
	type: 'object',
	properties: {
		members: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: true,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['members', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const channelsRolesResponse = ajv.compile<{
	roles: {
		_id: string;
		rid: string;
		u: {
			_id: string;
			username: string;
		};
		roles: string[];
	}[];
	success: true;
}>({
	type: 'object',
	properties: {
		roles: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					rid: { type: 'string' },
					u: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							username: { type: 'string' },
							name: { type: 'string', nullable: true },
						},
						required: ['_id', 'username'],
						additionalProperties: false,
					},
					roles: {
						type: 'array',
						items: { type: 'string' },
					},
				},
				required: ['_id', 'rid', 'u', 'roles'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['roles', 'success'],
	additionalProperties: false,
});

const channelsOnlineResponse = ajv.compile<{
	online: {
		_id: string;
		username: string;
	}[];
	success: true;
}>({
	type: 'object',
	properties: {
		online: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					username: { type: 'string' },
				},
				required: ['_id', 'username'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['online', 'success'],
	additionalProperties: false,
});

const channelsModeratorsResponse = ajv.compile<{
	moderators: {
		_id: string;
		username: string;
		name?: string | null;
	}[];
	success: true;
}>({
	type: 'object',
	properties: {
		moderators: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					username: { type: 'string' },
					name: { type: 'string', nullable: true },
				},
				required: ['_id', 'username'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['moderators', 'success'],
	additionalProperties: false,
});

const channelsGetAllUserMentionsByChannelResponse = ajv.compile<{
	mentions: object[];
	count: number;
	offset: number;
	total: number;
	success: true;
}>({
	type: 'object',
	properties: {
		mentions: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: true,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['mentions', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const channelsFilesResponse = ajv.compile<{
	files: object[];
	count: number;
	offset: number;
	total: number;
	success: true;
}>({
	type: 'object',
	properties: {
		files: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: true,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['files', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const channelsListResponse = ajv.compile<{
	channels: object[];
	count: number;
	offset: number;
	total: number;
	success: true;
}>({
	type: 'object',
	properties: {
		channels: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: true,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['channels', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const channelsGetIntegrationsResponse = ajv.compile<{
	integrations: object[];
	count: number;
	offset: number;
	total: number;
	success: true;
}>({
	type: 'object',
	properties: {
		integrations: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: true,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['integrations', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const isChannelsListJoinedProps = ajvQuery.compile<{
	_id?: string;
	roomId?: string;
	query?: string;
	count?: number;
	offset?: number;
	sort?: string;
}>({
	type: 'object',
	properties: {
		_id: { type: 'string', nullable: true },
		roomId: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: false,
});

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

			await addAllUserToRoomFn(this.userId, findResult._id, activeUsersOnly === 'true' || activeUsersOnly === 1);

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

			await executeArchiveRoom(this.userId, findResult._id);

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

			await executeUnarchiveRoom(this.userId, findResult._id);

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

			const result = await getChannelHistory({
				rid: findResult._id,
				fromUserId: this.userId,
				latest: latest ? new Date(latest) : new Date(),
				oldest: oldest ? new Date(oldest) : undefined,
				inclusive: inclusive === 'true',
				offset,
				count,
				unreads: unreads === 'true',
				showThreadMessages: showThreadMessages === 'true',
			});

			if (!result) {
				return API.v1.forbidden();
			}

			return API.v1.success(result);
		},
	},
);

const channelsRolesEndpoint = API.v1.get(
	'channels.roles',
	{
		authRequired: true,
		query: isChannelsRolesProps,
		response: {
			200: channelsRolesResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.queryParams });

		const roles = await executeGetRoomRoles(findResult._id, this.user);

		return API.v1.success({
			roles,
		});
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
		permissionsRequired: ['view-c-room'],
	},
	{
		async get() {
			const { roomId, mentionIds, starredIds, pinned } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const findResult = await findChannelByIdOrName({
				params: { roomId },
				checkedArchived: false,
			});

			const parseIds = (ids: string | undefined, field: string) =>
				typeof ids === 'string' && ids ? { [field]: { $in: ids.split(',').map((id) => id.trim()) } } : {};

			const ourQuery = {
				...query,
				rid: findResult._id,
				...parseIds(mentionIds, 'mentions._id'),
				...parseIds(starredIds, 'starred._id'),
				...(pinned?.toLowerCase() === 'true' ? { pinned: true } : {}),
				_hidden: { $ne: true },
			};

			if (!(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
				return API.v1.forbidden();
			}

			// Special check for the permissions
			if (
				(await hasPermissionAsync(this.userId, 'view-joined-room')) &&
				!(await Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId, { projection: { _id: 1 } }))
			) {
				return API.v1.forbidden();
			}

			const { cursor, totalCount } = Messages.findPaginated(ourQuery, {
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

			await openRoom(this.userId, findResult._id);

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

const channelsGetAllUserMentionsByChannelEndpoint = API.v1.get(
	'channels.getAllUserMentionsByChannel',
	{
		authRequired: true,
		query: isChannelsGetAllUserMentionsByChannelProps,
		response: {
			200: channelsGetAllUserMentionsByChannelResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomId } = this.queryParams;
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();

		const mentions = await getUserMentionsByChannel(this.userId, roomId, {
			sort: sort || { ts: 1 },
			skip: offset,
			limit: count,
		});

		const allMentions = await getUserMentionsByChannel(this.userId, roomId, {});

		return API.v1.success({
			mentions,
			count: mentions.length,
			offset,
			total: allMentions.length,
		});
	},
);

const channelsModeratorsEndpoint = API.v1.get(
	'channels.moderators',
	{
		authRequired: true,
		query: isChannelsModeratorsProps,
		response: {
			200: channelsModeratorsResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { ...params } = this.queryParams;

		const findResult = await findChannelByIdOrName({ params });

		if (!(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
			return API.v1.forbidden();
		}

		const moderators = await Subscriptions.findByRoomIdAndRoles(findResult._id, ['moderator'], {
			projection: { u: 1, _id: 0 },
		})
			.map((sub) => sub.u)
			.toArray();

		return API.v1.success({
			moderators,
		});
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

			await eraseRoom(room._id, this.user);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'channels.convertToTeam',
	{
		authRequired: true,
		validateParams: isChannelsConvertToTeamProps,
		permissionsRequired: ['create-team'],
	},
	{
		async post() {
			const { channelId, channelName } = this.bodyParams;

			if (!channelId && !channelName) {
				return API.v1.failure('The parameter "channelId" or "channelName" is required');
			}

			if (channelId && !(await hasPermissionAsync(this.userId, 'edit-room', channelId))) {
				return API.v1.forbidden();
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

			await addRoomModerator(this.userId, findResult._id, user._id);

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

			await addRoomOwner(this.userId, findResult._id, user._id);

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

const channelsCountersEndpoint = API.v1.get(
	'channels.counters',
	{
		authRequired: true,
		query: isChannelsCountersProps,
		response: {
			200: channelsCountersResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
				return API.v1.forbidden();
			}
			user = userId;
		}
		const room = await findChannelByIdOrName({
			params: this.queryParams,
		});
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user);
		const lm = room.lm ? room.lm : room._updatedAt;

		if (subscription?.open) {
			unreads = await Messages.countVisibleByRoomIdBetweenTimestampsInclusive(subscription.rid, subscription.ls ?? new Date(0), lm);
			unreadsFrom = subscription.ls || subscription.ts;
			userMentions = subscription.userMentions;
			joined = true;
		}

		if (access || joined) {
			msgs = room.msgs;
			latest = lm;
			members = await Users.countActiveUsersInNonDMRoom(room._id);
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
);

async function createChannelValidator(params: {
	user: { value: string };
	name?: { key: string; value?: string };
	members?: { key: string; value?: string[] };
	customFields?: { key: string; value?: string };
	teams?: { key: string; value?: string[] };
	teamId?: { key: string; value?: string };
}) {
	const teamId = params.teamId?.value;

	const team = teamId && (await Team.getInfoById(teamId));
	if (
		(!teamId && !(await hasPermissionAsync(params.user.value, 'create-c'))) ||
		(teamId && team && !(await hasPermissionAsync(params.user.value, 'create-team-channel', team.roomId)))
	) {
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
					teamId: {
						value: bodyParams.extraData?.teamId,
						key: 'teamId',
					},
				});
			} catch (e: any) {
				if (e.message === 'unauthorized') {
					error = API.v1.forbidden();
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

const channelsFilesEndpoint = API.v1.get(
	'channels.files',
	{
		authRequired: true,
		query: isChannelsFilesListProps,
		response: {
			200: channelsFilesResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { typeGroup, name, roomId, roomName, onlyConfirmed } = this.queryParams;

		const findResult = await findChannelByIdOrName({
			params: {
				...(roomId ? { roomId } : {}),
				...(roomName ? { roomName } : {}),
			},
			checkedArchived: false,
		});

		if (!(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
			return API.v1.forbidden();
		}

		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		const filter = {
			rid: findResult._id,
			...query,
			...(name ? { name: { $regex: name || '', $options: 'i' } } : {}),
			...(typeGroup ? { typeGroup } : {}),
			...(onlyConfirmed && { expiresAt: { $exists: false } }),
		};

		const { cursor, totalCount } = await Uploads.findPaginatedWithoutThumbs(filter, {
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
);

const channelsGetIntegrationsEndpoint = API.v1.get(
	'channels.getIntegrations',
	{
		authRequired: true,
		query: isChannelsGetIntegrationsProps,
		permissionsRequired: {
			GET: {
				permissions: [
					'manage-outgoing-integrations',
					'manage-own-outgoing-integrations',
					'manage-incoming-integrations',
					'manage-own-incoming-integrations',
				],
				operation: 'hasAny',
			},
		},
		response: {
			200: channelsGetIntegrationsResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({
			params: this.queryParams,
			checkedArchived: false,
		});

		if (!(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
			return API.v1.forbidden();
		}

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
);

const channelsInfoEndpoint = API.v1.get(
	'channels.info',
	{
		authRequired: true,
		query: isChannelsInfoProps,
		response: {
			200: channelsInfoResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({
			params: this.queryParams,
			checkedArchived: false,
			userId: this.userId,
		});

		if (!(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
			return API.v1.forbidden();
		}

		return API.v1.success({
			channel: findResult,
		});
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

			await addUsersToRoomMethod(this.userId, { rid: findResult._id, users: users.map((u) => u.username).filter(isTruthy) }, this.user);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
			});
		},
	},
);

const channelsListEndpoint = API.v1.get(
	'channels.list',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['view-c-room', 'view-joined-room'], operation: 'hasAny' },
		},
		query: isChannelsListProps,
		response: {
			200: channelsListResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();
		const hasPermissionToSeeAllPublicChannels = await hasPermissionAsync(this.userId, 'view-c-room');

		const { _id } = this.queryParams;

		const ourQuery = {
			...query,
			...(_id ? { _id } : {}),
			t: 'c',
		};

		if (!hasPermissionToSeeAllPublicChannels) {
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

		const { cursor, totalCount } = Rooms.findPaginated(ourQuery, {
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
);

const channelsListJoinedEndpoint = API.v1.get(
	'channels.list.joined',
	{
		authRequired: true,
		query: isChannelsListJoinedProps,
		response: {
			200: channelsListResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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

		const { cursor, totalCount } = Rooms.findPaginatedByTypeAndIds('c', rids, {
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
);

const channelsMembersEndpoint = API.v1.get(
	'channels.members',
	{
		authRequired: true,
		query: isChannelsMembersProps,
		response: {
			200: channelsMembersResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({
			params: this.queryParams,
			checkedArchived: false,
		});

		if (!(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
			return API.v1.forbidden();
		}

		if (findResult.broadcast && !(await hasPermissionAsync(this.userId, 'view-broadcast-member-list', findResult._id))) {
			return API.v1.forbidden();
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
			...(status && { status: { $in: status as UserStatus[] } }),
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
);

const channelsOnlineEndpoint = API.v1.get(
	'channels.online',
	{
		authRequired: true,
		query: isChannelsOnlineProps,
		response: {
			200: channelsOnlineResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { query } = await this.parseJsonQuery();
		const { _id } = this.queryParams;

		if ((!query || Object.keys(query).length === 0) && !_id) {
			return API.v1.failure('Invalid query');
		}

		const filter = {
			...query,
			...(_id ? { _id } : {}),
			t: 'c',
		};

		const room = await Rooms.findOne(filter as Record<string, any>);
		if (!room) {
			return API.v1.failure('Channel does not exists');
		}

		if (!(await canAccessRoomAsync(room, this.user))) {
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
);

API.v1.addRoute(
	'channels.removeModerator',
	{ authRequired: true },
	{
		async post() {
			const findResult = await findChannelByIdOrName({ params: this.bodyParams });

			const user = await getUserFromParams(this.bodyParams);

			await removeRoomModerator(this.userId, findResult._id, user._id);

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

			await removeRoomOwner(this.userId, findResult._id, user._id);

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

			await addRoomLeader(this.userId, findResult._id, user._id);

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

			await removeRoomLeader(this.userId, findResult._id, user._id);

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
	{ authOrAnonRequired: true },
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

			// Public rooms of private teams should be accessible only by team members
			if (findResult.teamId) {
				const team = await Team.getOneById(findResult.teamId);
				if (team?.type === TeamType.PRIVATE) {
					if (!this.userId || !(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
						return API.v1.notFound('Room not found');
					}
				}
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

type ChannelsInfoEndpoint = ExtractRoutesFromAPI<typeof channelsInfoEndpoint>;
type ChannelsCountersEndpoint = ExtractRoutesFromAPI<typeof channelsCountersEndpoint>;
type ChannelsMembersEndpoint = ExtractRoutesFromAPI<typeof channelsMembersEndpoint>;
type ChannelsRolesEndpoint = ExtractRoutesFromAPI<typeof channelsRolesEndpoint>;
type ChannelsOnlineEndpoint = ExtractRoutesFromAPI<typeof channelsOnlineEndpoint>;
type ChannelsModeratorsEndpoint = ExtractRoutesFromAPI<typeof channelsModeratorsEndpoint>;
type ChannelsGetAllUserMentionsByChannelEndpoint = ExtractRoutesFromAPI<typeof channelsGetAllUserMentionsByChannelEndpoint>;
type ChannelsFilesEndpoint = ExtractRoutesFromAPI<typeof channelsFilesEndpoint>;
type ChannelsListJoinedEndpoint = ExtractRoutesFromAPI<typeof channelsListJoinedEndpoint>;
type ChannelsListEndpoint = ExtractRoutesFromAPI<typeof channelsListEndpoint>;
type ChannelsGetIntegrationsEndpoint = ExtractRoutesFromAPI<typeof channelsGetIntegrationsEndpoint>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints
		extends ChannelsInfoEndpoint,
			ChannelsCountersEndpoint,
			ChannelsMembersEndpoint,
			ChannelsRolesEndpoint,
			ChannelsOnlineEndpoint,
			ChannelsModeratorsEndpoint,
			ChannelsGetAllUserMentionsByChannelEndpoint,
			ChannelsFilesEndpoint,
			ChannelsListJoinedEndpoint,
			ChannelsListEndpoint,
			ChannelsGetIntegrationsEndpoint {}
}
