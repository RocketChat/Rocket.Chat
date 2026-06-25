import { Room } from '@rocket.chat/core-services';
import type { IRoomNativeFederated } from '@rocket.chat/core-typings';
import type { RoomID, UserID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Rooms, Users } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	MATRIX_ROOM_ID_PATTERN,
	MATRIX_USER_ID_PATTERN,
	internalError,
	isEmptyObjectResponseProps,
	isImpersonationQueryProps,
	isMatrixErrorProps,
	isRoomIdParamsProps,
	license,
	tags,
} from './_shared';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const CreateRoomBodySchema = {
	type: 'object',
	properties: {
		room_alias_name: { type: 'string' },
		name: { type: 'string' },
		topic: { type: 'string' },
		visibility: { type: 'string', enum: ['public', 'private'] },
		preset: { type: 'string', enum: ['private_chat', 'trusted_private_chat', 'public_chat'] },
		invite: {
			type: 'array',
			items: { type: 'string', pattern: MATRIX_USER_ID_PATTERN },
		},
		is_direct: { type: 'boolean' },
		initial_state: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					type: { type: 'string' },
					content: { type: 'object' },
				},
				required: ['type', 'content'],
				additionalProperties: true,
			},
		},
	},
	additionalProperties: true,
};

const isCreateRoomBodyProps = ajv.compile(CreateRoomBodySchema);

const CreateRoomResponseSchema = {
	type: 'object',
	properties: {
		room_id: { type: 'string' },
		room_alias: { type: 'string' },
	},
	required: ['room_id'],
};

const isCreateRoomResponseProps = ajv.compile(CreateRoomResponseSchema);

const JoinParamsSchema = {
	type: 'object',
	properties: {
		roomIdOrAlias: { type: 'string' },
	},
	required: ['roomIdOrAlias'],
};

const isJoinParamsProps = ajv.compile(JoinParamsSchema);

const JoinResponseSchema = {
	type: 'object',
	properties: {
		room_id: { type: 'string' },
	},
};

const isJoinResponseProps = ajv.compile(JoinResponseSchema);

const RoomLeaveBodySchema = {
	type: 'object',
	properties: {
		reason: { type: 'string' },
	},
	additionalProperties: true,
};

const isRoomLeaveBodyProps = ajv.compile(RoomLeaveBodySchema);

const InviteBodySchema = {
	type: 'object',
	properties: {
		user_id: { type: 'string', pattern: MATRIX_USER_ID_PATTERN },
		reason: { type: 'string' },
	},
	required: ['user_id'],
	additionalProperties: true,
};

const isInviteBodyProps = ajv.compile(InviteBodySchema);

const KickBodySchema = {
	type: 'object',
	properties: {
		user_id: { type: 'string', pattern: MATRIX_USER_ID_PATTERN },
		reason: { type: 'string' },
	},
	required: ['user_id'],
	additionalProperties: true,
};

const isKickBodyProps = ajv.compile(KickBodySchema);

const RoomLeaveParamsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
	},
	required: ['roomId'],
};

const isRoomLeaveParamsProps = ajv.compile(RoomLeaveParamsSchema);

