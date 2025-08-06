import 'reflect-metadata';

import { ConfigService, createFederationContainer, getAllServices } from '@hs/federation-sdk';
import type { HomeserverEventSignatures, HomeserverServices, FederationContainerOptions } from '@hs/federation-sdk';
import { type IFederationMatrixService, Room, ServiceClass, Settings } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedUser, MatrixBridgedRoom, Users, Subscriptions, Messages, Rooms } from '@rocket.chat/models';
import emojione from 'emojione';

import { getWellKnownRoutes } from './api/.well-known/server';
import { getMatrixInviteRoutes } from './api/_matrix/invite';
import { getKeyServerRoutes } from './api/_matrix/key/server';
import { getMatrixProfilesRoutes } from './api/_matrix/profiles';
import { getMatrixRoomsRoutes } from './api/_matrix/rooms';
import { getMatrixSendJoinRoutes } from './api/_matrix/send-join';
import { getMatrixTransactionsRoutes } from './api/_matrix/transactions';
import { getFederationVersionsRoutes } from './api/_matrix/versions';
import { registerEvents } from './events';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';

	private eventHandler: Emitter<HomeserverEventSignatures>;

	private homeserverServices: HomeserverServices;

	private matrixDomain: string;

	private readonly logger = new Logger(this.name);

	private httpRoutes: { matrix: Router<'/_matrix'>; wellKnown: Router<'/.well-known'> };

	private constructor(emitter?: Emitter<HomeserverEventSignatures>) {
		super();
		this.eventHandler = emitter || new Emitter<HomeserverEventSignatures>();
	}

	static async create(emitter?: Emitter<HomeserverEventSignatures>): Promise<FederationMatrix> {
		const instance = new FederationMatrix(emitter);
		const settingsSigningKey = await Settings.get<string>('Federation_Service_Matrix_Signing_Key');
		const config = new ConfigService({
			serverName: process.env.MATRIX_SERVER_NAME || 'rc1',
			keyRefreshInterval: Number.parseInt(process.env.MATRIX_KEY_REFRESH_INTERVAL || '60', 10),
			matrixDomain: process.env.MATRIX_DOMAIN || 'rc1',
			version: process.env.SERVER_VERSION || '1.0',
			port: Number.parseInt(process.env.SERVER_PORT || '8080', 10),
			signingKey: settingsSigningKey,
			signingKeyPath: process.env.CONFIG_FOLDER || './rc1.signing.key',
			database: {
				uri: process.env.MONGODB_URI || 'mongodb://localhost:3001/meteor',
				name: process.env.DATABASE_NAME || 'meteor',
				poolSize: Number.parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
			},
		});

		const containerOptions: FederationContainerOptions = {
			emitter: instance.eventHandler,
		};

		createFederationContainer(containerOptions, config);
		instance.homeserverServices = getAllServices();
		instance.buildMatrixHTTPRoutes();

		return instance;
	}

	private buildMatrixHTTPRoutes() {
		const matrix = new Router('/_matrix');
		const wellKnown = new Router('/.well-known');

		matrix
			.use(getMatrixInviteRoutes(this.homeserverServices))
			.use(getMatrixProfilesRoutes(this.homeserverServices))
			.use(getMatrixRoomsRoutes(this.homeserverServices))
			.use(getMatrixSendJoinRoutes(this.homeserverServices))
			.use(getMatrixTransactionsRoutes(this.homeserverServices))
			.use(getKeyServerRoutes(this.homeserverServices))
			.use(getFederationVersionsRoutes(this.homeserverServices));

		wellKnown.use(getWellKnownRoutes(this.homeserverServices));

		this.httpRoutes = { matrix, wellKnown };
	}

	async created(): Promise<void> {
		try {
			registerEvents(this.eventHandler);
		} catch (error) {
			this.logger.warn('Homeserver module not available, running in limited mode');
		}
	}

	async getMatrixDomain(): Promise<string> {
		if (this.matrixDomain) {
			return this.matrixDomain;
		}

		const port = await Settings.get<number>('Federation_Service_Matrix_Port');
		const domain = await Settings.get<string>('Federation_Service_Matrix_Domain');

		this.matrixDomain = port === 443 || port === 80 ? domain : `${domain}:${port}`;

		return this.matrixDomain;
	}

	getAllRoutes() {
		return this.httpRoutes;
	}

	async createRoom(room: IRoom, owner: IUser, members: string[]): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping room creation');
			return;
		}

		if (!(room.t === 'c' || room.t === 'p')) {
			throw new Error('Room is not a public or private room');
		}

		try {
			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${owner.username}:${matrixDomain}`;
			const roomName = room.name || room.fname || 'Untitled Room';

			// canonical alias computed from name
			const matrixRoomResult = await this.homeserverServices.room.createRoom(matrixUserId, roomName, room.t === 'c' ? 'public' : 'invite');

			this.logger.debug('Matrix room created:', matrixRoomResult);

			await MatrixBridgedRoom.createOrUpdateByLocalRoomId(room._id, matrixRoomResult.room_id, matrixDomain);

			await MatrixBridgedUser.createOrUpdateByLocalId(owner._id, matrixUserId, true, matrixDomain);

			for await (const member of members) {
				if (member === owner.username) {
					continue;
				}

				try {
					// TODO: Check if it is external user - split domain etc
					const localUserId = await Users.findOneByUsername(member);
					if (localUserId) {
						await MatrixBridgedUser.createOrUpdateByLocalId(localUserId._id, member, false, matrixDomain);
						// continue;
					}
				} catch (error) {
					this.logger.error('Error creating or updating bridged user:', error);
				}
				// We are not generating bridged users for members outside of the current workspace
				// They will be created when the invite is accepted

				await this.homeserverServices.invite.inviteUserToRoom(member, matrixRoomResult.room_id, matrixUserId);
			}

			this.logger.debug('Room creation completed successfully', room._id);
		} catch (error) {
			console.log(error);
			this.logger.error('Failed to create room:', error);
			throw error;
		}
	}

	// check docs before calling this method
	async inviteUser(externalUserIdToInvite: string, externalRoomId: string, externalInviterUser: string) {
		await this.homeserverServices.invite.inviteUserToRoom(externalUserIdToInvite, externalRoomId, externalInviterUser);
	}

	async sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void> {
		try {
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(room._id);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${room._id}`);
			}

			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${user.username}:${matrixDomain}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);
			if (!existingMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, true, matrixDomain);
			}

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping message send');
				return;
			}

			const actualMatrixUserId = existingMatrixUserId || matrixUserId;

			let result;

			if (!message.tmid) {
				result = await this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, actualMatrixUserId);
			} else {
				const threadRootMessage = await Messages.findOneById(message.tmid);
				const threadRootEventId = threadRootMessage?.federation?.eventId;

				if (threadRootEventId) {
					const latestThreadMessage = await Messages.findOne(
						{
							'tmid': message.tmid,
							'federation.eventId': { $exists: true },
							'_id': { $ne: message._id }, // Exclude the current message
						},
						{ sort: { ts: -1 } },
					);
					const latestThreadEventId = latestThreadMessage?.federation?.eventId;

					result = await this.homeserverServices.message.sendThreadMessage(
						matrixRoomId,
						message.msg,
						actualMatrixUserId,
						threadRootEventId,
						latestThreadEventId,
					);
				} else {
					this.logger.warn('Thread root event ID not found, sending as regular message');
					result = await this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, actualMatrixUserId);
				}
			}

			if (!result) {
				throw new Error('Failed to send message to Matrix - no result returned');
			}
			await Messages.setFederationEventIdById(message._id, result.eventId);

			this.logger.debug('Message sent to Matrix successfully:', result.eventId);
		} catch (error) {
			this.logger.error('Failed to send message to Matrix:', error);
			throw error;
		}
	}

	async inviteUsersToRoom(room: IRoom, usersUserName: string[], inviter: IUser): Promise<void> {
		try {
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(room._id);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${room._id}`);
			}

			const matrixDomain = await this.getMatrixDomain();
			const inviterUserId = `@${inviter.username}:${matrixDomain}`;

			await Promise.all(
				usersUserName.map(async (username) => {
					const alreadyMember = await Subscriptions.findOneByRoomIdAndUsername(room._id, username, { projection: { _id: 1 } });
					if (alreadyMember) {
						return;
					}

					const isExternalUser = username.includes(':');
					if (isExternalUser) {
						let externalUsernameToInvite = username;
						const alreadyCreatedLocally = await Users.findOneByUsername(username, { projection: { _id: 1 } });
						if (alreadyCreatedLocally) {
							externalUsernameToInvite = username.startsWith('@') ? username : `@${username}`;
						}
						await this.homeserverServices.invite.inviteUserToRoom(externalUsernameToInvite, matrixRoomId, inviterUserId);
						return;
					}

					const localUser = await Users.findOneByUsername(username, { projection: { _id: 1 } });
					if (localUser) {
						await Room.addUserToRoom(room._id, localUser, { _id: inviter._id, username: inviter.username });
						let externalUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(localUser._id);
						if (!externalUserId) {
							externalUserId = `@${username}:${matrixDomain}`;
							await MatrixBridgedUser.createOrUpdateByLocalId(localUser._id, externalUserId, false, matrixDomain);
						}
						await this.homeserverServices.invite.inviteUserToRoom(externalUserId, matrixRoomId, inviterUserId);
					}
				}),
			);
		} catch (error) {
			this.logger.error('Failed to invite an user to Matrix:', error);
			throw error;
		}
	}

	async sendReaction(messageId: string, reaction: string, user: IUser): Promise<void> {
		try {
			const message = await Messages.findOneById(messageId);
			if (!message) {
				throw new Error(`Message ${messageId} not found`);
			}

			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(message.rid);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${message.rid}`);
			}

			const matrixEventId = message.federation?.eventId;
			if (!matrixEventId) {
				throw new Error(`No Matrix event ID mapping found for message ${messageId}`);
			}

			const reactionKey = emojione.shortnameToUnicode(reaction);

			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);
			if (!existingMatrixUserId) {
				this.logger.error(`No Matrix user ID mapping found for user ${user._id}`);
				return;
			}

			const eventId = await this.homeserverServices.message.sendReaction(matrixRoomId, matrixEventId, reactionKey, existingMatrixUserId);

			await Messages.setFederationReactionEventId(user.username || '', messageId, reaction, eventId);

			this.logger.debug('Reaction sent to Matrix successfully:', eventId);
		} catch (error) {
			this.logger.error('Failed to send reaction to Matrix:', error);
			throw error;
		}
	}

	async removeReaction(messageId: string, reaction: string, user: IUser, oldMessage: IMessage): Promise<void> {
		try {
			const message = await Messages.findOneById(messageId);
			if (!message) {
				this.logger.error(`Message ${messageId} not found`);
				return;
			}

			const targetEventId = message.federation?.eventId;
			if (!targetEventId) {
				this.logger.warn(`No federation event ID found for message ${messageId}`);
				return;
			}

			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(message.rid);
			if (!matrixRoomId) {
				this.logger.error(`No Matrix room mapping found for room ${message.rid}`);
				return;
			}

			const reactionKey = emojione.shortnameToUnicode(reaction);
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);
			if (!existingMatrixUserId) {
				this.logger.error(`No Matrix user ID mapping found for user ${user._id}`);
				return;
			}

			const reactionData = oldMessage.reactions?.[reaction];
			if (!reactionData?.federationReactionEventIds) {
				return;
			}

			for await (const [eventId, username] of Object.entries(reactionData.federationReactionEventIds)) {
				if (username !== user.username) {
					continue;
				}

				const redactionEventId = await this.homeserverServices.message.unsetReaction(
					matrixRoomId,
					eventId,
					reactionKey,
					existingMatrixUserId,
				);
				if (!redactionEventId) {
					this.logger.warn('No reaction event found to remove in Matrix');
					return;
				}

				await Messages.unsetFederationReactionEventId(eventId, messageId, reaction);
				break;
			}
		} catch (error) {
			this.logger.error('Failed to remove reaction from Matrix:', error);
			throw error;
		}
	}

	async updateRoomName(rid: string, displayName: string, senderId: string): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping room name update');
			return;
		}

		const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(rid);
		if (!matrixRoomId) {
			throw new Error(`No Matrix room mapping found for room ${rid}`);
		}

		const userId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(senderId);
		if (!userId) {
			throw new Error(`No Matrix user ID mapping found for user ${senderId}`);
			}

		await this.homeserverServices.room.updateRoomName(matrixRoomId, displayName, userId);
	}

	async updateRoomTopic(rid: string, topic: string, senderId: string): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping room topic update');
			return;
		}

		const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(rid);
		if (!matrixRoomId) {
			throw new Error(`No Matrix room mapping found for room ${rid}`);
		}

		const userId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(senderId);
		if (!userId) {
			throw new Error(`No Matrix user ID mapping found for user ${senderId}`);
		}

		await this.homeserverServices.room.setRoomTopic(matrixRoomId, userId, topic);
	}

	async getEventById(eventId: string): Promise<any | null> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available');
			return null;
		}

		try {
			return await this.homeserverServices.event.getEventById(eventId);
		} catch (error) {
			this.logger.error('Failed to get event by ID:', error);
			throw error;
		}
	}

	async leaveRoom(roomId: string, user: IUser): Promise<void> {
		try {
			const room = await Rooms.findOneById(roomId);
			if (!room?.federated) {
				this.logger.debug(`Room ${roomId} is not federated, skipping leave operation`);
				return;
			}

			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(roomId);
			if (!matrixRoomId) {
				this.logger.warn(`No Matrix room mapping found for federated room ${roomId}, skipping leave`);
				return;
			}

			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${user.username}:${matrixDomain}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);

			if (!existingMatrixUserId) {
				// User might not have been bridged yet if they never sent a message
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, true, matrixDomain);
			}

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping room leave');
				return;
			}

			const actualMatrixUserId = existingMatrixUserId || matrixUserId;

			await this.homeserverServices.room.leaveRoom(matrixRoomId, actualMatrixUserId);

			this.logger.info(`User ${user.username} left Matrix room ${matrixRoomId} successfully`);
		} catch (error) {
			this.logger.error('Failed to leave room in Matrix:', error);
			throw error;
		}
	}

	async kickUser(roomId: string, removedUser: IUser, userWhoRemoved: IUser): Promise<void> {
		try {
			const room = await Rooms.findOneById(roomId);
			if (!room?.federated) {
				this.logger.debug(`Room ${roomId} is not federated, skipping kick operation`);
				return;
			}

			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(roomId);
			if (!matrixRoomId) {
				this.logger.warn(`No Matrix room mapping found for federated room ${roomId}, skipping kick`);
				return;
			}

			const matrixDomain = await this.getMatrixDomain();

			const kickedMatrixUserId = `@${removedUser.username}:${matrixDomain}`;
			const existingKickedMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(removedUser._id);
			if (!existingKickedMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(removedUser._id, kickedMatrixUserId, true, matrixDomain);
			}
			const actualKickedMatrixUserId = existingKickedMatrixUserId || kickedMatrixUserId;

			const senderMatrixUserId = `@${userWhoRemoved.username}:${matrixDomain}`;
			const existingSenderMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(userWhoRemoved._id);
			if (!existingSenderMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(userWhoRemoved._id, senderMatrixUserId, true, matrixDomain);
			}
			const actualSenderMatrixUserId = existingSenderMatrixUserId || senderMatrixUserId;

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping user kick');
				return;
			}

			await this.homeserverServices.room.kickUser(
				matrixRoomId,
				actualKickedMatrixUserId,
				actualSenderMatrixUserId,
				`Kicked by ${userWhoRemoved.username}`,
			);

			this.logger.info(`User ${removedUser.username} was kicked from Matrix room ${matrixRoomId} by ${userWhoRemoved.username}`);
		} catch (error) {
			this.logger.error('Failed to kick user from Matrix room:', error);
			throw error;
		}
	}

	async updateMessage(messageId: string, newContent: string, sender: IUser): Promise<void> {
		try {
			const message = await Messages.findOneById(messageId);
			if (!message) {
				throw new Error(`Message ${messageId} not found`);
			}

			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(message.rid);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${message.rid}`);
			}

			const matrixEventId = message.federation?.eventId;
			if (!matrixEventId) {
				throw new Error(`No Matrix event ID mapping found for message ${messageId}`);
			}

			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(sender._id);
			if (!existingMatrixUserId) {
				this.logger.error(`No Matrix user ID mapping found for user ${sender._id}`);
				return;
			}

			const eventId = await this.homeserverServices.message.updateMessage(matrixRoomId, newContent, existingMatrixUserId, matrixEventId);

			this.logger.debug('Message updated in Matrix successfully:', eventId);
		} catch (error) {
			this.logger.error('Failed to update message in Matrix:', error);
			throw error;
		}
	}

	async setRoomPrivacy(roomId: string, privacy: IRoom['t'], senderId: string): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping room privacy update');
			return;
		}

		const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(roomId);
		if (!matrixRoomId) {
			throw new Error(`No local room mapping found for room ${roomId}`);
		}

		const matrixSender = await MatrixBridgedUser.getExternalUserIdByLocalUserId(senderId);
		if (!matrixSender) {
			throw new Error(`No local user mapping found for user ${senderId}`);
		}

		if (privacy === 'c') {
			await this.homeserverServices.room.setRoomPublic(matrixRoomId, matrixSender);
		} else if (privacy === 'p') {
			await this.homeserverServices.room.setRoomInviteOnly(matrixRoomId, matrixSender);
		} else {
			throw new Error(`Invalid privacy value: ${privacy}`);
		}
	}

	async setUserModerator(fromUserId: string, userId: string, roomId: string, role: 'owner' | 'leader' | 'moderator' | 'user') {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping user moderator update');
			return;
		}

		let power = 0;
		if (role === 'owner') {
			power = 100;
		} else if (role === 'leader') {
			power = 50;
		} else if (role === 'moderator') {
			power = 50;
		}

		const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(roomId);
		if (!matrixRoomId) {
			throw new Error(`No Matrix room mapping found for room ${roomId}`);
		}

		const matrixFromUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(fromUserId);
		if (!matrixFromUserId) {
			throw new Error(`No Matrix user ID mapping found for user ${fromUserId}`);
		}

		const matrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(userId);
		if (!matrixUserId) {
			throw new Error(`No Matrix user ID mapping found for user ${userId}`);
		}

		await this.homeserverServices.room.setPowerLevelForUser(matrixRoomId, matrixFromUserId, matrixUserId, power);
	}
}
