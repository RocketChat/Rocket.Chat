import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'http';

import type { PresenceState } from '@hs/core';
import { ConfigService, createFederationContainer, getAllServices } from '@hs/federation-sdk';
import type { HomeserverEventSignatures, HomeserverServices, FederationContainerOptions } from '@hs/federation-sdk';
import { type IFederationMatrixService, Room, ServiceClass, Settings } from '@rocket.chat/core-services';
import {
	isDeletedMessage,
	isMessageFromMatrixFederation,
	isQuoteAttachment,
	UserStatus,
	type MessageQuoteAttachment,
	type IMessage,
	type IRoom,
	type IUser,
	type IUpload,
} from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { MatrixBridgedUser, MatrixBridgedRoom, Users, Subscriptions, Messages, Rooms, Uploads } from '@rocket.chat/models';
import emojione from 'emojione';

import { getWellKnownRoutes } from './api/.well-known/server';
import { getMatrixInviteRoutes } from './api/_matrix/invite';
import { getKeyServerRoutes } from './api/_matrix/key/server';
import { getMatrixMediaRoutes } from './api/_matrix/media';
import { getMatrixProfilesRoutes } from './api/_matrix/profiles';
import { getMatrixRoomsRoutes } from './api/_matrix/rooms';
import { getMatrixSendJoinRoutes } from './api/_matrix/send-join';
import { getMatrixTransactionsRoutes } from './api/_matrix/transactions';
import { getFederationVersionsRoutes } from './api/_matrix/versions';
import { registerEvents } from './events';
import { getMatrixLocalDomain } from './helpers/domain.builder';
import { saveExternalUserIdForLocalUser } from './helpers/identifiers';
import { toExternalMessageFormat, toExternalQuoteMessageFormat } from './helpers/message.parsers';
import { MatrixMediaService } from './services/MatrixMediaService';
import { setup } from './setupContainers';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';

	private eventHandler: Emitter<HomeserverEventSignatures>;

	private homeserverServices: HomeserverServices;

	private matrixDomain: string;

	private diContainer: any;

	private readonly logger = new Logger(this.name);

	private httpRoutes: { matrix: Router<'/_matrix'>; wellKnown: Router<'/.well-known'> };

	private constructor(emitter?: Emitter<HomeserverEventSignatures>) {
		super();
		this.eventHandler = emitter || new Emitter<HomeserverEventSignatures>();
	}

	static async create(emitter?: Emitter<HomeserverEventSignatures>): Promise<FederationMatrix> {
		const instance = new FederationMatrix(emitter);
		const settingsSigningKey = await Settings.get<string>('Federation_Service_Matrix_Signing_Key');

		const siteUrl = await Settings.get<string>('Site_Url');

		const serverHostname = new URL(siteUrl).hostname;

		const mongoUri = process.env.MONGO_URL || 'mongodb://localhost:3001/meteor';

		const dbName = process.env.DATABASE_NAME || new URL(mongoUri).pathname.slice(1);

		const config = new ConfigService({
			serverName: serverHostname,
			keyRefreshInterval: Number.parseInt(process.env.MATRIX_KEY_REFRESH_INTERVAL || '60', 10),
			matrixDomain: serverHostname,
			version: process.env.SERVER_VERSION || '1.0',
			port: Number.parseInt(process.env.SERVER_PORT || '8080', 10),
			signingKey: settingsSigningKey,
			signingKeyPath: process.env.CONFIG_FOLDER || './rc1.signing.key',
			database: {
				uri: mongoUri,
				name: dbName,
				poolSize: Number.parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
			},
		});

		const containerOptions: FederationContainerOptions = {
			emitter: instance.eventHandler,
		};

		createFederationContainer(containerOptions, config);
		instance.homeserverServices = getAllServices();
		instance.buildMatrixHTTPRoutes();
		instance.onEvent('user.typing', async ({ isTyping, roomId, user: { username } }): Promise<void> => {
			if (!roomId || !username) {
				return;
			}
			const externalRoomId = await MatrixBridgedRoom.getExternalRoomId(roomId);
			if (!externalRoomId) {
				return;
			}
			const localUser = await Users.findOneByUsername(username, { projection: { _id: 1 } });
			if (!localUser) {
				return;
			}
			const externalUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(localUser._id);
			if (!externalUserId) {
				return;
			}
			void instance.homeserverServices.edu.sendTypingNotification(externalRoomId, externalUserId, isTyping);
		});
		instance.onEvent(
			'presence.status',
			async ({ user }: { user: Pick<IUser, '_id' | 'username' | 'status' | 'statusText' | 'name' | 'roles'> }): Promise<void> => {
				if (!user.username || !user.status) {
					return;
				}
				const localUser = await Users.findOneByUsername(user.username, { projection: { _id: 1 } });
				if (!localUser) {
					return;
				}
				const externalUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(localUser._id);
				if (!externalUserId) {
					return;
				}

				const roomsUserIsMemberOf = await Subscriptions.findUserFederatedRoomIds(localUser._id).toArray();
				const statusMap: Record<UserStatus, PresenceState> = {
					[UserStatus.ONLINE]: 'online',
					[UserStatus.OFFLINE]: 'offline',
					[UserStatus.AWAY]: 'unavailable',
					[UserStatus.BUSY]: 'unavailable',
					[UserStatus.DISABLED]: 'offline',
				};
				void instance.homeserverServices.edu.sendPresenceUpdateToRooms(
					[
						{
							user_id: externalUserId,
							presence: statusMap[user.status] || 'offline',
						},
					],
					roomsUserIsMemberOf.map(({ externalRoomId }: { externalRoomId: string }) => externalRoomId),
				);
			},
		);

		instance.diContainer = await setup(instance.eventHandler);

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
			.use(getFederationVersionsRoutes(this.homeserverServices))
			.use(getMatrixMediaRoutes(this.homeserverServices));

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

		this.matrixDomain = await getMatrixLocalDomain();

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

			await saveExternalUserIdForLocalUser(owner, matrixUserId);

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

			// Handle file messages first
			if (message.file?._id || message.attachments?.length) {
				const fileId = message.file?._id || (message.attachments?.[0] as any)?.file?._id;
				if (fileId) {
					const mxcUri = await MatrixMediaService.prepareLocalFileForMatrix(fileId, matrixDomain);

					const file = await Uploads.findOneById(fileId);
					if (file) {
						let msgtype: 'm.image' | 'm.file' | 'm.video' | 'm.audio' = 'm.file';
						if (file.type?.startsWith('image/')) {
							msgtype = 'm.image';
						} else if (file.type?.startsWith('video/')) {
							msgtype = 'm.video';
						} else if (file.type?.startsWith('audio/')) {
							msgtype = 'm.audio';
						}

						const fileContent = {
							body: file.name || 'Unnamed file',
							msgtype,
							url: mxcUri,
							info: {
								size: file.size,
								mimetype: file.type || 'application/octet-stream',
							} as any,
						};

						if (msgtype === 'm.image' && (file as any).identify) {
							const { identify } = file as any;
							if (identify.size) {
								fileContent.info.w = identify.size.width;
								fileContent.info.h = identify.size.height;
							}
						}

						result = await this.homeserverServices.message.sendFileMessage(matrixRoomId, fileContent, actualMatrixUserId);
					} else {
						const messageContent = message.msg || '';
						result = await this.homeserverServices.message.sendMessage(matrixRoomId, messageContent, actualMatrixUserId);
					}
				} else {
					const messageContent = message.msg || '';
					result = await this.homeserverServices.message.sendMessage(matrixRoomId, messageContent, actualMatrixUserId);
				}
			} else {
				// Handle text messages with potential quotes
				const parsedMessage = await toExternalMessageFormat({
					message: message.msg,
					externalRoomId: matrixRoomId,
					homeServerDomain: await this.getMatrixDomain(),
				});

				if (!message.tmid) {
					if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
						const quoteMessage = await this.getQuoteMessage(message, matrixRoomId, actualMatrixUserId, matrixDomain);
						if (!quoteMessage) {
							throw new Error('Failed to retrieve quote message');
						}
						result = await this.homeserverServices.message.sendReplyToMessage(
							matrixRoomId,
							quoteMessage.rawMessage,
							quoteMessage.formattedMessage,
							quoteMessage.eventToReplyTo,
							actualMatrixUserId,
						);
					} else {
						result = await this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, parsedMessage, actualMatrixUserId);
					}
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

						const parsedMessage = await toExternalMessageFormat({
							message: message.msg,
							externalRoomId: matrixRoomId,
							homeServerDomain: await this.getMatrixDomain(),
						});

						if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
							const quoteMessage = await this.getQuoteMessage(message, matrixRoomId, actualMatrixUserId, matrixDomain);
							if (!quoteMessage) {
								throw new Error('Failed to retrieve quote message');
							}
							result = await this.homeserverServices.message.sendReplyToInsideThreadMessage(
								matrixRoomId,
								quoteMessage.rawMessage,
								quoteMessage.formattedMessage,
								actualMatrixUserId,
								threadRootEventId,
								quoteMessage.eventToReplyTo,
							);
						} else {
							result = await this.homeserverServices.message.sendThreadMessage(
								matrixRoomId,
								message.msg,
								parsedMessage,
								actualMatrixUserId,
								threadRootEventId,
								latestThreadEventId,
							);
						}
					} else {
						this.logger.warn('Thread root event ID not found, sending as regular message');
						const parsedMessage = await toExternalMessageFormat({
							message: message.msg,
							externalRoomId: matrixRoomId,
							homeServerDomain: await this.getMatrixDomain(),
						});

						if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
							const quoteMessage = await this.getQuoteMessage(message, matrixRoomId, actualMatrixUserId, matrixDomain);
							if (!quoteMessage) {
								throw new Error('Failed to retrieve quote message');
							}
							result = await this.homeserverServices.message.sendReplyToMessage(
								matrixRoomId,
								quoteMessage.rawMessage,
								quoteMessage.formattedMessage,
								quoteMessage.eventToReplyTo,
								actualMatrixUserId,
							);
						} else {
							result = await this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, parsedMessage, actualMatrixUserId);
						}
					}
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

	private async getQuoteMessage(
		message: IMessage,
		matrixRoomId: string,
		matrixUserId: string,
		matrixDomain: string,
	): Promise<{ formattedMessage: string; rawMessage: string; eventToReplyTo: string } | undefined> {
		if (!message.attachments) {
			return;
		}
		const messageLink = (
			message.attachments.find((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link)) as MessageQuoteAttachment
		).message_link;

		if (!messageLink) {
			return;
		}
		const messageToReplyToId = messageLink.includes('msg=') && messageLink?.split('msg=').pop();
		if (!messageToReplyToId) {
			return;
		}
		const messageToReplyTo = await Messages.findOneById(messageToReplyToId);
		if (!messageToReplyTo || !messageToReplyTo.federation?.eventId) {
			return;
		}

		const { formattedMessage, message: rawMessage } = await toExternalQuoteMessageFormat({
			externalRoomId: matrixRoomId,
			eventToReplyTo: messageToReplyTo.federation?.eventId,
			originalEventSender: matrixUserId,
			message: message.msg,
			homeServerDomain: matrixDomain,
		});

		return {
			formattedMessage,
			rawMessage,
			eventToReplyTo: messageToReplyTo.federation.eventId,
		};
	}

	async deleteMessage(message: IMessage): Promise<void> {
		try {
			if (!isMessageFromMatrixFederation(message) || isDeletedMessage(message)) {
				return;
			}
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(message.rid);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${message.rid}`);
			}
			const matrixDomain = await this.getMatrixDomain();
			const matrixUserId = `@${message.u.username}:${matrixDomain}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(message.u._id);
			if (!existingMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(message.u._id, matrixUserId, true, matrixDomain);
			}

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping message redaction');
				return;
			}
			const matrixEventId = message.federation?.eventId;
			if (!matrixEventId) {
				throw new Error(`No Matrix event ID mapping found for message ${message._id}`);
			}
			const eventId = await this.homeserverServices.message.redactMessage(matrixRoomId, matrixEventId, matrixUserId);

			this.logger.debug('Message Redaction sent to Matrix successfully:', eventId);
		} catch (error) {
			this.logger.error('Failed to send redaction to Matrix:', error);
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
						await this.homeserverServices.invite.inviteUserToRoom(username, matrixRoomId, inviterUserId);
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

			const parsedMessage = await toExternalMessageFormat({
				message: newContent,
				externalRoomId: matrixRoomId,
				homeServerDomain: await this.getMatrixDomain(),
			});
			const eventId = await this.homeserverServices.message.updateMessage(
				matrixRoomId,
				newContent,
				parsedMessage,
				existingMatrixUserId,
				matrixEventId,
			);

			this.logger.debug('Message updated in Matrix successfully:', eventId);
		} catch (error) {
			this.logger.error('Failed to update message in Matrix:', error);
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

	async addUserRoleRoomScoped(
		rid: string,
		senderId: string,
		userId: string,
		role: 'moderator' | 'owner' | 'leader' | 'user',
	): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping user role room scoped');
			return;
		}

		if (role === 'leader') {
			throw new Error('Leader role is not supported');
		}

		const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(rid);
		if (!matrixRoomId) {
			throw new Error(`No Matrix room mapping found for room ${rid}`);
		}

		const matrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(userId);
		if (!matrixUserId) {
			throw new Error(`No Matrix user ID mapping found for user ${userId}`);
		}

		const senderMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(senderId);
		if (!senderMatrixUserId) {
			throw new Error(`No Matrix user ID mapping found for user ${senderId}`);
		}

		let powerLevel = 0;
		if (role === 'owner') {
			powerLevel = 100;
		} else if (role === 'moderator') {
			powerLevel = 50;
		}

		await this.homeserverServices.room.setPowerLevelForUser(matrixRoomId, senderMatrixUserId, matrixUserId, powerLevel);
	}

	/**
	 * Stream a remote Matrix file for display in RC
	 * This doesn't store the file, just proxies it
	 */
	async streamRemoteFile(_userId: string, mxcUri: string): Promise<Buffer | null> {
		try {
			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, cannot stream file');
				return null;
			}

			const mxcParts = MatrixMediaService.parseMXCUri(mxcUri);
			if (!mxcParts) {
				this.logger.error('Invalid MXC URI format', { mxcUri });
				return null;
			}

			const result = await this.homeserverServices.media.downloadFile(mxcParts.serverName, mxcParts.mediaId, null);

			if (result instanceof Response) {
				const arrayBuffer = await result.arrayBuffer();
				return Buffer.from(arrayBuffer);
			}

			this.logger.error('Failed to download file from homeserver', result);
			return null;
		} catch (error) {
			this.logger.error('Failed to stream remote file:', error);
			return null;
		}
	}

	private static readonly FETCH_TIMEOUT = 30000;

	private static readonly CACHE_MAX_AGE = 86400;

	private static readonly USER_AGENT = 'RocketChat-Federation/1.0';

	private validateRemoteFile(file: any): {
		isValid: boolean;
		error?: string;
		mxcUri?: string;
		serverName?: string;
		mediaId?: string;
	} {
		const mxcUri = file.federation?.mxcUri;
		const serverName = file.federation?.serverName;
		const mediaId = file.federation?.mediaId;

		if (!mxcUri || !serverName || !mediaId) {
			return {
				isValid: false,
				error: 'Remote file metadata missing',
			};
		}

		return {
			isValid: true,
			mxcUri,
			serverName,
			mediaId,
		};
	}

	private parseMxcUri(
		mxcUri: string,
		serverName: string,
		mediaId: string,
	): {
		originServer: string;
		actualMediaId: string;
	} {
		const mxcParts = mxcUri.match(/^mxc:\/\/([^\/]+)\/(.+)$/);
		return {
			originServer: mxcParts ? mxcParts[1] : serverName,
			actualMediaId: mxcParts ? mxcParts[2] : mediaId,
		};
	}

	private buildMatrixMediaEndpoints(
		originServer: string,
		mediaId: string,
	): Array<{
		url: string;
		name: string;
		headers: Record<string, string>;
	}> {
		const endpoints = [
			{
				url: `https://${originServer}/_matrix/media/v1/download/${originServer}/${mediaId}`,
				name: 'media_v1_https',
				headers: { 'User-Agent': FederationMatrix.USER_AGENT, 'Accept': '*/*' },
			},
			{
				url: `https://${originServer}/_matrix/media/v3/download/${originServer}/${mediaId}`,
				name: 'media_v3_https',
				headers: { 'User-Agent': FederationMatrix.USER_AGENT, 'Accept': '*/*' },
			},
			{
				url: `http://${originServer}/_matrix/media/v3/download/${originServer}/${mediaId}`,
				name: 'media_v3_http',
				headers: { 'User-Agent': FederationMatrix.USER_AGENT, 'Accept': '*/*' },
			},
			{
				url: `https://${originServer}/_matrix/media/r0/download/${originServer}/${mediaId}`,
				name: 'media_r0_https',
				headers: { 'User-Agent': FederationMatrix.USER_AGENT, 'Accept': '*/*' },
			},
			{
				url: `http://${originServer}/_matrix/media/r0/download/${originServer}/${mediaId}`,
				name: 'media_r0_http',
				headers: { 'User-Agent': FederationMatrix.USER_AGENT, 'Accept': '*/*' },
			},
			{
				url: `https://${originServer}/_matrix/client/v1/media/download/${originServer}/${mediaId}`,
				name: 'client_v1_https',
				headers: { 'User-Agent': FederationMatrix.USER_AGENT, 'Accept': '*/*' },
			},
			{
				url: `http://${originServer}/_matrix/client/v1/media/download/${originServer}/${mediaId}`,
				name: 'client_v1_http',
				headers: { 'User-Agent': FederationMatrix.USER_AGENT, 'Accept': '*/*' },
			},
		];

		return endpoints;
	}

	private async createHttpAgent(isHttps: boolean): Promise<any> {
		if (isHttps) {
			return {
				agent: new (await import('https')).Agent({
					rejectUnauthorized: false,
				}),
			};
		}
		return {
			agent: new (await import('http')).Agent({
				keepAlive: true,
			}),
		};
	}

	private async fetchFromEndpoints(endpoints: Array<{ url: string; name: string; headers: Record<string, string> }>): Promise<{
		response: any | null;
		lastError: any;
	}> {
		const fetch = (await import('node-fetch')).default;
		let response: any = null;
		let lastError: any = null;

		for await (const endpoint of endpoints) {
			this.logger.info(`Trying ${endpoint.name} endpoint`, {
				url: endpoint.url,
				method: 'GET',
				headers: endpoint.headers,
			});

			try {
				const isHttps = endpoint.url.startsWith('https://');
				const agentOptions = await this.createHttpAgent(isHttps);

				response = await fetch(endpoint.url, {
					method: 'GET',
					headers: endpoint.headers,
					timeout: FederationMatrix.FETCH_TIMEOUT,
					...agentOptions,
				});

				if (response.ok) {
					this.logger.info(`Successfully fetched file via ${endpoint.name}`, {
						status: response.status,
						endpoint: endpoint.name,
						url: endpoint.url,
					});
					break;
				}

				lastError = `${endpoint.name}: ${response.status} ${response.statusText}`;
			} catch (fetchError: any) {
				this.logger.warn(`Failed to fetch from ${endpoint.name}`, {
					error: fetchError.message,
					code: fetchError.code,
				});
				lastError = fetchError;
			}
		}

		return { response, lastError };
	}

	private streamResponseToClient(response: any, res: any, file: any): void {
		const contentType = response.headers.get('content-type') || file.type || 'application/octet-stream';
		const contentLength = response.headers.get('content-length');

		res.setHeader('Content-Type', contentType);
		if (contentLength) {
			res.setHeader('Content-Length', contentLength);
		}
		res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name || '')}"`);
		res.setHeader('Cache-Control', `public, max-age=${FederationMatrix.CACHE_MAX_AGE}`);

		response.body?.pipe(res);
	}

	/**
	 * Download and stream a remote Matrix file to the client
	 * This method handles proxying remote Matrix files to Rocket.Chat clients
	 */
	async downloadRemoteFile(file: any, _req: any, res: any): Promise<void> {
		try {
			const validation = this.validateRemoteFile(file);
			if (!validation.isValid) {
				this.logger.error('Invalid remote file metadata', {
					error: validation.error,
					federation: file.federation,
				});
				res.writeHead(404);
				res.end(validation.error);
				return;
			}

			const { mxcUri, serverName, mediaId } = validation;
			const { originServer, actualMediaId } = this.parseMxcUri(mxcUri!, serverName!, mediaId!);

			const endpoints = this.buildMatrixMediaEndpoints(originServer, actualMediaId);

			const { response, lastError } = await this.fetchFromEndpoints(endpoints);
			if (!response || !response.ok) {
				this.logger.error('Failed to fetch remote file from all endpoints', {
					lastError,
					mxcUri,
					originServer,
					actualMediaId,
				});
				res.writeHead(404);
				res.end(`Failed to fetch remote file: ${lastError}`);
				return;
			}

			this.streamResponseToClient(response, res, file);
		} catch (error) {
			this.logger.error('Error handling remote Matrix file download:', error);
			res.writeHead(500);
			res.end('Internal server error');
		}
	}
}
