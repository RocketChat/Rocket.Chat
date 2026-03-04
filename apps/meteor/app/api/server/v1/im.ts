/**
 * Docs: https://github.com/RocketChat/developer-docs/blob/master/reference/api/rest-api/endpoints/team-collaboration-endpoints/im-endpoints
 */
import type { IMessage, IRoom, ISubscription, IUploadWithUser, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Uploads, Messages, Rooms, Users } from '@rocket.chat/models';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
	type PaginatedResult,
	type PaginatedRequest,
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
import type { ExtractRoutesFromAPI, Prettify } from '../ApiClass';
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

type DmCreateProps = (
	| {
			usernames: string;
	  }
	| {
			username: string;
	  }
) & { excludeSelf?: boolean };

const isDmCreateProps = ajv.compile<DmCreateProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				usernames: {
					type: 'string',
				},
				excludeSelf: {
					type: 'boolean',
				},
			},
			required: ['usernames'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				username: {
					type: 'string',
				},
				excludeSelf: {
					type: 'boolean',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});

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

type DmListProps = PaginatedRequest<{ fields?: string }>;

const isDmListProps = ajv.compile<DmListProps>({
	type: 'object',
	properties: {
		fields: {
			type: 'string',
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
	},
	additionalProperties: false,
});

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

type DmListEveryoneProps = PaginatedRequest<{ query: string; fields?: string }>;

const isDmListEveryoneProps = ajv.compile<DmListEveryoneProps>({
	type: 'object',
	properties: {
		query: {
			type: 'string',
		},
		fields: {
			type: 'string',
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
	},
	additionalProperties: false,
});

API.v1.addRoute(
	['dm.list.everyone', 'im.list.everyone'],
	{ authRequired: true, permissionsRequired: ['view-room-administration'], validateParams: isDmListEveryoneProps },
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

type DmFileProps = PaginatedRequest<
	({ roomId: string; username?: string } | { roomId?: string; username: string }) & {
		name?: string;
		typeGroup?: string;
		query?: string;
		onlyConfirmed?: boolean;
	}
>;

const isDmFileProps = ajv.compile<DmFileProps>({
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: true,
		},
		username: {
			type: 'string',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		name: {
			type: 'string',
			nullable: true,
		},
		typeGroup: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
		onlyConfirmed: {
			type: 'boolean',
		},
	},
	oneOf: [{ required: ['roomId'] }, { required: ['username'] }],
	required: [],
	additionalProperties: false,
});

API.v1.addRoute(
	['dm.files', 'im.files'],
	{
		authRequired: true,
		validateParams: isDmFileProps,
	},
	{
		async get() {
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
		},
	},
);

type DmMemberProps = PaginatedRequest<
	(
		| {
				roomId: string;
		  }
		| {
				username: string;
		  }
	) & {
		status?: string[];
		filter?: string;
	}
>;

const isDmMemberProps = ajv.compile<DmMemberProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				status: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
				filter: {
					type: 'string',
				},
				query: {
					type: 'string',
				},
				sort: {
					type: 'string',
				},
				count: {
					type: 'number',
				},
				offset: {
					type: 'number',
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
				status: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
				filter: {
					type: 'string',
				},
				query: {
					type: 'string',
				},
				sort: {
					type: 'string',
				},
				count: {
					type: 'number',
				},
				offset: {
					type: 'number',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});

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

			const { cursor, totalCount } = Users.findPaginatedByActiveUsersExcept(filter, [], options, searchFields, [extraQuery]);

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
		},
	},
);

type DmDeleteProps =
	| {
			roomId: string;
	  }
	| {
			username: string;
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

type DmCloseProps = {
	roomId: string;
};

const DmClosePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
	},
	required: ['roomId', 'userId'],
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
				return API.v1.forbidden('unauthorized');
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

type DmCountersProps = {
	roomId: string;
	userId?: string;
};

const isDmCountersProps = ajv.compile<DmCountersProps>({
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
	},
	additionalProperties: false,
});

