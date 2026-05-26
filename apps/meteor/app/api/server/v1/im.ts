/**
 * Docs: https://github.com/RocketChat/developer-docs/blob/master/reference/api/rest-api/endpoints/team-collaboration-endpoints/im-endpoints
 */
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Uploads, Messages, Rooms, Users } from '@rocket.chat/models';
import {
	ajv,
	ajvQuery,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
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
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { saveRoomSettings } from '../../../channel-settings/server/methods/saveRoomSettings';
import { getRoomByNameOrIdWithOptionToJoin } from '../../../lib/server/functions/getRoomByNameOrIdWithOptionToJoin';
import { getChannelHistory } from '../../../lib/server/methods/getChannelHistory';
import { settings } from '../../../settings/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import type { TypedAction } from '../definition';
import { addUserToFileObj } from '../helpers/addUserToFileObj';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
import { getPaginationItems } from '../helpers/getPaginationItems';

const findDirectMessageRoom = async (
	keys: { roomId?: string; username?: string },
	uid: string,
): Promise<{ room: IRoom; subscription: ISubscription | null }> => {
	const nameOrId = 'roomId' in keys ? keys.roomId : keys.username;
	if (typeof nameOrId !== 'string') {
		throw new Meteor.Error('error-room-param-not-provided', 'Query param "roomId" or "username" is required');
	}

	const user = await Users.findOneById(uid);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'findDirectMessageRoom',
		});
	}

	const room = await getRoomByNameOrIdWithOptionToJoin({
		user,
		nameOrId,
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

type DmDeleteProps =
	| {
			roomId: string;
	  }
	| {
			username: string;
	  };

type DmCloseProps = {
	roomId: string;
};

const isDmDeleteProps = ajv.compile<DmDeleteProps>({
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
				username: {
					type: 'string',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});

const dmDeleteEndpointsProps = {
	authRequired: true,
	body: isDmDeleteProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		200: ajv.compile<void>({
			type: 'object',
			properties: {
				success: {
					type: 'boolean',
					enum: [true],
				},
			},
			required: ['success'],
			additionalProperties: false,
		}),
	},
} as const;

const DmClosePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

const isDmCloseProps = ajv.compile<DmCloseProps>(DmClosePropsSchema);

const dmCloseEndpointsProps = {
	authRequired: true,
	body: isDmCloseProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: ajv.compile<void>({
			type: 'object',
			properties: {
				success: {
					type: 'boolean',
					enum: [true],
				},
			},
			required: ['success'],
			additionalProperties: false,
		}),
	},
};

const dmDeleteAction = <Path extends string>(_path: Path): TypedAction<typeof dmDeleteEndpointsProps, Path> =>
	async function action() {
		const { room } = await findDirectMessageRoom(this.bodyParams, this.userId);

		const canAccess =
			(await canAccessRoomIdAsync(room._id, this.userId)) || (await hasPermissionAsync(this.userId, 'view-room-administration'));

		if (!canAccess) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		await eraseRoom(room._id, this.user);

		return API.v1.success();
	};

const dmCloseAction = <Path extends string>(_path: Path): TypedAction<typeof dmCloseEndpointsProps, Path> =>
	async function action() {
		const { roomId } = this.bodyParams;
		if (!roomId) {
			throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
		}
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'dm.close',
			});
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
	};

const isDmOpenProps = ajv.compile<{ roomId: string }>({
	type: 'object',
	properties: { roomId: { type: 'string' } },
	required: ['roomId'],
	additionalProperties: false,
});

const dmOpenEndpointsProps = {
	authRequired: true,
	body: isDmOpenProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: ajv.compile<void>({
			type: 'object',
			properties: { success: { type: 'boolean', enum: [true] } },
			required: ['success'],
			additionalProperties: false,
		}),
	},
} as const;

const dmOpenAction = <Path extends string>(_path: Path): TypedAction<typeof dmOpenEndpointsProps, Path> =>
	async function action() {
		const { roomId } = this.bodyParams;
		const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
		if (!canAccess) {
			return API.v1.forbidden();
		}

		const { room, subscription } = await findDirectMessageRoom({ roomId }, this.userId);

		if (!subscription?.open) {
			await openRoom(this.userId, room._id);
		}

		return API.v1.success();
	};

