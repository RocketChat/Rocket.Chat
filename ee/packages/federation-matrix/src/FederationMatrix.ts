import 'reflect-metadata';

import { toUnpaddedBase64 } from '@hs/core';
import { ConfigService, createFederationContainer, getAllServices } from '@hs/federation-sdk';
import type { HomeserverEventSignatures, HomeserverServices, FederationContainerOptions } from '@hs/federation-sdk';
import { type IFederationMatrixService, ServiceClass, Settings } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedUser, MatrixBridgedRoom, MatrixBridgedMessage, Users, Messages } from '@rocket.chat/models';
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
		const config = new ConfigService();
		const matrixConfig = config.getMatrixConfig();
		const serverConfig = config.getServerConfig();
		const signingKeys = await config.getSigningKey();
		const signingKey = signingKeys[0];

		const containerOptions: FederationContainerOptions = {
			emitter,
			federationOptions: {
				serverName: matrixConfig.serverName,
				signingKey: toUnpaddedBase64(signingKey.privateKey),
				signingKeyId: `ed25519:${signingKey.version}`,
				timeout: 30000,
				baseUrl: serverConfig.baseUrl,
			},
		};

		await createFederationContainer(containerOptions);
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
			.use(getFederationVersionsRoutes());

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

		try {
			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${owner.username}:${matrixDomain}`;
			const roomName = room.name || room.fname || 'Untitled Room';
			const canonicalAlias = room.fname ? `#${room.fname}:${matrixDomain}` : undefined;

			const matrixRoomResult = await this.homeserverServices.room.createRoom(
				matrixUserId,
				matrixUserId,
				roomName,
				canonicalAlias,
				canonicalAlias,
			);

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
						await MatrixBridgedUser.createOrUpdateByLocalId(localUserId._id, member, true, matrixDomain);
						// continue;
					}
				} catch (error) {
					this.logger.error('Error creating or updating bridged user:', error);
				}

				// We are not generating bridged users for members outside of the current workspace
				// They will be created when the invite is accepted

				await this.homeserverServices.invite.inviteUserToRoom(member, matrixRoomResult.room_id, matrixUserId, roomName);
			}

			this.logger.debug('Room creation completed successfully', room._id);
		} catch (error) {
			console.log(error);
			this.logger.error('Failed to create room:', error);
			throw error;
		}
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
				const port = await Settings.get<number>('Federation_Service_Matrix_Port');
				const domain = await Settings.get<string>('Federation_Service_Matrix_Domain');
				const matrixDomain = port === 443 || port === 80 ? domain : `${domain}:${port}`;
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, true, matrixDomain);
			}

			// TODO: We should fix this to not hardcode neither inform the target server
			// This is on the homeserver mandate to track all the eligible servers in the federated room
			const targetServer = 'hs1-garim.tunnel.dev.rocket.chat';

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping message send');
				return;
			}

			const result = await this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, matrixUserId, targetServer);

			await MatrixBridgedMessage.createOrUpdate(message._id, result.event_id);

			this.logger.debug('Message sent to Matrix successfully:', result.event_id);
		} catch (error) {
			this.logger.error('Failed to send message to Matrix:', error);
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

			const matrixEventId = await MatrixBridgedMessage.getExternalEventId(messageId);
			if (!matrixEventId) {
				throw new Error(`No Matrix event ID mapping found for message ${messageId}`);
			}

			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${user.username}:${matrixDomain}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);
			if (!existingMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, true, matrixDomain);
			}

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping reaction send');
				return;
			}

			const reactionKey = emojione.shortnameToUnicode(reaction);

			// TODO: Fix hardcoded server
			const targetServer = 'hs1-garim.tunnel.dev.rocket.chat';
			const result = await this.homeserverServices.message.sendReaction(
				matrixRoomId,
				matrixEventId,
				reactionKey,
				matrixUserId,
				targetServer,
			);

			const reactionMappingKey = `${messageId}_reaction_${reaction}`;
			await MatrixBridgedMessage.createOrUpdate(reactionMappingKey, result.event_id);

			this.logger.debug('Reaction sent to Matrix successfully:', result.event_id);
		} catch (error) {
			this.logger.error('Failed to send reaction to Matrix:', error);
			throw error;
		}
	}

	async removeReaction(messageId: string, reaction: string, user: IUser): Promise<void> {
		try {
			const message = await Messages.findOneById(messageId);
			if (!message) {
				throw new Error(`Message ${messageId} not found`);
			}

			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(message.rid);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${message.rid}`);
			}

			const matrixEventId = await MatrixBridgedMessage.getExternalEventId(messageId);
			if (!matrixEventId) {
				throw new Error(`No Matrix event ID mapping found for message ${messageId}`);
			}

			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${user.username}:${matrixDomain}`;

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping reaction removal');
				return;
			}

			// TODO: Fix hardcoded server
			const targetServer = 'hs1-garim.tunnel.dev.rocket.chat';

			const reactionMappingKey = `${messageId}_reaction_${reaction}`;
			const reactionEventId = await MatrixBridgedMessage.getExternalEventId(reactionMappingKey);
			if (!reactionEventId) {
				this.logger.warn(`No reaction event ID found for ${reactionMappingKey}`);
				return;
			}

			const result = await this.homeserverServices.message.redactMessage(
				matrixRoomId,
				reactionEventId,
				undefined,
				matrixUserId,
				targetServer,
			);

			await MatrixBridgedMessage.removeByLocalMessageId(reactionMappingKey);

			this.logger.debug('Reaction removed from Matrix successfully:', result.event_id);
		} catch (error) {
			this.logger.error('Failed to remove reaction from Matrix:', error);
			throw error;
		}
	}

	async leaveRoom(roomId: string, user: IUser): Promise<void> {
		try {
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(roomId);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${roomId}`);
			}

			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${user.username}:${matrixDomain}`;

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping room leave');
				return;
			}

			// TODO: Fix hardcoded server
			const targetServer = 'hs1-garim.tunnel.dev.rocket.chat';

			const result = await this.homeserverServices.room.leaveRoom(matrixRoomId, matrixUserId, [targetServer]);

			this.logger.debug('User left Matrix room successfully:', result);
		} catch (error) {
			this.logger.error('Failed to leave Matrix room:', error);
			throw error;
		}
	}

	async kickUser(roomId: string, kickedUser: IUser, kickingUser: IUser, reason?: string): Promise<void> {
		try {
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(roomId);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${roomId}`);
			}

			const matrixDomain = await this.getMatrixDomain();
			const kickedMatrixUserId = `@${kickedUser.username}:${matrixDomain}`;
			const kickingMatrixUserId = `@${kickingUser.username}:${matrixDomain}`;

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping user kick');
				return;
			}

			// TODO: Fix hardcoded server
			const targetServer = 'hs1-garim.tunnel.dev.rocket.chat';

			const result = await this.homeserverServices.room.kickUser(matrixRoomId, kickedMatrixUserId, kickingMatrixUserId, reason, [
				targetServer,
			]);

			this.logger.debug('User kicked from Matrix room successfully:', result);
		} catch (error) {
			this.logger.error('Failed to kick user from Matrix room:', error);
			throw error;
		}
	}
}