const dmCountersEndpointsProps = {
	authRequired: true,
	query: isDmCountersProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: ajv.compile<{
			joined: boolean;
			unreads: number | null;
			unreadsFrom: string | null;
			msgs: number | null;
			members: number | null;
			latest: string | null;
			userMentions: number | null;
		}>({
			type: 'object',
			properties: {
				success: {
					type: 'boolean',
					enum: [true],
				},
				joined: {
					type: 'boolean',
				},
				unreads: {
					type: ['number', 'null'],
				},
				unreadsFrom: {
					type: ['string', 'null'],
				},
				msgs: {
					type: ['number', 'null'],
				},
				members: {
					type: ['number', 'null'],
				},
				latest: {
					type: ['string', 'null'],
				},
				userMentions: {
					type: ['number', 'null'],
				},
			},
			required: ['success', 'joined', 'unreads', 'unreadsFrom', 'msgs', 'members', 'latest', 'userMentions'],
			additionalProperties: false,
		}),
	},
} as const;

const dmCountersAction = <Path extends string>(_path: Path): TypedAction<typeof dmCountersEndpointsProps, Path> =>
	async function action() {
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
				return API.v1.forbidden('unauthorized');
			}
			user = ruserId;
		}
		const canAccess = await canAccessRoomIdAsync(roomId, user);

		if (!canAccess) {
			return API.v1.forbidden('unauthorized');
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

type DmHistoryProps = PaginatedRequest<{
	roomId: string;
	latest?: string;
	oldest?: string;
	inclusive?: 'false' | 'true';
	unreads?: 'true' | 'false';
	showThreadMessages?: 'false' | 'true';
}>;

const isDmHistoryProps = ajv.compile<DmHistoryProps>({
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		latest: {
			type: 'string',
			minLength: 1,
		},
		showThreadMessages: {
			type: 'string',
			enum: ['false', 'true'],
		},
		oldest: {
			type: 'string',
			minLength: 1,
		},
		inclusive: {
			type: 'string',
			enum: ['false', 'true'],
		},
		unreads: {
			type: 'string',
			enum: ['true', 'false'],
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
});

const dmHistoryEndpointsProps = {
	authRequired: true,
	query: isDmHistoryProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: ajv.compile<IMessage[] | { messages: IMessage[]; firstUnread?: any; unreadNotLoaded?: number | undefined }>({
			anyOf: [
				{
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							enum: [true],
						},
						messages: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/IMessage',
							},
						},
					},
					required: ['success', 'messages'],
					additionalProperties: false,
				},
				{
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							enum: [true],
						},
						messages: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/IMessage',
							},
						},
						firstUnread: {
							type: 'object',
							additionalProperties: true,
						},
						unreadNotLoaded: {
							type: 'number',
						},
					},
					required: ['success', 'messages'],
					additionalProperties: false,
				},
			],
		}),
	},
} as const;

const dmHistoryAction = <Path extends string>(_path: Path): TypedAction<typeof dmHistoryEndpointsProps, Path> =>
	async function action() {
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
			return API.v1.forbidden('unauthorized');
		}

		return API.v1.success(result);
	};

type DmMessagesProps = Prettify<
	PaginatedRequest<
		({ roomId: string } | { username: string }) & {
			query?: string;
			mentionIds?: string;
			starredIds?: string;
			pinned?: string;
			fields?: string;
		}
	>
>;

const isDmMessagesProps = ajv.compile<DmMessagesProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
				mentionIds: {
					type: 'string',
				},
				starredIds: {
					type: 'string',
				},
				pinned: {
					type: 'string',
				},
				fields: {
					type: 'string',
				},
				query: {
					type: 'string',
				},
				sort: {
					type: 'string',
				},
				count: {
					type: 'number',
				},
				offset: {
					type: 'number',
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
				mentionIds: {
					type: 'string',
				},
				starredIds: {
					type: 'string',
				},
				pinned: {
					type: 'string',
				},
				query: {
					type: 'string',
				},
				fields: {
					type: 'string',
				},
				sort: {
					type: 'string',
				},
				count: {
					type: 'number',
				},
				offset: {
					type: 'number',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});