const isDmSetTopicProps = ajv.compile<{ roomId: string; topic?: string }>({
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		topic: { type: 'string', nullable: true },
	},
	required: ['roomId'],
	additionalProperties: false,
});

const dmSetTopicResponseSchema = ajv.compile<{ topic?: string }>({
	type: 'object',
	properties: {
		topic: { type: 'string', nullable: true },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const dmSetTopicEndpointsProps = {
	authRequired: true,
	body: isDmSetTopicProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: dmSetTopicResponseSchema,
	},
};

const dmSetTopicAction = <Path extends string>(_path: Path): TypedAction<typeof dmSetTopicEndpointsProps, Path> =>
	async function action() {
		const { roomId, topic } = this.bodyParams;
		if (!roomId) {
			throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
		}
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

		const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
		if (!canAccess) {
			return API.v1.forbidden();
		}

		const { room } = await findDirectMessageRoom({ roomId }, this.userId);

		// saveRoomTopic treats undefined and '' identically
		await saveRoomSettings(this.userId, room._id, 'roomTopic', topic ?? '');

		return API.v1.success({
			topic,
		});
	};

type DmCountersProps = {
	roomId: string;
	userId?: string;
};

const isDmCountersProps = ajvQuery.compile<DmCountersProps>({
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		userId: { type: 'string', nullable: true },
	},
	required: ['roomId'],
	additionalProperties: false,
});

const dmCountersResponseSchema = ajv.compile<{
	joined: boolean;
	members: number | null;
	unreads: number | null;
	unreadsFrom: string | null;
	msgs: number | null;
	latest: string | null;
	userMentions: number | null;
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

const dmCountersEndpointsProps = {
	authRequired: true,
	query: isDmCountersProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: dmCountersResponseSchema,
	},
};

const dmCountersAction = <Path extends string>(_path: Path): TypedAction<typeof dmCountersEndpointsProps, Path> =>
	async function action() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

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

		lm = room?.lm ? new Date(room.lm).toISOString() : new Date(room._updatedAt).toISOString();

		if (subscription) {
			unreads = subscription.unread ?? null;
			if (subscription.ls && room.msgs) {
				unreadsFrom = new Date(subscription.ls).toISOString();
			}
			userMentions = subscription.userMentions;
			joined = true;
		}

		if (access || joined) {
			msgs = room.msgs;
			latest = lm;
			members = await Users.countActiveUsersInDMRoom(room._id);
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
	};

const dmFilesResponseSchema = ajv.compile<{ files: object[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		files: { type: 'array', items: { type: 'object' } }, // relaxed: IUpload with addUserToFileObj transform
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['files', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const dmFilesEndpointsProps = {
	authRequired: true,
	query: isDmFileProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: dmFilesResponseSchema,
	},
};

const dmFilesAction = <Path extends string>(_path: Path): TypedAction<typeof dmFilesEndpointsProps, Path> =>
	async function action() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

		const { typeGroup, name, roomId, username, onlyConfirmed } = this.queryParams;

		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		const { room } = await findDirectMessageRoom(roomId ? { roomId } : { username }, this.userId);

		const canAccess = await canAccessRoomIdAsync(room._id, this.userId);
		if (!canAccess) {
			return API.v1.forbidden();
		}

		const filter = {
			...query,
			rid: room._id,
			...(name ? { name: { $regex: name || '', $options: 'i' } } : {}),
			...(typeGroup ? { typeGroup } : {}),
			...(onlyConfirmed && { expiresAt: { $exists: false } }),
		};

		const { cursor, totalCount } = Uploads.findPaginatedWithoutThumbs(filter, {
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
	};

const dmMembersResponseSchema = ajv.compile<{ members: object[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		members: { type: 'array', items: { type: 'object' } }, // relaxed: projected IUser + subscription info
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['members', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const dmMembersEndpointsProps = {
	authRequired: true,
	query: isDmMemberProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: dmMembersResponseSchema,
	},
};

const dmMembersAction = <Path extends string>(_path: Path): TypedAction<typeof dmMembersEndpointsProps, Path> =>
	async function action() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

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

		const extraQuery: Record<string, unknown> = {
			_id: { $in: room.uids },
			...(status && { status: { $in: status } }),
		};

		const options: FindOptions<IUser> = {
			projection: {
				_id: 1,
				username: 1,
				name: 1,
				status: 1,
				statusText: 1,
				utcOffset: 1,
				federated: 1,
				freeSwitchExtension: 1,
			},
			skip: offset,
			limit: count,
			sort: {
				_updatedAt: -1,
				username: sort?.username ? sort.username : 1,
			},
		};

		const searchFields = settings.get<string>('Accounts_SearchFields').trim().split(',');

		const { cursor, totalCount } = Users.findPaginatedByActiveUsersExcept(filter ?? '', [], options, searchFields, [extraQuery]);

		const [members, total] = await Promise.all([cursor.toArray(), totalCount]);

		// find subscriptions of those users
		const subs = await Subscriptions.findByRoomIdAndUserIds(
			room._id,
			members.map((member) => member._id),
			{ projection: { u: 1, status: 1, ts: 1, roles: 1 } },
		).toArray();

		const membersWithSubscriptionInfo = members.map((member) => {
			const sub = subs.find((sub) => sub.u._id === member._id);

			const { u: _u, ...subscription } = sub || {};

			return {
				...member,
				subscription,
			};
		});

		return API.v1.success({
			members: membersWithSubscriptionInfo,
			count: members.length,
			offset,
			total,
		});
	};

const dmMessagesResponseSchema = ajv.compile<{ messages: IMessage[]; count: number; offset: number; total: number }>({
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

const dmMessagesEndpointsProps = {
	authRequired: true,
	query: isDmMessagesProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: dmMessagesResponseSchema,
	},
};

const dmMessagesAction = <Path extends string>(_path: Path): TypedAction<typeof dmMessagesEndpointsProps, Path> =>
	async function action() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

		const { roomId, username, mentionIds, starredIds, pinned } = this.queryParams as {
			roomId?: string;
			username?: string;
			mentionIds?: string;
			starredIds?: string;
			pinned?: string;
		};

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
			...(pinned?.toLowerCase() === 'true' && { pinned: true }),
			_hidden: { $ne: true },
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
	};

const dmHistoryResponseSchema = ajv.compile<Record<string, unknown>>({
	type: 'object',
	properties: {
		messages: { type: 'array', items: { $ref: '#/components/schemas/IMessage' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['messages', 'success'],
	additionalProperties: true,
});

const dmHistoryEndpointsProps = {
	authRequired: true,
	query: isDmHistoryProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: dmHistoryResponseSchema,
	},
};

const dmHistoryAction = <Path extends string>(_path: Path): TypedAction<typeof dmHistoryEndpointsProps, Path> =>
	async function action() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

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

		return API.v1.success(result as Record<string, unknown>);
	};

const dmCreateResponseSchema = ajv.compile<{ room: IRoom & { rid: string } }>({
	type: 'object',
	properties: {
		room: { type: 'object' }, // relaxed: IRoom shape varies,
		success: { type: 'boolean', enum: [true] },
	},
	required: ['room', 'success'],
	additionalProperties: false,
});

const paginatedMessagesResponseSchema = ajv.compile<{ messages: IMessage[]; offset: number; count: number; total: number }>({
	type: 'object',
	properties: {
		messages: { type: 'array', items: { $ref: '#/components/schemas/IMessage' } },
		offset: { type: 'number' },
		count: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['messages', 'offset', 'count', 'total', 'success'],
	additionalProperties: false,
});

const paginatedImsResponseSchema = ajv.compile<{ ims: IRoom[]; offset: number; count: number; total: number }>({
	type: 'object',
	properties: {
		ims: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom with lastMessage compose
		offset: { type: 'number' },
		count: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['ims', 'offset', 'count', 'total', 'success'],
	additionalProperties: false,
});

const dmMessagesOthersEndpointsProps = {
	authRequired: true as const,
	permissionsRequired: ['view-room-administration'],
	response: {
		200: paginatedMessagesResponseSchema,
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
	},
};

const dmMessagesOthersAction = <Path extends string>(_name: Path): TypedAction<typeof dmMessagesOthersEndpointsProps, Path> =>
	async function action() {
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
	};

const dmListEndpointsProps = {
	authRequired: true as const,
	response: {
		200: paginatedImsResponseSchema,
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
	},
};

const dmListAction = <Path extends string>(_name: Path): TypedAction<typeof dmListEndpointsProps, Path> =>
	async function action() {
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
	};

const dmListEveryoneEndpointsProps = {
	authRequired: true as const,
	permissionsRequired: ['view-room-administration'],
	response: {
		200: paginatedImsResponseSchema,
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
	},
};

const dmListEveryoneAction = <Path extends string>(_name: Path): TypedAction<typeof dmListEveryoneEndpointsProps, Path> =>
	async function action() {
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
	};

const dmCreateEndpointsProps = {
	authRequired: true,
	body: isDmCreateProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		200: dmCreateResponseSchema,
	},
} as const;

const dmCreateAction = <Path extends string>(_path: Path): TypedAction<typeof dmCreateEndpointsProps, Path> =>
	async function action() {
		const users =
			'username' in this.bodyParams
				? [this.bodyParams.username]
				: this.bodyParams.usernames.split(',').map((username: string) => username.trim());

		const room = await createDirectMessage(users, this.userId, this.bodyParams.excludeSelf);

		return API.v1.success({
			room: { ...room, _id: room.rid },
		});
	};

const dmEndpoints = API.v1
	.post('im.delete', dmDeleteEndpointsProps, dmDeleteAction('im.delete'))
	.post('dm.delete', dmDeleteEndpointsProps, dmDeleteAction('dm.delete'))
	.post('dm.close', dmCloseEndpointsProps, dmCloseAction('dm.close'))
	.post('im.close', dmCloseEndpointsProps, dmCloseAction('im.close'))
	.post('dm.create', dmCreateEndpointsProps, dmCreateAction('dm.create'))
	.post('im.create', dmCreateEndpointsProps, dmCreateAction('im.create'))
	.post('dm.open', dmOpenEndpointsProps, dmOpenAction('dm.open'))
	.post('im.open', dmOpenEndpointsProps, dmOpenAction('im.open'))
	.post('dm.setTopic', dmSetTopicEndpointsProps, dmSetTopicAction('dm.setTopic'))
	.post('im.setTopic', dmSetTopicEndpointsProps, dmSetTopicAction('im.setTopic'))
	.get('dm.counters', dmCountersEndpointsProps, dmCountersAction('dm.counters'))
	.get('im.counters', dmCountersEndpointsProps, dmCountersAction('im.counters'))
	.get('dm.files', dmFilesEndpointsProps, dmFilesAction('dm.files'))
	.get('im.files', dmFilesEndpointsProps, dmFilesAction('im.files'))
	.get('dm.members', dmMembersEndpointsProps, dmMembersAction('dm.members'))
	.get('im.members', dmMembersEndpointsProps, dmMembersAction('im.members'))
	.get('dm.messages', dmMessagesEndpointsProps, dmMessagesAction('dm.messages'))
	.get('im.messages', dmMessagesEndpointsProps, dmMessagesAction('im.messages'))
	.get('dm.history', dmHistoryEndpointsProps, dmHistoryAction('dm.history'))
	.get('im.history', dmHistoryEndpointsProps, dmHistoryAction('im.history'))
	.get('dm.messages.others', dmMessagesOthersEndpointsProps, dmMessagesOthersAction('dm.messages.others'))
	.get('im.messages.others', dmMessagesOthersEndpointsProps, dmMessagesOthersAction('im.messages.others'))
	.get('dm.list', dmListEndpointsProps, dmListAction('dm.list'))
	.get('im.list', dmListEndpointsProps, dmListAction('im.list'))
	.get('dm.list.everyone', dmListEveryoneEndpointsProps, dmListEveryoneAction('dm.list.everyone'))
	.get('im.list.everyone', dmListEveryoneEndpointsProps, dmListEveryoneAction('im.list.everyone'));

export type DmEndpoints = ExtractRoutesFromAPI<typeof dmEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends DmEndpoints {}
}
