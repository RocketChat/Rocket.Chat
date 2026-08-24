import { Team, Room } from '@rocket.chat/core-services';
import {
	TeamType,
	isRoomNativeFederated,
	type IIntegration,
	type IMessage,
	type IRoom,
	type ISubscription,
	type ITeam,
	type IUploadWithUser,
	type IUser,
	type RoomType,
	type UserStatus,
} from '@rocket.chat/core-typings';
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
	isChannelsCreateProps,
	isChannelsSetReadOnlyProps,
	isChannelsDeleteProps,
	isChannelsListProps,
	isChannelsFilesListProps,
	isChannelsOnlineProps,
	ajv,
	ajvQuery,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { isTruthy } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';

import { canAccessRoomAsync } from '../../lib/authorization';
import { hasAllPermissionAsync, hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { eraseRoom } from '../../lib/eraseRoom';
import { findUsersOfRoom } from '../../lib/findUsersOfRoom';
import { mountIntegrationQueryBasedOnPermissions } from '../../lib/integrations/lib/mountQueriesBasedOnPermission';
import { openRoom } from '../../lib/openRoom';
import { normalizeMessagesForUser } from '../../lib/utils/lib/normalizeMessagesForUser';
import { getChannelHistory } from '../../meteor-methods/messages/getChannelHistory';
import { getUserMentionsByChannel } from '../../meteor-methods/messages/getUserMentionsByChannel';
import { addAllUserToRoomFn } from '../../meteor-methods/rooms/addAllUserToRoom';
import { addRoomLeader } from '../../meteor-methods/rooms/addRoomLeader';
import { addRoomModerator } from '../../meteor-methods/rooms/addRoomModerator';
import { addRoomOwner } from '../../meteor-methods/rooms/addRoomOwner';
import { addUsersToRoomMethod } from '../../meteor-methods/rooms/addUsersToRoom';
import { executeArchiveRoom } from '../../meteor-methods/rooms/archiveRoom';
import { createChannelMethod } from '../../meteor-methods/rooms/createChannel';
import { executeGetRoomRoles } from '../../meteor-methods/rooms/getRoomRoles';
import { hideRoomMethod } from '../../meteor-methods/rooms/hideRoom';
import { leaveRoomMethod } from '../../meteor-methods/rooms/leaveRoom';
import { removeRoomLeader } from '../../meteor-methods/rooms/removeRoomLeader';
import { removeRoomModerator } from '../../meteor-methods/rooms/removeRoomModerator';
import { removeRoomOwner } from '../../meteor-methods/rooms/removeRoomOwner';
import { removeUserFromRoomMethod } from '../../meteor-methods/rooms/removeUserFromRoom';
import { saveRoomSettings } from '../../meteor-methods/rooms/saveRoomSettings';
import { executeUnarchiveRoom } from '../../meteor-methods/rooms/unarchiveRoom';
import { settings } from '../../settings';
import { API } from '../api';
import { addUserToFileObj } from '../lib/addUserToFileObj';
import { composeRoomWithLastMessage } from '../lib/composeRoomWithLastMessage';
import { getPaginationItems } from '../lib/getPaginationItems';
import { getUserFromParams, getUserListFromParams, getUsernameListFromParams } from '../lib/getUserFromParams';

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

const channelResponseSchema = ajv.compile<{ channel: IRoom }>({
	type: 'object',
	properties: {
		channel: { $ref: '#/components/schemas/IRoom' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['channel', 'success'],
	additionalProperties: false,
});

// channels.info also serves omnichannel ('l') rooms (e.g. livechat test helpers call it), which lack the
// owner `u` that IRoom requires. Accept a full IRoom or any room-shaped object so both types validate.
const channelInfoResponseSchema = ajv.compile<{ channel: IRoom }>({
	type: 'object',
	properties: {
		channel: {
			anyOf: [{ $ref: '#/components/schemas/IRoom' }, { type: 'object', required: ['_id', 't'], additionalProperties: true }],
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['channel', 'success'],
	additionalProperties: false,
});

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const stringFieldResponseSchema = <T>(field: 'description' | 'purpose' | 'topic') =>
	ajv.compile<T>({
		type: 'object',
		properties: {
			[field]: { type: 'string' },
			success: { type: 'boolean', enum: [true] },
		},
		required: [field, 'success'],
		additionalProperties: false,
	});

const descriptionResponseSchema = stringFieldResponseSchema<{ description: string }>('description');
const purposeResponseSchema = stringFieldResponseSchema<{ purpose: string }>('purpose');
const topicResponseSchema = stringFieldResponseSchema<{ topic: string }>('topic');

const roomSettingBody = <T>(field: string, fieldSchema: Record<string, unknown>) =>
	ajv.compile<T>({
		type: 'object',
		properties: {
			roomId: { type: 'string' },
			roomName: { type: 'string' },
			[field]: fieldSchema,
		},
		required: [field],
		anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
		additionalProperties: false,
	});

// Body validator for POSTs targeting a single room (roomId or roomName) with no other required field.
const roomTargetBody = <T>() =>
	ajv.compile<T>({
		type: 'object',
		properties: {
			roomId: { type: 'string' },
			roomName: { type: 'string' },
		},
		anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
		additionalProperties: false,
	});

// Query validator for GETs targeting a single room (roomId or roomName).
const roomTargetQuery = ajvQuery.compile<{ roomId?: string; roomName?: string }>({
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		roomName: { type: 'string' },
	},
	anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	additionalProperties: false,
});

const channelsListResponseSchema = ajv.compile<{ channels: IRoom[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		channels: { type: 'array', items: { $ref: '#/components/schemas/IRoom' } },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['channels', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'channels.addAll',
	{
		authRequired: true,
		body: isChannelsAddAllProps,
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { activeUsersOnly, ...params } = this.bodyParams;
		const findResult = await findChannelByIdOrName({ params, userId: this.userId });

		await addAllUserToRoomFn(this.userId, findResult._id, activeUsersOnly === 'true' || activeUsersOnly === 1);

		return API.v1.success({
			channel: await findChannelByIdOrName({ params, userId: this.userId }),
		});
	},
);

API.v1.post(
	'channels.archive',
	{
		authRequired: true,
		body: isChannelsArchiveProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		await executeArchiveRoom(this.userId, findResult._id);

		return API.v1.success();
	},
);

API.v1.post(
	'channels.unarchive',
	{
		authRequired: true,
		body: isChannelsUnarchiveProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

const channelsHistoryResponseSchema = ajv.compile<{ messages: IMessage[]; firstUnread?: IMessage; unreadNotLoaded?: number }>({
	type: 'object',
	properties: {
		messages: { type: 'array', items: { $ref: '#/components/schemas/IMessage' } },
		firstUnread: { $ref: '#/components/schemas/IMessage' },
		unreadNotLoaded: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['messages', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'channels.history',
	{
		authRequired: true,
		query: isChannelsHistoryProps,
		response: {
			200: channelsHistoryResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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

		if (!result || typeof result !== 'object' || Array.isArray(result)) {
			return API.v1.forbidden();
		}

		return API.v1.success(result);
	},
);

const rolesResponseSchema = ajv.compile<{
	roles: { rid: string; u: { _id: string; username: string; name?: string }; roles: string[] }[];
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
						properties: { _id: { type: 'string' }, username: { type: 'string' }, name: { type: 'string' } },
						required: ['_id', 'username'],
						additionalProperties: false,
					},
					roles: { type: 'array', items: { type: 'string' } },
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

API.v1.get(
	'channels.roles',
	{
		authRequired: true,
		query: isChannelsRolesProps,
		response: {
			200: rolesResponseSchema,
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

API.v1.post(
	'channels.join',
	{
		authRequired: true,
		body: isChannelsJoinProps,
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { joinCode, ...params } = this.bodyParams;
		const findResult = await findChannelByIdOrName({ params });

		await Room.join({ room: findResult, user: this.user, joinCode });

		return API.v1.success({
			channel: await findChannelByIdOrName({ params, userId: this.userId }),
		});
	},
);

API.v1.post(
	'channels.kick',
	{
		authRequired: true,
		body: isChannelsKickProps,
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'channels.leave',
	{
		authRequired: true,
		body: isChannelsLeaveProps,
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

const channelsMessagesResponseSchema = ajv.compile<{ messages: IMessage[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		messages: { type: 'array', items: { $ref: '#/components/schemas/IMessage' } },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['messages', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'channels.messages',
	{
		authRequired: true,
		query: isChannelsMessagesProps,
		permissionsRequired: ['view-c-room'],
		response: {
			200: channelsMessagesResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
			...(String(pinned).toLowerCase() === 'true' ? { pinned: true } : {}),
			_hidden: { $ne: true },
		};

		if (!(await canAccessRoomAsync(findResult, { _id: this.userId }))) {
			return API.v1.forbidden();
		}

		// Special check for the permissions
		if (
			(await hasPermissionAsync(this.user, 'view-joined-room')) &&
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
);

API.v1.post(
	'channels.open',
	{
		authRequired: true,
		body: isChannelsOpenProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'channels.setReadOnly',
	{
		authRequired: true,
		body: isChannelsSetReadOnlyProps,
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		if (findResult.ro === this.bodyParams.readOnly) {
			return API.v1.failure('The channel read only setting is the same as what it would be changed to.');
		}

		await saveRoomSettings(this.userId, findResult._id, 'readOnly', this.bodyParams.readOnly);

		return API.v1.success({
			channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
		});
	},
);

const announcementResponseSchema = ajv.compile<{ announcement?: string }>({
	type: 'object',
	properties: {
		announcement: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

API.v1.post(
	'channels.setAnnouncement',
	{
		authRequired: true,
		body: isChannelsSetAnnouncementProps,
		response: {
			200: announcementResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { announcement, ...params } = this.bodyParams;

		const findResult = await findChannelByIdOrName({ params });

		await saveRoomSettings(this.userId, findResult._id, 'roomAnnouncement', announcement);

		return API.v1.success({
			announcement: this.bodyParams.announcement,
		});
	},
);

const channelsMentionsResponseSchema = ajv.compile<{ mentions: IMessage[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		mentions: { type: 'array', items: { $ref: '#/components/schemas/IMessage' } },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['mentions', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'channels.getAllUserMentionsByChannel',
	{
		authRequired: true,
		query: isChannelsGetAllUserMentionsByChannelProps,
		response: {
			200: channelsMentionsResponseSchema,
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

const moderatorsResponseSchema = ajv.compile<{ moderators: { _id: string; username?: string; name?: string }[] }>({
	type: 'object',
	properties: {
		moderators: {
			type: 'array',
			items: {
				type: 'object',
				properties: { _id: { type: 'string' }, username: { type: 'string' }, name: { type: 'string' } },
				required: ['_id'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['moderators', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'channels.moderators',
	{
		authRequired: true,
		query: isChannelsModeratorsProps,
		response: {
			200: moderatorsResponseSchema,
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

API.v1.post(
	'channels.delete',
	{
		authRequired: true,
		body: isChannelsDeleteProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const room = await findChannelByIdOrName({
			params: this.bodyParams,
			checkedArchived: false,
		});

		await eraseRoom(room._id, this.user);

		return API.v1.success();
	},
);

const channelsConvertToTeamResponseSchema = ajv.compile<{ team: ITeam }>({
	type: 'object',
	properties: {
		team: { $ref: '#/components/schemas/ITeam' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['team', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'channels.convertToTeam',
	{
		authRequired: true,
		body: isChannelsConvertToTeamProps,
		permissionsRequired: ['create-team'],
		response: {
			200: channelsConvertToTeamResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { channelId, channelName } = this.bodyParams;

		if (!channelId && !channelName) {
			return API.v1.failure('The parameter "channelId" or "channelName" is required');
		}

		const room = await findChannelByIdOrName({
			params: channelId !== undefined ? { roomId: channelId } : { roomName: channelName },
			userId: this.userId,
		});

		if (!room) {
			return API.v1.failure('Channel not found');
		}

		if (!(await hasAllPermissionAsync(this.user, ['create-team', 'edit-room'], room._id))) {
			return API.v1.forbidden();
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
);

API.v1.post(
	'channels.addModerator',
	{
		authRequired: true,
		body: isChannelsModeratorsProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		const user = await getUserFromParams(this.bodyParams);

		await addRoomModerator(this.userId, findResult._id, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'channels.addOwner',
	{
		authRequired: true,
		body: isChannelsModeratorsProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		const user = await getUserFromParams(this.bodyParams);

		await addRoomOwner(this.userId, findResult._id, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'channels.close',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string }>(),
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

const countersResponseSchema = ajv.compile<{
	joined: boolean;
	members: number | null;
	unreads: number | null;
	unreadsFrom: Date | null;
	msgs: number | null;
	latest: Date | null;
	userMentions: number | null;
}>({
	type: 'object',
	properties: {
		joined: { type: 'boolean' },
		members: { type: ['number', 'null'] },
		unreads: { type: ['number', 'null'] },
		unreadsFrom: { type: ['string', 'null'] },
		msgs: { type: ['number', 'null'] },
		latest: { type: ['string', 'null'] },
		userMentions: { type: ['number', 'null'] },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['joined', 'members', 'unreads', 'unreadsFrom', 'msgs', 'latest', 'userMentions', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'channels.counters',
	{
		authRequired: true,
		query: ajvQuery.compile<{ roomId?: string; roomName?: string; userId?: string }>({
			type: 'object',
			properties: {
				roomId: { type: 'string' },
				roomName: { type: 'string' },
				userId: { type: 'string' },
			},
			anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
			additionalProperties: false,
		}),
		response: {
			200: countersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const access = await hasPermissionAsync(this.user, 'view-room-administration');
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
			unreads = await Messages.countVisibleByRoomIdBetweenTimestampsInclusive(subscription.rid, subscription.ls ?? subscription.ts, lm);
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

API.v1.post(
	'channels.create',
	{
		authRequired: true,
		body: isChannelsCreateProps,
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { userId, bodyParams } = this;

		try {
			// create.validate throws a plain Error('unauthorized') on permission failure; the global
			// wrapper would surface its message verbatim, so map it to forbidden() here to keep the
			// stable `error: 'unauthorized'` (403) contract the clients/tests rely on.
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
				return API.v1.forbidden();
			}
			return API.v1.failure(e.message);
		}

		if (bodyParams.teams) {
			const canSeeAllTeams = await hasPermissionAsync(this.user, 'view-all-teams');
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

		const result = await API.channels?.create.execute(userId, bodyParams);
		if (!result) {
			return API.v1.failure('Failed to create channel');
		}

		return API.v1.success(result);
	},
);

// Uploads accept a client-supplied `fields` projection and store `content: null` for non-e2ee files,
// so items are partial and cannot be validated against $ref IUploadWithUser (required, non-null shape).
// Validate the array container strictly; leave item props open (only _id is guaranteed).
const channelsFilesResponseSchema = ajv.compile<{ files: IUploadWithUser[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		files: {
			type: 'array',
			items: {
				type: 'object',
				properties: { _id: { type: 'string' } },
				required: ['_id'],
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

API.v1.get(
	'channels.files',
	{
		authRequired: true,
		query: isChannelsFilesListProps,
		response: {
			200: channelsFilesResponseSchema,
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
			...query,
			rid: findResult._id,
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

const channelsGetIntegrationsQuery = ajvQuery.compile<{
	roomId?: string;
	roomName?: string;
	includeAllPublicChannels?: string;
	offset?: number;
	count?: number;
	sort?: string;
	query?: string;
	fields?: string;
}>({
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		roomName: { type: 'string' },
		includeAllPublicChannels: { type: 'string' },
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
		query: { type: 'string' },
		fields: { type: 'string' },
	},
	anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	additionalProperties: false,
});

const channelsGetIntegrationsResponseSchema = ajv.compile<{
	integrations: IIntegration[];
	count: number;
	offset: number;
	total: number;
}>({
	type: 'object',
	properties: {
		integrations: {
			type: 'array',
			items: {
				oneOf: [{ $ref: '#/components/schemas/IIncomingIntegration' }, { $ref: '#/components/schemas/IOutgoingIntegration' }],
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

API.v1.get(
	'channels.getIntegrations',
	{
		authRequired: true,
		query: channelsGetIntegrationsQuery,
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
			200: channelsGetIntegrationsResponseSchema,
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

		// Apply the user-supplied query first, then overlay the trusted filters so a crafted `query`
		// cannot override the permission scope (mountIntegrationQueryBasedOnPermissions) or the channel filter.
		ourQuery = Object.assign({}, query, ourQuery, await mountIntegrationQueryBasedOnPermissions(this.userId));

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

API.v1.get(
	'channels.info',
	{
		authRequired: true,
		query: roomTargetQuery,
		response: {
			200: channelInfoResponseSchema,
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

const channelsInviteBody = ajv.compile<({ roomId: string } | { roomName: string }) & { userId?: string; username?: string; user?: string }>(
	{
		type: 'object',
		properties: {
			roomId: { type: 'string' },
			roomName: { type: 'string' },
			userId: { type: 'string' },
			username: { type: 'string' },
			user: { type: 'string' },
		},
		anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
		additionalProperties: false,
	},
);

API.v1.post(
	'channels.invite',
	{
		authRequired: true,
		body: channelsInviteBody,
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		// Federated rooms invite by raw username: the federated user record is created
		// lazily inside addUsersToRoomMethod, so we must not require it to exist locally yet.
		if (isRoomNativeFederated(findResult)) {
			const users = await getUsernameListFromParams(this.bodyParams);

			await addUsersToRoomMethod(this.userId, { rid: findResult._id, users }, this.user);

			return API.v1.success({
				channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
			});
		}

		const users = await getUserListFromParams(this.bodyParams);

		if (!users.length) {
			return API.v1.failure('invalid-user-invite-list', 'Cannot invite if no users are provided');
		}

		await addUsersToRoomMethod(this.userId, { rid: findResult._id, users: users.map((u) => u.username).filter(isTruthy) }, this.user);

		return API.v1.success({
			channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
		});
	},
);

API.v1.get(
	'channels.list',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['view-c-room', 'view-joined-room'], operation: 'hasAny' },
		},
		query: isChannelsListProps,
		response: {
			200: channelsListResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();
		const hasPermissionToSeeAllPublicChannels = await hasPermissionAsync(this.user, 'view-c-room');

		const { _id } = this.queryParams;

		const ourQuery: Filter<IRoom> = {
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

// list.joined lists the caller's joined channels and ignores any room target, but existing clients
// still pass roomId/roomName, so accept (and ignore) them alongside the standard pagination params.
const channelsListJoinedQuery = ajvQuery.compile<{
	_id?: string;
	roomId?: string;
	roomName?: string;
	query?: string;
	count?: number;
	offset?: number;
	sort?: string;
}>({
	type: 'object',
	properties: {
		_id: { type: 'string' },
		roomId: { type: 'string' },
		roomName: { type: 'string' },
		query: { type: 'string' },
		count: { type: 'number' },
		offset: { type: 'number' },
		sort: { type: 'string' },
	},
	required: [],
	additionalProperties: false,
});

API.v1.get(
	'channels.list.joined',
	{
		authRequired: true,
		query: channelsListJoinedQuery,
		response: {
			200: channelsListResponseSchema,
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

const channelsMembersQuery = ajvQuery.compile<{
	roomId?: string;
	roomName?: string;
	filter?: string;
	status?: string[];
	offset?: number;
	count?: number;
	sort?: string;
}>({
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		roomName: { type: 'string' },
		filter: { type: 'string' },
		status: { type: 'array', items: { type: 'string' } },
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
	},
	anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	additionalProperties: false,
});

// findUsersOfRoom returns a fixed projection (not a full IUser), so validate against the projected
// shape rather than $ref IUser (which would require createdAt/roles/type/active and reject real data).
const channelsMembersResponseSchema = ajv.compile<{ members: IUser[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		members: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					name: { type: 'string' },
					username: { type: 'string' },
					nickname: { type: 'string' },
					status: { type: 'string' },
					avatarETag: { type: 'string' },
					federated: { type: 'boolean' },
					_updatedAt: { type: 'string' },
				},
				required: ['_id'],
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

API.v1.get(
	'channels.members',
	{
		authRequired: true,
		query: channelsMembersQuery,
		response: {
			200: channelsMembersResponseSchema,
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

		if (findResult.broadcast && !(await hasPermissionAsync(this.user, 'view-broadcast-member-list', findResult._id))) {
			return API.v1.forbidden();
		}

		const { offset: skip, count: limit } = await getPaginationItems(this.queryParams);
		const { sort = {} } = await this.parseJsonQuery();

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

const channelsOnlineResponseSchema = ajv.compile<{ online: Pick<IUser, '_id' | 'username'>[] }>({
	type: 'object',
	properties: {
		online: {
			type: 'array',
			items: {
				type: 'object',
				properties: { _id: { type: 'string' }, username: { type: 'string' } },
				required: ['_id'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['online', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'channels.online',
	{
		authRequired: true,
		query: isChannelsOnlineProps,
		response: {
			200: channelsOnlineResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
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
			online: onlineInRoom.filter(isTruthy),
		});
	},
);

API.v1.post(
	'channels.removeModerator',
	{
		authRequired: true,
		body: isChannelsModeratorsProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		const user = await getUserFromParams(this.bodyParams);

		await removeRoomModerator(this.userId, findResult._id, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'channels.removeOwner',
	{
		authRequired: true,
		body: isChannelsModeratorsProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		const user = await getUserFromParams(this.bodyParams);

		await removeRoomOwner(this.userId, findResult._id, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'channels.rename',
	{
		authRequired: true,
		body: roomSettingBody<{ roomId?: string; roomName?: string; name: string }>('name', { type: 'string' }),
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'channels.setCustomFields',
	{
		authRequired: true,
		body: roomSettingBody<{ roomId?: string; roomName?: string; customFields: Record<string, unknown> }>('customFields', {
			type: 'object',
		}),
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		if (!this.bodyParams.customFields || !(typeof this.bodyParams.customFields === 'object')) {
			return API.v1.failure('The bodyParam "customFields" is required with a type like object.');
		}

		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		await saveRoomSettings(this.userId, findResult._id, 'roomCustomFields', this.bodyParams.customFields);

		return API.v1.success({
			channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
		});
	},
);

API.v1.post(
	'channels.setDefault',
	{
		authRequired: true,
		body: roomSettingBody<{ roomId?: string; roomName?: string; default: boolean | string }>('default', { type: ['boolean', 'string'] }),
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'channels.setDescription',
	{
		authRequired: true,
		body: roomSettingBody<{ roomId?: string; roomName?: string; description: string }>('description', { type: 'string' }),
		response: {
			200: descriptionResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		if (findResult.description === this.bodyParams.description) {
			return API.v1.failure('The channel description is the same as what it would be changed to.');
		}

		await saveRoomSettings(this.userId, findResult._id, 'roomDescription', this.bodyParams.description || '');

		return API.v1.success({
			description: this.bodyParams.description || '',
		});
	},
);

API.v1.post(
	'channels.setPurpose',
	{
		authRequired: true,
		body: roomSettingBody<{ roomId?: string; roomName?: string; purpose: string }>('purpose', { type: 'string' }),
		response: {
			200: purposeResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		if (findResult.description === this.bodyParams.purpose) {
			return API.v1.failure('The channel purpose (description) is the same as what it would be changed to.');
		}

		await saveRoomSettings(this.userId, findResult._id, 'roomDescription', this.bodyParams.purpose || '');

		return API.v1.success({
			purpose: this.bodyParams.purpose || '',
		});
	},
);

API.v1.post(
	'channels.setTopic',
	{
		authRequired: true,
		body: roomSettingBody<{ roomId?: string; roomName?: string; topic: string }>('topic', { type: 'string' }),
		response: {
			200: topicResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		if (findResult.topic === this.bodyParams.topic) {
			return API.v1.failure('The channel topic is the same as what it would be changed to.');
		}

		await saveRoomSettings(this.userId, findResult._id, 'roomTopic', this.bodyParams.topic || '');

		return API.v1.success({
			topic: this.bodyParams.topic || '',
		});
	},
);

API.v1.post(
	'channels.setType',
	{
		authRequired: true,
		body: roomSettingBody<{ roomId?: string; roomName?: string; type: string }>('type', { type: 'string' }),
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'channels.addLeader',
	{
		authRequired: true,
		body: isChannelsModeratorsProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		const user = await getUserFromParams(this.bodyParams);

		await addRoomLeader(this.userId, findResult._id, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'channels.removeLeader',
	{
		authRequired: true,
		body: isChannelsModeratorsProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		const user = await getUserFromParams(this.bodyParams);

		await removeRoomLeader(this.userId, findResult._id, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'channels.setJoinCode',
	{
		authRequired: true,
		body: roomSettingBody<{ roomId?: string; roomName?: string; joinCode: string }>('joinCode', { type: 'string' }),
		response: {
			200: channelResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		if (!this.bodyParams.joinCode?.trim()) {
			return API.v1.failure('The bodyParam "joinCode" is required');
		}

		const findResult = await findChannelByIdOrName({ params: this.bodyParams });

		await saveRoomSettings(this.userId, findResult._id, 'joinCode', this.bodyParams.joinCode);

		return API.v1.success({
			channel: await findChannelByIdOrName({ params: this.bodyParams, userId: this.userId }),
		});
	},
);

const channelsAnonymousReadQuery = ajvQuery.compile<{
	roomId?: string;
	roomName?: string;
	offset?: number;
	count?: number;
	sort?: string;
	query?: string;
	fields?: string;
}>({
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		roomName: { type: 'string' },
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
		query: { type: 'string' },
		fields: { type: 'string' },
	},
	anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	additionalProperties: false,
});

API.v1.get(
	'channels.anonymousread',
	{
		authOrAnonRequired: true,
		query: channelsAnonymousReadQuery,
		response: {
			200: channelsMessagesResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
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
);
