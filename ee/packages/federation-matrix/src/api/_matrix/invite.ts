import type { HomeserverServices, RoomService, StateService } from '@hs/federation-sdk';
import type { PersistentEventBase } from '@hs/room';
import { Room } from '@rocket.chat/core-services';
import type { IUser, UserStatus } from '@rocket.chat/core-typings';
import { Router } from '@rocket.chat/http-router';
import { MatrixBridgedRoom, MatrixBridgedUser, Rooms, Users } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

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
		const delay = delaySec === 625 ? 625 : delaySec ** 2;
		console.log(`error occurred, retrying in ${delay}ms`, e);
		setTimeout(() => {
			runWithBackoff(fn, delay * 1000);
		}, delay);
	}
}

async function joinRoom({
	inviteEvent,
	user, // ours trying to join the room
	room,
	state,
}: {
	inviteEvent: PersistentEventBase;
	user: IUser;
	room: RoomService;
	state: StateService;
}) {
	// from the response we get the event
	if (!inviteEvent.stateKey) {
		throw new Error('join event has missing state key, unable to determine user to join');
	}

	// backoff needed for this call, can fail
	await room.joinUser(inviteEvent.roomId, inviteEvent.stateKey);

	// now we create the room we saved post joining
	const matrixRoom = await state.getFullRoomState2(inviteEvent.roomId);
	if (!matrixRoom) {
		throw new Error('room not found not processing invite');
	}

	// we only understand these two types of rooms
	if (!matrixRoom.isPublic() && !matrixRoom.isInviteOnly()) {
		throw new Error('room is neither public not private, rocketchat is unable to join for now');
	}

	// need both the sender and the participating user to exist in the room
	const internalSenderUserId = await MatrixBridgedUser.getLocalUserIdByExternalId(inviteEvent.sender);

	let senderUserId: string;

	if (!internalSenderUserId) {
		// create locally
		// what we were using previously
		/*
			public getStorageRepresentation(): Readonly<IUser> {
				return {
					_id: this.internalId,
					username: this.internalReference.username || '',
					type: this.internalReference.type,
					status: this.internalReference.status,
					active: this.internalReference.active,
					roles: this.internalReference.roles,
					name: this.internalReference.name,
					requirePasswordChange: this.internalReference.requirePasswordChange,
					createdAt: new Date(),
					_updatedAt: new Date(),
					federated: this.isRemote(),
				};
			}
		*/

		const user = {
			// let the _id auto generate we deal with usernames
			username: inviteEvent.sender,
			type: 'user',
			status: 'online' as UserStatus,
			active: true,
			roles: ['user'],
			name: inviteEvent.sender,
			requirePasswordChange: false,
			federated: true,
			createdAt: new Date(),
			_updatedAt: new Date(),
		};

		const createdUser = await Users.insertOne(user);

		senderUserId = createdUser.insertedId;

		await MatrixBridgedUser.createOrUpdateByLocalId(senderUserId, inviteEvent.sender, true, matrixRoom.origin);
	} else {
		// already got the mapped sender
		const user = await Users.findOneById(internalSenderUserId);
		if (!user) {
			throw new Error('user not found although should have as it is in mapping not processing invite');
		}

		senderUserId = user._id;
	}

	let internalRoomId: string;

	const internalMappedRoomId = await MatrixBridgedRoom.getLocalRoomId(inviteEvent.roomId);

	if (!internalMappedRoomId) {
		const ourRoom = await Room.create(senderUserId, {
			type: matrixRoom.isPublic() ? 'c' : 'p',
			name: matrixRoom.name,
			options: {
				federatedRoomId: inviteEvent.roomId,
				creator: senderUserId,
			},
		});

		internalRoomId = ourRoom._id;
	} else {
		const room = await Rooms.findOneById(internalMappedRoomId);
		if (!room) {
			throw new Error('room not found although should have as it is in mapping not processing invite');
		}

		internalRoomId = room._id;
	}

	await Room.addUserToRoom(internalRoomId, { _id: user._id }, { _id: senderUserId, username: inviteEvent.sender });
}

async function startJoiningRoom(...opts: Parameters<typeof joinRoom>) {
	void runWithBackoff(() => joinRoom(...opts));
}

export const getMatrixInviteRoutes = (services: HomeserverServices) => {
	const { invite, state, room } = services;

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
		async (c) => {
			const { roomId, eventId } = c.req.param();
			const { event, room_version: roomVersion } = await c.req.json();

			const userToCheck = event.state_key as string;

			if (!userToCheck) {
				throw new Error('join event has missing state key, unable to determine user to join');
			}

			const [username /* domain */] = userToCheck.split(':');

			// TODO: check domain

			const ourUser = await Users.findOneByUsername(username.slice(1));

			if (!ourUser) {
				throw new Error('user not found not processing invite');
			}

			const inviteEvent = await invite.processInvite(event, roomId, eventId, roomVersion);

			void startJoiningRoom({
				inviteEvent,
				user: ourUser,
				room,
				state,
			});

			return {
				body: {
					event: inviteEvent.event,
				},
				statusCode: 200,
			};
		},
	);
};
