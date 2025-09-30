import { Room } from '@rocket.chat/core-services';
import type { IUser, UserStatus } from '@rocket.chat/core-typings';
import type {
	HomeserverServices,
	RoomService,
	StateService,
	PduMembershipEventContent,
	PersistentEventBase,
	RoomVersion,
} from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { Rooms, Users } from '@rocket.chat/models';
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
	inviteEvent: PersistentEventBase<RoomVersion, 'm.room.member'>;
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

	// we only understand these two types of rooms, plus direct messages
	const isDM = inviteEvent.getContent<PduMembershipEventContent>().is_direct;

	if (!isDM && !matrixRoom.isPublic() && !matrixRoom.isInviteOnly()) {
		throw new Error('room is neither public, private, nor direct message - rocketchat is unable to join for now');
	}

	// need both the sender and the participating user to exist in the room
	// TODO implement on model
	const senderUser = await Users.findOne({ 'federation.mui': inviteEvent.sender }, { projection: { _id: 1 } });

	let senderUserId = senderUser?._id;

	// create locally
	if (!senderUser) {
		const createdUser = await Users.insertOne({
			// let the _id auto generate we deal with usernames
			username: inviteEvent.sender,
			type: 'user',
			status: 'online' as UserStatus,
			active: true,
			roles: ['user'],
			name: inviteEvent.sender,
			requirePasswordChange: false,
			federated: true,
			federation: {
				version: 1,
				mui: inviteEvent.sender,
				origin: matrixRoom.origin,
			},
			createdAt: new Date(),
			_updatedAt: new Date(),
		});

		senderUserId = createdUser.insertedId;
	}

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

	// TODO is this needed?
	// if (isDM) {
	// 	await MatrixBridgedRoom.createOrUpdateByLocalRoomId(internalRoomId, inviteEvent.roomId, matrixRoom.origin);
	// }
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

			setTimeout(
				() => {
					void startJoiningRoom({
						inviteEvent,
						user: ourUser,
						room,
						state,
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
		},
	);
};
