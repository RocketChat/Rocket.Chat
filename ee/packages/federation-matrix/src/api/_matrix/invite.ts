import { Authorization, Room } from '@rocket.chat/core-services';
import { isUserNativeFederated, type IUser } from '@rocket.chat/core-typings';
import type { PduMembershipEventContent, PersistentEventBase, RoomVersion } from '@rocket.chat/federation-sdk';
import { eventIdSchema, roomIdSchema, NotAllowedError, federationSDK } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Users } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

import { createOrUpdateFederatedUser, getUsernameServername } from '../../FederationMatrix';
import { isAuthenticatedMiddleware } from '../middlewares/isAuthenticated';

const logger = new Logger('federation-matrix:invite');

const EventBaseSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
			description: 'Event type',
		},
		content: {
			type: 'object',
			description: 'Event content',
		},
		sender: {
			type: 'string',
		},
		room_id: {
			type: 'string',
		},
		origin_server_ts: {
			type: 'number',
		},
		depth: {
			type: 'number',
		},
		prev_events: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Previous events in the room',
		},
		auth_events: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Authorization events',
		},
		origin: {
			type: 'string',
			description: 'Origin server',
		},
		hashes: {
			type: 'object',
			nullable: true,
		},
		signatures: {
			type: 'object',
			nullable: true,
		},
		unsigned: {
			type: 'object',
			description: 'Unsigned data',
			nullable: true,
		},
	},
	required: ['type', 'content', 'sender', 'room_id', 'origin_server_ts', 'depth', 'prev_events', 'auth_events', 'origin'],
};

const MembershipEventContentSchema = {
	type: 'object',
	properties: {
		membership: {
			type: 'string',
		},
		displayname: {
			type: 'string',
			nullable: true,
		},
		avatar_url: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['membership'],
};

const RoomMemberEventSchema = {
	type: 'object',
	allOf: [
		EventBaseSchema,
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					const: 'm.room.member',
				},
				content: MembershipEventContentSchema,
				state_key: {
					type: 'string',
				},
			},
			required: ['type', 'content', 'state_key'],
		},
	],
};

const ProcessInviteParamsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		eventId: {
			type: 'string',
		},
	},
	required: ['roomId', 'eventId'],
};

const isProcessInviteParamsProps = ajv.compile(ProcessInviteParamsSchema);

const ProcessInviteResponseSchema = {
	type: 'object',
	properties: {
		event: RoomMemberEventSchema,
	},
	required: ['event'],
};

const isProcessInviteResponseProps = ajv.compile(ProcessInviteResponseSchema);

// 5 seconds
// 25 seconds
// 625 seconds = 10 minutes 25 seconds // max
async function runWithBackoff(fn: () => Promise<void>, delaySec = 5) {
	try {
		await fn();
	} catch (e) {
		// don't retry on authorization/validation errors - they won't succeed on retry
		if (e instanceof NotAllowedError) {
			logger.error('Authorization error, not retrying:', e);
			return;
		}

		const delay = Math.min(625, delaySec ** 2);
		logger.error(`error occurred, retrying in ${delay}s`, e);
		setTimeout(() => {
			runWithBackoff(fn, delay);
		}, delay * 1000);
	}
}

async function joinRoom({
	inviteEvent,
	user, // ours trying to join the room
}: {
	inviteEvent: PersistentEventBase<RoomVersion, 'm.room.member'>;
	user: IUser;
}) {
	// from the response we get the event
	if (!inviteEvent.stateKey) {
		throw new Error('join event has missing state key, unable to determine user to join');
	}

	// backoff needed for this call, can fail
	await federationSDK.joinUser(inviteEvent, inviteEvent.event.state_key);

	// now we create the room we saved post joining
	const matrixRoom = await federationSDK.getLatestRoomState2(inviteEvent.roomId);
	if (!matrixRoom) {
		throw new Error('room not found not processing invite');
	}

	// we only understand these two types of rooms, plus direct messages
	const isDM = inviteEvent.getContent<PduMembershipEventContent>().is_direct;

	if (!isDM && !matrixRoom.isPublic() && !matrixRoom.isInviteOnly()) {
		throw new Error('room is neither direct message - rocketchat is unable to join for now');
	}

	// need both the sender and the participating user to exist in the room
	// TODO implement on model
	const senderUser = await Users.findOneByUsername(inviteEvent.sender, { projection: { _id: 1 } });

	const senderUserId =
		senderUser?._id ||
		(await createOrUpdateFederatedUser({
			username: inviteEvent.sender,
			origin: matrixRoom.origin,
		}));

	if (!senderUserId) {
		throw new Error('Sender user ID not found');
	}

	let internalRoomId: string;

	const internalMappedRoom = await Rooms.findOne({ 'federation.mrid': inviteEvent.roomId });

	if (!internalMappedRoom) {
		let roomType: 'c' | 'p' | 'd';

		if (isDM) {
			roomType = 'd';
		} else if (matrixRoom.isPublic()) {
			roomType = 'c';
		} else if (matrixRoom.isInviteOnly()) {
			roomType = 'p';
		} else {
			throw new Error('room is neither public, private, nor direct message - rocketchat is unable to join for now');
		}

		let ourRoom: { _id: string };

		if (isDM) {
			const senderUser = await Users.findOneById(senderUserId, { projection: { _id: 1, username: 1 } });
			const inviteeUser = user;

			if (!senderUser?.username) {
				throw new Error('Sender user not found');
			}
			if (!inviteeUser?.username) {
				throw new Error('Invitee user not found');
			}

			ourRoom = await Room.create(senderUserId, {
				type: roomType,
				name: inviteEvent.sender,
				members: [senderUser.username, inviteeUser.username],
				options: {
					federatedRoomId: inviteEvent.roomId,
					creator: senderUserId,
				},
				extraData: {
					federated: true,
				},
			});
		} else {
			const roomFname = `${matrixRoom.name}:${matrixRoom.origin}`;
			const roomName = inviteEvent.roomId.replace('!', '').replace(':', '_');

			ourRoom = await Room.create(senderUserId, {
				type: roomType,
				name: roomName,
				options: {
					federatedRoomId: inviteEvent.roomId,
					creator: senderUserId,
				},
				extraData: {
					federated: true,
					fname: roomFname,
				},
			});
		}

		internalRoomId = ourRoom._id;
	} else {
		internalRoomId = internalMappedRoom._id;
	}

	await Room.addUserToRoom(internalRoomId, { _id: user._id }, { _id: senderUserId, username: inviteEvent.sender });
}