export const addRoomsLifecycleRoutes = (router: ClientRouter) => {
	router
		// POST /_matrix/client/v3/createRoom
		.post(
			'/v3/createRoom',
			{
				query: isImpersonationQueryProps,
				body: isCreateRoomBodyProps,
				response: {
					200: isCreateRoomResponseProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const senderUsername = c.get('impersonatedUserId') as UserID;
				const body = await c.req.json();

				const serverName = federationSDK.getConfig('serverName');

				const user = await Users.findOneByUsername(senderUsername, { projection: { _id: 1 } });
				if (!user) {
					throw new Error('User not found for creating room');
				}

				const name = body.name || body.room_alias_name || '';

				// get join room from initial_state (for now since this is what bifrost sends)
				const joinRule =
					body.initial_state?.find((e: any) => e.type === 'm.room.join_rules')?.content?.join_rule === 'public' ? 'public' : 'private';

				try {
					const result = await federationSDK.createRoomV2({
						name,
						alias: body.room_alias_name,
						owner: senderUsername,
						joinRule,
					});

					// TODO after creating the federated room we must create the room for rocket.chat as well
					const room = await Rooms.findOne({ 'federation.mrid': result.room_id });
					if (!room) {
						await Room.create<IRoomNativeFederated>(user._id, {
							type: joinRule === 'public' ? 'c' : 'p',
							name,
							members: [senderUsername],
							options: {
								forceNew: true, // an invite means the room does not exist yet
								creator: user._id,
							},
							extraData: {
								federated: true,
								federation: {
									version: 1,
									mrid: result.room_id,
									origin: serverName,
								},
								fname: name,
							},
						});
					}

					for (const invitee of (body.invite ?? []) as string[]) {
						await federationSDK.inviteUserToRoom(invitee as UserID, result.room_id, senderUsername, body.is_direct);
					}

					return {
						statusCode: 200,
						body: {
							room_id: result.room_id,
						},
					};
				} catch (error) {
					return internalError('Failed to create room', error);
				}
			},
		)

		// POST /_matrix/client/v3/join/:roomIdOrAlias
		.post(
			'/v3/join/:roomIdOrAlias',
			{
				params: isJoinParamsProps,
				query: isImpersonationQueryProps,
				response: {
					200: isJoinResponseProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					501: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				// TODO need to first invite and then join?

				await federationSDK.joinUser(c.req.param('roomIdOrAlias'), c.get('impersonatedUserId'));

				// TODO(federation-sdk): joinRoom(userId, roomIdOrAlias) — needs alias resolution + invite-less join
				return {
					statusCode: 200,
					body: {},
				};
			},
		)

		// POST /_matrix/client/v3/rooms/:roomId/leave
		.post(
			'/v3/rooms/:roomId/leave',
			{
				params: isRoomLeaveParamsProps,
				query: isImpersonationQueryProps,
				body: isRoomLeaveBodyProps,
				response: {
					200: isEmptyObjectResponseProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					404: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const roomId = c.req.param('roomId') as RoomID;
				const senderUsername = c.get('impersonatedUserId') as UserID;

				try {
					await federationSDK.leaveRoom(roomId, senderUsername);
					return {
						statusCode: 200,
						body: {},
					};
				} catch (error: any) {
					if (error?.message?.toLowerCase?.().includes('not found')) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Room not found',
							},
						};
					}
					return internalError('Failed to leave room', error, { roomId, senderId: senderUsername });
				}
			},
		)

		// POST /_matrix/client/v3/rooms/:roomId/invite
		.post(
			'/v3/rooms/:roomId/invite',
			{
				params: isRoomIdParamsProps,
				query: isImpersonationQueryProps,
				body: isInviteBodyProps,
				response: {
					200: isEmptyObjectResponseProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const roomId = c.req.param('roomId') as RoomID;
				const senderUsername = c.get('impersonatedUserId') as UserID;
				const body = await c.req.json();

				try {
					await federationSDK.inviteUserToRoom(body.user_id as UserID, roomId, senderUsername);
					return {
						statusCode: 200,
						body: {},
					};
				} catch (error) {
					return internalError('Failed to invite user', error, { roomId, senderUsername });
				}
			},
		)

		// POST /_matrix/client/v3/rooms/:roomId/kick
		.post(
			'/v3/rooms/:roomId/kick',
			{
				params: isRoomIdParamsProps,
				query: isImpersonationQueryProps,
				body: isKickBodyProps,
				response: {
					200: isEmptyObjectResponseProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const roomId = c.req.param('roomId') as RoomID;
				const senderUsername = c.get('impersonatedUserId') as UserID;
				const body = await c.req.json();

				try {
					await federationSDK.kickUser(roomId, body.user_id as UserID, senderUsername, body.reason);
					return {
						statusCode: 200,
						body: {},
					};
				} catch (error) {
					return internalError('Failed to kick user', error, { roomId, senderUsername });
				}
			},
		);
};