const dmMessagesEndpointsProps = {
	authRequired: true,
	query: isDmMessagesProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: ajv.compile<
			PaginatedResult<{
				messages: IMessage[];
			}>
		>({
			type: 'object',
			properties: {
				success: {
					type: 'boolean',
					enum: [true],
				},
				messages: {
					type: 'array',
					items: {
						$ref: '#/components/schemas/IMessage',
					},
				},
				count: {
					type: 'number',
				},
				offset: {
					type: 'number',
				},
				total: {
					type: 'number',
				},
			},
			required: ['success', 'messages', 'count', 'offset', 'total'],
			additionalProperties: false,
		}),
	},
} as const;

const dmMessagesAction = <Path extends string>(_path: Path): TypedAction<typeof dmMessagesEndpointsProps, Path> =>
	async function action() {
		const { roomId, username, mentionIds, starredIds, pinned } = this.queryParams;

		const { room } = await findDirectMessageRoom({ ...(roomId ? { roomId } : { username }) }, this.userId);

		const canAccess = await canAccessRoomIdAsync(room._id, this.userId);
		if (!canAccess) {
			return API.v1.forbidden('unauthorized');
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
			...(pinned?.toLowerCase() === 'true' ? { pinned: true } : {}),
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

type DmMessagesOthersProps = PaginatedRequest<{ roomId: IRoom['_id']; query?: string; fields?: string }>;

const isDmMessagesOthersProps = ajv.compile<DmMessagesOthersProps>({
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
		fields: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
});

const dmMessagesOthersEndpointsProps = {
	authRequired: true,
	permissionsRequired: ['view-room-administration'],
	query: isDmMessagesOthersProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: ajv.compile<PaginatedResult<{ messages: IMessage[] }>>({
			type: 'object',
			properties: {
				success: {
					type: 'boolean',
					enum: [true],
				},
				messages: {
					type: 'array',
					items: {
						$ref: '#/components/schemas/IMessage',
					},
				},
				count: {
					type: 'number',
				},
				offset: {
					type: 'number',
				},
				total: {
					type: 'number',
				},
			},
			required: ['success', 'messages', 'count', 'offset', 'total'],
			additionalProperties: false,
		}),
	},
};

const dmMessagesOthersAction = <Path extends string>(_path: Path): TypedAction<typeof dmMessagesOthersEndpointsProps, Path> =>
	async function action() {
		if (settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
			throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
				route: '/api/v1/im.messages.others',
			});
		}

		const { roomId } = this.queryParams;

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

type DmOpenProps = {
	roomId: string;
};

