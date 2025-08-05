import type { HomeserverServices } from '@hs/federation-sdk';
import { Room, User } from '@rocket.chat/core-services';
import type { UserStatus } from '@rocket.chat/core-typings';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
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

// const isProcessInviteBodyProps = ajv.compile(RoomMemberEventSchema);

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

export const getMatrixInviteRoutes = (services: HomeserverServices) => {
	const { invite, room, state } = services;

	return new Router('/federation').put(
		'/v2/invite/:roomId/:eventId',
		{
			body: ajv.compile({type: 'object'}),
			params: isProcessInviteParamsProps,
			response: {
				200: isProcessInviteResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		async (c) => {
			const { roomId, eventId } = c.req.param();
			const { event, room_version } = await c.req.json();
			
			const userToCheck = event.state_key as string;
			
			if (!userToCheck) {
				throw new Error('join event has missing state key, unable to determine user to join');
			}
			
			const [username, _domain] = userToCheck.split(':');
			
			// TODO: check domain
			
			const ourUser = await Users.findOneByUsername(username.slice(1));
			if (!ourUser) {
				throw new Error('user not found not processing invite');
			}
			
			console.log('invited user', ourUser)

			const joinEvent = await invite.processInvite(event, roomId, eventId, room_version);
			
			console.log('will join room in 5 seconds');

			setTimeout(async () => {
				try {
					// from the response we get the event
					if (!joinEvent.stateKey) {
						throw new Error('join event has missing state key, unable to determine user to join');
					}

					const joinEventId = await room.joinUser(joinEvent.roomId, joinEvent.stateKey);
					
					console.log('joined room', joinEventId);
					
					// now we create the room we saved post joining
					const matrixRoom = await state.getFullRoomState2(joinEvent.roomId);
					if (!matrixRoom) {
						throw new Error('room not found not processing invite');
					}
					
					if (!matrixRoom.isPublic() && !matrixRoom.isInviteOnly()) {
						throw new Error('room is neither public not private, rocketchat is unable to join for now');
					}
					
					// need both the sender and the participating user to exist in the room
					const internalUser = await MatrixBridgedUser.getLocalUserIdByExternalId(joinEvent.sender);
					let senderUserId: string;
					if (!internalUser) {
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
						   username: joinEvent.sender,
						   type: 'user',
						   status: 'online' as UserStatus,
						   active: true,
						   roles: ['user'],
						   name: joinEvent.sender,
						   requirePasswordChange: false,
						   federated: true,
						   createdAt: new Date(),
						   _updatedAt: new Date(),
					   }
					   
					   const createdUser = await Users.insertOne(user);
					   senderUserId = createdUser.insertedId;
					   
					   await MatrixBridgedUser.createOrUpdateByLocalId(senderUserId, joinEvent.sender, true, matrixRoom.origin)
					   
					   console.log('created user', createdUser, senderUserId);
					} else {
						const user = await Users.findOneById(internalUser);
						if (!user) {
							throw new Error('user not found although should have as it is in mapping not processing invite');
						}
						senderUserId = user._id;
						console.log('sender user', senderUserId);
					}
					
						let internalRoomId: string;

					const internalRoom = await MatrixBridgedRoom.getLocalRoomId(joinEvent.roomId);

					if (!internalRoom) {
						
					
					const ourRoom = await Room.create(senderUserId, {
						type: matrixRoom.isPublic() ? 'c' : 'p',
						name: matrixRoom.name,
					}, true);
					
					await MatrixBridgedRoom.createOrUpdateByLocalRoomId(ourRoom._id, joinEvent.roomId, matrixRoom.origin);
					
					console.log('created room', ourRoom);
					
					await Rooms.setAsFederated(ourRoom._id);
					
					internalRoomId = ourRoom._id;
				} else {
					const room = await Rooms.findOneById(internalRoom);
					if (!room) {
						throw new Error('room not found although should have as it is in mapping not processing invite');
					}
					internalRoomId = room._id;
				}
					
					await Room.addUserToRoom(internalRoomId, { _id: ourUser._id }, { _id: senderUserId, username: joinEvent.sender });
				} catch (e) {
					console.error('error creating room', e);
				}
			}, 5 * 1000); // five seconds later

			return {
				body: { event: joinEvent.event },
				statusCode: 200,
			};
		},
	);
};
