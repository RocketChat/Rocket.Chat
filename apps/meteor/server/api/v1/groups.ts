import { Team, isMeteorError } from '@rocket.chat/core-services';
import {
	isRoomNativeFederated,
	type IIntegration,
	type IMessage,
	type ITeam,
	type IUploadWithUser,
	type IUser,
	type IRoom,
	type RoomType,
	type UserStatus,
} from '@rocket.chat/core-typings';
import { Integrations, Messages, Rooms, Subscriptions, Uploads, Users } from '@rocket.chat/models';
import {
	isGroupsConvertToTeamProps,
	isGroupsCountersProps,
	isGroupsCreateProps,
	isGroupsDeleteProps,
	isGroupsFilesProps,
	isGroupsHistoryProps,
	isGroupsInfoProps,
	isGroupsInviteProps,
	isGroupsListProps,
	isGroupsModeratorsProps,
	isGroupsOnlineProps,
	isGroupsRolesProps,
	ajv,
	ajvQuery,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { isTruthy } from '@rocket.chat/tools';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';

import { canAccessRoomAsync, roomAccessAttributes } from '../../lib/authorization';
import { hasAllPermissionAsync, hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { eraseRoom } from '../../lib/eraseRoom';
import { findUsersOfRoom } from '../../lib/findUsersOfRoom';
import { mountIntegrationQueryBasedOnPermissions } from '../../lib/integrations/lib/mountQueriesBasedOnPermission';
import { openRoom } from '../../lib/openRoom';
import { normalizeMessagesForUser } from '../../lib/utils/lib/normalizeMessagesForUser';
import { getChannelHistory } from '../../meteor-methods/messages/getChannelHistory';
import { addAllUserToRoomFn } from '../../meteor-methods/rooms/addAllUserToRoom';
import { addRoomLeader } from '../../meteor-methods/rooms/addRoomLeader';
import { addRoomModerator } from '../../meteor-methods/rooms/addRoomModerator';
import { addRoomOwner } from '../../meteor-methods/rooms/addRoomOwner';
import { addUsersToRoomMethod } from '../../meteor-methods/rooms/addUsersToRoom';
import { executeArchiveRoom } from '../../meteor-methods/rooms/archiveRoom';
import { createPrivateGroupMethod } from '../../meteor-methods/rooms/createPrivateGroup';
import { executeGetRoomRoles } from '../../meteor-methods/rooms/getRoomRoles';
import { hideRoomMethod } from '../../meteor-methods/rooms/hideRoom';
import { leaveRoomMethod } from '../../meteor-methods/rooms/leaveRoom';
import { removeRoomLeader } from '../../meteor-methods/rooms/removeRoomLeader';
import { removeRoomModerator } from '../../meteor-methods/rooms/removeRoomModerator';
import { removeRoomOwner } from '../../meteor-methods/rooms/removeRoomOwner';
import { removeUserFromRoomMethod } from '../../meteor-methods/rooms/removeUserFromRoom';
import { saveRoomSettings } from '../../meteor-methods/rooms/saveRoomSettings';
import { executeUnarchiveRoom } from '../../meteor-methods/rooms/unarchiveRoom';
import { API } from '../api';
import { addUserToFileObj } from '../lib/addUserToFileObj';
import { composeRoomWithLastMessage } from '../lib/composeRoomWithLastMessage';
import { getPaginationItems } from '../lib/getPaginationItems';
import { getUserFromParams, getUserListFromParams, getUsernameListFromParams } from '../lib/getUserFromParams';

async function getRoomFromParams(params: { roomId?: string } | { roomName?: string }): Promise<IRoom> {
	if (
		(!('roomId' in params) && !('roomName' in params)) ||
		('roomId' in params && !(params as { roomId?: string }).roomId && 'roomName' in params && !(params as { roomName?: string }).roomName)
	) {
		throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	const roomOptions = {
		projection: {
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

	const room = await (() => {
		if ('roomId' in params) {
			return Rooms.findOneById(params.roomId || '', roomOptions);
		}
		if ('roomName' in params) {
			return Rooms.findOneByName(params.roomName || '', roomOptions);
		}
	})();

	if (room?.t !== 'p') {
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

	const user = await Users.findOneById(userId, { projection: { username: 1, roles: 1, abacAttributes: 1 } });

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

const groupResponseSchema = ajv.compile<{ group: IRoom }>({
	type: 'object',
	properties: {
		group: { $ref: '#/components/schemas/IRoom' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['group', 'success'],
	additionalProperties: false,
});

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

// Inline body validator: a room target (roomId or roomName) plus optional user/extra fields.
const roomTargetBody = <T>(extra: Record<string, Record<string, unknown>> = {}, required: string[] = []) =>
	ajv.compile<T>({
		type: 'object',
		properties: {
			roomId: { type: 'string' },
			roomName: { type: 'string' },
			...extra,
		},
		required,
		oneOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
		additionalProperties: false,
	});

const roomUserBody = <T>() => roomTargetBody<T>({ userId: { type: 'string' }, username: { type: 'string' }, user: { type: 'string' } });

const stringFieldResponseSchema = <T>(field: 'description' | 'purpose' | 'topic' | 'announcement') =>
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
const announcementResponseSchema = stringFieldResponseSchema<{ announcement: string }>('announcement');

API.v1.post(
	'groups.addAll',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; activeUsersOnly?: boolean | string | number }>({
			activeUsersOnly: { type: ['boolean', 'string', 'number'] },
		}),
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { activeUsersOnly, ...params } = this.bodyParams;
		const findResult = await findPrivateGroupByIdOrName({
			params,
			userId: this.userId,
		});

		await addAllUserToRoomFn(this.userId, findResult.rid, activeUsersOnly === true || activeUsersOnly === 'true' || activeUsersOnly === 1);

		const room = await Rooms.findOneById(findResult.rid, { projection: API.v1.defaultFieldsToExclude });

		if (!room) {
			throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
		}

		return API.v1.success({
			group: await composeRoomWithLastMessage(room, this.userId),
		});
	},
);

API.v1.post(
	'groups.addModerator',
	{
		authRequired: true,
		body: roomUserBody<{ roomId?: string; roomName?: string; userId?: string; username?: string; user?: string }>(),
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		const user = await getUserFromParams(this.bodyParams);

		await addRoomModerator(this.userId, findResult.rid, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'groups.addOwner',
	{
		authRequired: true,
		body: roomUserBody<{ roomId?: string; roomName?: string; userId?: string; username?: string; user?: string }>(),
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		const user = await getUserFromParams(this.bodyParams);

		await addRoomOwner(this.userId, findResult.rid, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'groups.addLeader',
	{
		authRequired: true,
		body: roomUserBody<{ roomId?: string; roomName?: string; userId?: string; username?: string; user?: string }>(),
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});
		const user = await getUserFromParams(this.bodyParams);

		await addRoomLeader(this.userId, findResult.rid, user._id);

		return API.v1.success();
	},
);

// Archives a private group only if it wasn't
API.v1.post(
	'groups.archive',
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
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		await executeArchiveRoom(this.userId, findResult.rid);

		return API.v1.success();
	},
);

API.v1.post(
	'groups.close',
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
	'groups.counters',
	{
		authRequired: true,
		query: isGroupsCountersProps,
		response: {
			200: countersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const access = await hasPermissionAsync(this.user, 'view-room-administration');
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

		if (room?.t !== 'p') {
			throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
		}

		if (room.archived) {
			throw new Meteor.Error('error-room-archived', `The private group, ${room.name}, is archived`);
		}

		if (params.userId) {
			if (!access) {
				return API.v1.forbidden();
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

// Create Private Group
API.v1.post(
	'groups.create',
	{
		authRequired: true,
		body: isGroupsCreateProps,
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		if (!this.bodyParams.name) {
			return API.v1.failure('Body param "name" is required');
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
				return API.v1.forbidden();
			}
			throw error;
		}
	},
);

API.v1.post(
	'groups.delete',
	{
		authRequired: true,
		body: isGroupsDeleteProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
			checkedArchived: false,
		});

		await eraseRoom(findResult.rid, this.user);

		return API.v1.success();
	},
);

// Uploads accept a client-supplied `fields` projection and store `content: null` for non-e2ee files,
// so items are partial and cannot be validated against $ref IUploadWithUser (required, non-null shape).
// Validate the array container strictly; leave item props open (only _id is guaranteed).
const groupsFilesResponseSchema = ajv.compile<{ files: IUploadWithUser[]; count: number; offset: number; total: number }>({
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
	'groups.files',
	{
		authRequired: true,
		query: isGroupsFilesProps,
		response: {
			200: groupsFilesResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { typeGroup, name, roomId, roomName, onlyConfirmed } = this.queryParams;

		const findResult = await findPrivateGroupByIdOrName({
			params: roomId ? { roomId } : { roomName },
			userId: this.userId,
			checkedArchived: false,
		});

		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		const filter = {
			...query,
			rid: findResult.rid,
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

// Loose query validator (mirrors channels.getIntegrations): coerces query scalars and accepts pagination/parseJsonQuery params.
const groupsGetIntegrationsQuery = ajvQuery.compile<{
	roomId?: string;
	roomName?: string;
	includeAllPrivateGroups?: string;
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
		includeAllPrivateGroups: { type: 'string' },
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
		query: { type: 'string' },
		fields: { type: 'string' },
	},
	anyOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	additionalProperties: false,
});

const groupsGetIntegrationsResponseSchema = ajv.compile<{
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
	'groups.getIntegrations',
	{
		authRequired: true,
		query: groupsGetIntegrationsQuery,
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
			200: groupsGetIntegrationsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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

		// query and channel filters cannot override the permission scope (mountIntegrationQueryBasedOnPermissions).
		const ourQuery = Object.assign(
			{},
			query,
			{ channel: { $in: channelsToSearch } },
			await mountIntegrationQueryBasedOnPermissions(this.userId),
		) as Filter<IIntegration>;
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

const groupsHistoryResponseSchema = ajv.compile<{ messages: IMessage[]; firstUnread?: IMessage; unreadNotLoaded?: number }>({
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
	'groups.history',
	{
		authRequired: true,
		query: isGroupsHistoryProps,
		response: {
			200: groupsHistoryResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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

		const inclusive = this.queryParams.inclusive === 'true';

		let count = 20;
		if (this.queryParams.count) {
			count = parseInt(String(this.queryParams.count));
		}

		let offset = 0;
		if (this.queryParams.offset) {
			offset = parseInt(String(this.queryParams.offset));
		}

		const unreads = this.queryParams.unreads === 'true';

		const showThreadMessages = this.queryParams.showThreadMessages !== 'false';

		const result = await getChannelHistory({
			rid: findResult.rid,
			fromUserId: this.userId,
			latest: latestDate,
			oldest: oldestDate,
			inclusive,
			offset,
			count,
			unreads,
			showThreadMessages,
		});

		if (!result || typeof result !== 'object' || Array.isArray(result)) {
			return API.v1.forbidden();
		}

		return API.v1.success(result);
	},
);

API.v1.get(
	'groups.info',
	{
		authRequired: true,
		query: isGroupsInfoProps,
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'groups.invite',
	{
		authRequired: true,
		body: isGroupsInviteProps,
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const roomId = 'roomId' in this.bodyParams ? this.bodyParams.roomId : '';
		const roomName = 'roomName' in this.bodyParams ? this.bodyParams.roomName : '';
		const idOrName = roomId || roomName;

		if (!idOrName?.trim()) {
			throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
		}

		const groupRoom = await Rooms.findOneByIdOrName(idOrName);
		const { _id: rid, t: type } = groupRoom || {};

		if (!rid || type !== 'p') {
			throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
		}

		// Federated rooms invite by raw username: the federated user record is created
		// lazily inside addUsersToRoomMethod, so we must not require it to exist locally yet.
		if (groupRoom && isRoomNativeFederated(groupRoom)) {
			const usernames = await getUsernameListFromParams(this.bodyParams);

			await addUsersToRoomMethod(this.userId, { rid, users: usernames }, this.user);
		} else {
			const users = await getUserListFromParams(this.bodyParams);

			if (!users.length) {
				throw new Meteor.Error('error-empty-invite-list', 'Cannot invite if no valid users are provided');
			}

			await addUsersToRoomMethod(this.userId, { rid, users: users.map((u) => u.username).filter(isTruthy) }, this.user);
		}

		const room = await Rooms.findOneById(rid, { projection: API.v1.defaultFieldsToExclude });

		if (!room) {
			throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
		}

		return API.v1.success({
			group: await composeRoomWithLastMessage(room, this.userId),
		});
	},
);

API.v1.post(
	'groups.kick',
	{
		authRequired: true,
		body: roomUserBody<{ roomId?: string; roomName?: string; userId?: string; username?: string; user?: string }>(),
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const room = await getRoomFromParams(this.bodyParams);

		const user = await getUserFromParams(this.bodyParams);
		if (!user?.username) {
			return API.v1.failure('Invalid user');
		}

		await removeUserFromRoomMethod(this.userId, { rid: room._id, username: user.username });

		return API.v1.success();
	},
);

API.v1.post(
	'groups.leave',
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
);

// List Private Groups a user has access to
const groupsListResponseSchema = ajv.compile<{ groups: IRoom[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		groups: { type: 'array', items: { $ref: '#/components/schemas/IRoom' } },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['groups', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'groups.list',
	{
		authRequired: true,
		query: isGroupsListProps,
		response: {
			200: groupsListResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.get(
	'groups.listAll',
	{
		authRequired: true,
		query: isGroupsListProps,
		permissionsRequired: ['view-room-administration'],
		response: {
			200: groupsListResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
);

// Loose query validator (mirrors channels.members): coerces single status value to array and accepts filter/sort/pagination.
const groupsMembersQuery = ajvQuery.compile<{
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
const groupsMembersResponseSchema = ajv.compile<{ members: IUser[]; count: number; offset: number; total: number }>({
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
	'groups.members',
	{
		authRequired: true,
		query: groupsMembersQuery,
		response: {
			200: groupsMembersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.queryParams,
			userId: this.userId,
		});

		if (findResult.broadcast && !(await hasPermissionAsync(this.user, 'view-broadcast-member-list', findResult.rid))) {
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
			rid: findResult.rid,
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

// Flat query shape so roomId/roomName both destructure and pinned stays a string; oneOf rejects passing both room params (400).
const groupsMessagesQuery = ajvQuery.compile<{
	roomId?: string;
	roomName?: string;
	mentionIds?: string;
	starredIds?: string;
	pinned?: string;
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
		mentionIds: { type: 'string' },
		starredIds: { type: 'string' },
		pinned: { type: 'string' },
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
		query: { type: 'string' },
		fields: { type: 'string' },
	},
	oneOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	additionalProperties: false,
});

const groupsMessagesResponseSchema = ajv.compile<{ messages: IMessage[]; count: number; offset: number; total: number }>({
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
	'groups.messages',
	{
		authRequired: true,
		query: groupsMessagesQuery,
		response: {
			200: groupsMessagesResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomId, roomName, mentionIds, starredIds, pinned } = this.queryParams;

		const findResult = await findPrivateGroupByIdOrName({
			params: {
				...(roomId && { roomId }),
				...(roomName && { roomName }),
			},
			userId: this.userId,
		});
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		const parseIds = (ids: string | undefined, field: string) =>
			typeof ids === 'string' && ids ? { [field]: { $in: ids.split(',').map((id) => id.trim()) } } : {};

		const ourQuery = {
			...query,
			rid: findResult.rid,
			...parseIds(mentionIds, 'mentions._id'),
			...parseIds(starredIds, 'starred._id'),
			...(pinned?.toLowerCase() === 'true' ? { pinned: true } : {}),
			_hidden: { $ne: true },
		};

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

const groupsOnlineResponseSchema = ajv.compile<{ online: Pick<IUser, '_id' | 'username'>[] }>({
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

// TODO: CACHE: same as channels.online
API.v1.get(
	'groups.online',
	{
		authRequired: true,
		query: isGroupsOnlineProps,
		response: {
			200: groupsOnlineResponseSchema,
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
			t: 'p',
		};

		const room = await Rooms.findOne(filter as Record<string, any>);
		if (!room) {
			return API.v1.failure('Group does not exists');
		}

		if (!(await canAccessRoomAsync(room, this.user))) {
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
);

API.v1.post(
	'groups.open',
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
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
			checkedArchived: false,
		});

		if (findResult.open) {
			return API.v1.failure(`The private group, ${findResult.name}, is already open for the sender`);
		}

		await openRoom(this.userId, findResult.rid);

		return API.v1.success();
	},
);

API.v1.post(
	'groups.removeModerator',
	{
		authRequired: true,
		body: roomUserBody<{ roomId?: string; roomName?: string; userId?: string; username?: string; user?: string }>(),
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		const user = await getUserFromParams(this.bodyParams);

		await removeRoomModerator(this.userId, findResult.rid, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'groups.removeOwner',
	{
		authRequired: true,
		body: roomUserBody<{ roomId?: string; roomName?: string; userId?: string; username?: string; user?: string }>(),
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		const user = await getUserFromParams(this.bodyParams);

		await removeRoomOwner(this.userId, findResult.rid, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'groups.removeLeader',
	{
		authRequired: true,
		body: roomUserBody<{ roomId?: string; roomName?: string; userId?: string; username?: string; user?: string }>(),
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		const user = await getUserFromParams(this.bodyParams);

		await removeRoomLeader(this.userId, findResult.rid, user._id);

		return API.v1.success();
	},
);

API.v1.post(
	'groups.rename',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; name: string }>({ name: { type: 'string' } }, ['name']),
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'groups.setCustomFields',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; customFields: Record<string, unknown> }>(
			{ customFields: { type: 'object' } },
			['customFields'],
		),
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'groups.setDescription',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; description: string }>({ description: { type: 'string' } }, ['description']),
		response: {
			200: descriptionResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		await saveRoomSettings(this.userId, findResult.rid, 'roomDescription', this.bodyParams.description || '');

		return API.v1.success({
			description: this.bodyParams.description || '',
		});
	},
);

API.v1.post(
	'groups.setPurpose',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; purpose: string }>({ purpose: { type: 'string' } }, ['purpose']),
		response: {
			200: purposeResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		await saveRoomSettings(this.userId, findResult.rid, 'roomDescription', this.bodyParams.purpose || '');

		return API.v1.success({
			purpose: this.bodyParams.purpose || '',
		});
	},
);

API.v1.post(
	'groups.setReadOnly',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; readOnly: boolean }>({ readOnly: { type: 'boolean' } }, ['readOnly']),
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'groups.setTopic',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; topic: string }>({ topic: { type: 'string' } }, ['topic']),
		response: {
			200: topicResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		await saveRoomSettings(this.userId, findResult.rid, 'roomTopic', this.bodyParams.topic || '');

		return API.v1.success({
			topic: this.bodyParams.topic || '',
		});
	},
);

API.v1.post(
	'groups.setType',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; type: string }>({ type: { type: 'string' } }, ['type']),
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'groups.setAnnouncement',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; announcement: string }>({ announcement: { type: 'string' } }, [
			'announcement',
		]),
		response: {
			200: announcementResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
		});

		await saveRoomSettings(this.userId, findResult.rid, 'roomAnnouncement', this.bodyParams.announcement || '');

		return API.v1.success({
			announcement: this.bodyParams.announcement || '',
		});
	},
);

API.v1.post(
	'groups.unarchive',
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
		const findResult = await findPrivateGroupByIdOrName({
			params: this.bodyParams,
			userId: this.userId,
			checkedArchived: false,
		});

		await executeUnarchiveRoom(this.userId, findResult.rid);

		return API.v1.success();
	},
);

const groupsRolesResponseSchema = ajv.compile<{
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
	'groups.roles',
	{
		authRequired: true,
		query: isGroupsRolesProps,
		response: {
			200: groupsRolesResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.queryParams,
			userId: this.userId,
		});

		const roles = await executeGetRoomRoles(findResult.rid, this.user);

		return API.v1.success({
			roles,
		});
	},
);

const groupsModeratorsResponseSchema = ajv.compile<{ moderators: { _id: string; username?: string; name?: string }[] }>({
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
	'groups.moderators',
	{
		authRequired: true,
		query: isGroupsModeratorsProps,
		response: {
			200: groupsModeratorsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const findResult = await findPrivateGroupByIdOrName({
			params: this.queryParams,
			userId: this.userId,
		});

		const moderators = await Subscriptions.findByRoomIdAndRoles(findResult.rid, ['moderator'], {
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
	'groups.setEncrypted',
	{
		authRequired: true,
		body: roomTargetBody<{ roomId?: string; roomName?: string; encrypted: boolean }>({ encrypted: { type: 'boolean' } }, ['encrypted']),
		response: {
			200: groupResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

const groupsConvertToTeamResponseSchema = ajv.compile<{ team: ITeam }>({
	type: 'object',
	properties: {
		team: { $ref: '#/components/schemas/ITeam' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['team', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'groups.convertToTeam',
	{
		authRequired: true,
		body: isGroupsConvertToTeamProps,
		response: {
			200: groupsConvertToTeamResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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

		if (!(await hasAllPermissionAsync(this.user, ['create-team', 'edit-room'], room.rid))) {
			return API.v1.forbidden();
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
);