const isDmOpenProps = ajv.compile<DmOpenProps>({
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
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

const dmOpenAction = <Path extends string>(_path: Path): TypedAction<typeof dmOpenEndpointsProps, Path> =>
	async function action() {
		const { roomId } = this.bodyParams;

		if (!roomId) {
			throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
		}
		const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
		if (!canAccess) {
			return API.v1.forbidden('unauthorized');
		}

		const { room, subscription } = await findDirectMessageRoom({ roomId }, this.userId);

		if (!subscription?.open) {
			await openRoom(this.userId, room._id);
		}

		return API.v1.success();
	};

type DmSetTopicProps = {
	roomId: string;
	topic?: string;
};

const isDmSetTopicProps = ajv.compile<DmSetTopicProps>({
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		topic: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
});

const dmSetTopicEndpointsProps = {
	authRequired: true,
	body: isDmSetTopicProps,
	response: {
		400: validateBadRequestErrorResponse,
		401: validateUnauthorizedErrorResponse,
		403: validateForbiddenErrorResponse,
		200: ajv.compile<{
			topic?: string;
		}>({
			type: 'object',
			properties: {
				success: {
					type: 'boolean',
					enum: [true],
				},
				topic: {
					type: 'string',
				},
			},
			required: ['success'],
			additionalProperties: false,
		}),
	},
} as const;

const dmSetTopicAction = <Path extends string>(_path: Path): TypedAction<typeof dmSetTopicEndpointsProps, Path> =>
	async function action() {
		const { roomId, topic } = this.bodyParams;

		if (!roomId) {
			throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" is required');
		}

		const canAccess = await canAccessRoomIdAsync(roomId, this.userId);
		if (!canAccess) {
			return API.v1.forbidden('unauthorized');
		}

		const { room } = await findDirectMessageRoom({ roomId }, this.userId);

		await saveRoomSettings(this.userId, room._id, 'roomTopic', topic);

		return API.v1.success({
			topic,
		});
	};

const dmEndpoints = API.v1
	.post('im.delete', dmDeleteEndpointsProps, dmDeleteAction('im.delete'))
	.post('dm.delete', dmDeleteEndpointsProps, dmDeleteAction('dm.delete'))
	.post('dm.close', dmCloseEndpointsProps, dmCloseAction('dm.close'))
	.post('im.close', dmCloseEndpointsProps, dmCloseAction('im.close'))
	.get('dm.counters', dmCountersEndpointsProps, dmCountersAction('dm.counters'))
	.get('im.counters', dmCountersEndpointsProps, dmCountersAction('im.counters'))
	.get('dm.history', dmHistoryEndpointsProps, dmHistoryAction('dm.history'))
	.get('im.history', dmHistoryEndpointsProps, dmHistoryAction('im.history'))
	.get('dm.messages', dmMessagesEndpointsProps, dmMessagesAction('dm.messages'))
	.get('im.messages', dmMessagesEndpointsProps, dmMessagesAction('im.messages'))
	.get('dm.messages.others', dmMessagesOthersEndpointsProps, dmMessagesOthersAction('dm.messages.others'))
	.get('im.messages.others', dmMessagesOthersEndpointsProps, dmMessagesOthersAction('im.messages.others'))
	.post('dm.open', dmOpenEndpointsProps, dmOpenAction('dm.open'))
	.post('im.open', dmOpenEndpointsProps, dmOpenAction('im.open'))
	.post('dm.setTopic', dmSetTopicEndpointsProps, dmSetTopicAction('dm.setTopic'))
	.post('im.setTopic', dmSetTopicEndpointsProps, dmSetTopicAction('im.setTopic'));

type DmKickProps = {
	roomId: string;
};

type DmLeaveProps =
	| {
			roomId: string;
	  }
	| { roomName: string };

type DmEndpoints = ExtractRoutesFromAPI<typeof dmEndpoints> & {
	'/v1/im.kick': {
		POST: (params: DmKickProps) => void;
	};
	'/v1/dm.kick': {
		POST: (params: DmKickProps) => void;
	};
	'/v1/im.leave': {
		POST: (params: DmLeaveProps) => void;
	};
	'/v1/dm.leave': {
		POST: (params: DmLeaveProps) => void;
	};
	'/v1/im.list': {
		GET: (params: PaginatedRequest<{ fields?: string }>) => PaginatedResult<{ ims: IRoom[] }>;
	};
	'/v1/dm.list': {
		GET: (params: PaginatedRequest<{ fields?: string }>) => PaginatedResult<{ ims: IRoom[] }>;
	};
	'/v1/im.list.everyone': {
		GET: (params: PaginatedRequest<{ query: string; fields?: string }>) => PaginatedResult<{ ims: IRoom[] }>;
	};
	'/v1/dm.list.everyone': {
		GET: (params: PaginatedRequest<{ query: string; fields?: string }>) => PaginatedResult<{ ims: IRoom[] }>;
	};
	'/v1/im.files': {
		GET: (params: DmFileProps) => PaginatedResult<{
			files: IUploadWithUser[];
		}>;
	};
	'/v1/dm.files': {
		GET: (params: DmFileProps) => PaginatedResult<{
			files: IUploadWithUser[];
		}>;
	};
	'/v1/im.members': {
		GET: (params: DmMemberProps) => PaginatedResult<{
			members: (Pick<IUser, '_id' | 'status' | 'name' | 'username' | 'utcOffset'> & {
				subscription: Pick<ISubscription, '_id' | 'status' | 'ts' | 'roles'>;
			})[];
		}>;
	};
	'/v1/dm.members': {
		GET: (params: DmMemberProps) => PaginatedResult<{
			members: (Pick<IUser, '_id' | 'status' | 'name' | 'username' | 'utcOffset'> & {
				subscription: Pick<ISubscription, '_id' | 'status' | 'ts' | 'roles'>;
			})[];
		}>;
	};
};

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends DmEndpoints {}
}