async function startJoiningRoom(...opts: Parameters<typeof joinRoom>) {
	void runWithBackoff(() => joinRoom(...opts));
}

// This is a special case where inside rocket chat we invite users inside rockechat, so if the sender or the invitee are external iw should throw an error
export const acceptInvite = async (inviteEvent: PersistentEventBase<RoomVersion, 'm.room.member'>, username: string) => {
	if (!inviteEvent.stateKey) {
		throw new Error('join event has missing state key, unable to determine user to join');
	}

	const internalMappedRoom = await Rooms.findOne({ 'federation.mrid': inviteEvent.roomId });
	if (!internalMappedRoom) {
		throw new Error('room not found not processing invite');
	}

	const serverName = federationSDK.getConfig('serverName');

	const inviter = await Users.findOneByUsername<Pick<IUser, '_id' | 'username'>>(getUsernameServername(inviteEvent.sender, serverName)[0], {
		projection: { _id: 1, username: 1 },
	});

	if (!inviter) {
		throw new Error('Sender user ID not found');
	}
	if (isUserNativeFederated(inviter)) {
		throw new Error('Sender user is native federated');
	}

	const user = await Users.findOneByUsername<Pick<IUser, '_id' | 'username' | 'federation' | 'federated'>>(username, {
		projection: { username: 1, federation: 1, federated: 1 },
	});

	// we cannot accept invites from users that are external
	if (!user) {
		throw new Error('User not found');
	}
	if (isUserNativeFederated(user)) {
		throw new Error('User is native federated');
	}

	await federationSDK.joinUser(inviteEvent, inviteEvent.event.state_key);
};

export const getMatrixInviteRoutes = () => {
	const logger = new Logger('matrix-invite');

	return new Router('/federation').put(
		'/v2/invite/:roomId/:eventId',
		{
			body: ajv.compile({ type: 'object' }), // TODO: add schema from room package.
			params: isProcessInviteParamsProps,
			response: {
				200: isProcessInviteResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		isAuthenticatedMiddleware(),
		async (c) => {
			const { roomId, eventId } = c.req.param();
			const { event, room_version: roomVersion, invite_room_state: strippedStateEvents } = await c.req.json();

			const userToCheck = event.state_key as string;

			if (!userToCheck) {
				throw new Error('join event has missing state key, unable to determine user to join');
			}

			if (!strippedStateEvents?.some((e: any) => e.type === 'm.room.create')) {
				return {
					body: {
						errcode: 'M_MISSING_PARAM',
						error: 'Missing invite_room_state: m.room.create event is required',
					},
					statusCode: 400,
				};
			}

			const [username /* domain */] = userToCheck.split(':');

			// TODO: check domain

			const ourUser = await Users.findOneByUsername(username.slice(1));

			if (!ourUser) {
				throw new Error('user not found not processing invite');
			}

			// check federation permission before processing the invite
			if (!(await Authorization.hasPermission(ourUser._id, 'access-federation'))) {
				logger.info(`User ${userToCheck} denied federation access, rejecting invite to room ${roomId}`);

				return {
					body: {
						errcode: 'M_FORBIDDEN',
						error: 'User does not have permission to access federation',
					},
					statusCode: 403,
				};
			}

			try {
				const inviteEvent = await federationSDK.processInvite(
					event,
					roomIdSchema.parse(roomId),
					eventIdSchema.parse(eventId),
					roomVersion,
					c.get('authenticatedServer'),
					strippedStateEvents,
				);

				setTimeout(
					() => {
						void startJoiningRoom({
							inviteEvent,
							user: ourUser,
						});
					},
					inviteEvent.event.content.is_direct ? 2000 : 0,
				);

				return {
					body: {
						event: inviteEvent.event,
					},
					statusCode: 200,
				};
			} catch (error) {
				if (error instanceof NotAllowedError) {
					return {
						body: {
							errcode: 'M_FORBIDDEN',
							error: 'This server does not allow joining this type of room based on federation settings.',
						},
						statusCode: 403,
					};
				}

				logger.error({ msg: 'Error processing invite', err: error });

				return {
					body: {
						errcode: 'M_UNKNOWN',
						error: error instanceof Error ? error.message : 'Internal server error while processing request',
					},
					statusCode: 500,
				};
			}
		},
	);
};
