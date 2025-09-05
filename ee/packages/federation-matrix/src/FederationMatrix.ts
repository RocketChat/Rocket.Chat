import 'reflect-metadata';

import type { PresenceState } from '@hs/core';
import { ConfigService, createFederationContainer, getAllServices } from '@hs/federation-sdk';
import type { HomeserverEventSignatures, HomeserverServices, FederationContainerOptions } from '@hs/federation-sdk';
import { type IFederationMatrixService, Room, ServiceClass, Settings } from '@rocket.chat/core-services';
import { isDeletedMessage, isMessageFromMatrixFederation, isQuoteAttachment, UserStatus } from '@rocket.chat/core-typings';
import type { MessageQuoteAttachment, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
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
import { saveExternalUserIdForLocalUser } from './helpers/identifiers';
import { toExternalMessageFormat, toExternalQuoteMessageFormat } from './helpers/message.parsers';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';

	private eventHandler: Emitter<HomeserverEventSignatures>;

	private homeserverServices: HomeserverServices;

	private serverName: string;

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

		instance.serverName = serverHostname;

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
			media: {
				maxFileSize: Number.parseInt(process.env.MEDIA_MAX_FILE_SIZE || '100', 10) * 1024 * 1024,
				allowedMimeTypes: process.env.MEDIA_ALLOWED_MIME_TYPES?.split(',') || [
					'image/jpeg',
					'image/png',
					'image/gif',
					'image/webp',
					'text/plain',
					'application/pdf',
					'video/mp4',
					'audio/mpeg',
					'audio/ogg',
				],
				enableThumbnails: process.env.MEDIA_ENABLE_THUMBNAILS === 'true' || true,
				rateLimits: {
					uploadPerMinute: Number.parseInt(process.env.MEDIA_UPLOAD_RATE_LIMIT || '10', 10),
					downloadPerMinute: Number.parseInt(process.env.MEDIA_DOWNLOAD_RATE_LIMIT || '60', 10),
				},
			},
		});

		const containerOptions: FederationContainerOptions = {
			emitter: instance.eventHandler,
		};

		await createFederationContainer(containerOptions, config);
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
					roomsUserIsMemberOf.map(({ externalRoomId }) => externalRoomId),
				);
			},
		);

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
			registerEvents(this.eventHandler, this.serverName);
		} catch (error) {
			this.logger.warn('Homeserver module not available, running in limited mode');
		}
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
			const matrixUserId = `@${owner.username}:${this.serverName}`;
			const roomName = room.name || room.fname || 'Untitled Room';

			// canonical alias computed from name
			const matrixRoomResult = await this.homeserverServices.room.createRoom(matrixUserId, roomName, room.t === 'c' ? 'public' : 'invite');

			this.logger.debug('Matrix room created:', matrixRoomResult);

			await MatrixBridgedRoom.createOrUpdateByLocalRoomId(room._id, matrixRoomResult.room_id, this.serverName);

			await saveExternalUserIdForLocalUser(owner, matrixUserId);

			for await (const member of members) {
				if (member === owner.username) {
					continue;
				}

				try {
					// TODO: Check if it is external user - split domain etc
					const localUserId = await Users.findOneByUsername(member);
					if (localUserId) {
						await MatrixBridgedUser.createOrUpdateByLocalId(localUserId._id, member, false, this.serverName);
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

	async ensureFederatedUsersExistLocally(members: (IUser | string)[]): Promise<void> {
		try {
			this.logger.debug('Ensuring federated users exist locally before DM creation', { memberCount: members.length });

			for await (const member of members) {
				let username: string;

				if (typeof member === 'string') {
					username = member;
				} else {
					username = member.username as string;
				}

				if (!username.includes(':') && !username.includes('@')) {
					continue;
				}

				const externalUserId = username.includes(':') ? `@${username}` : `@${username}:${this.serverName}`;

				const existingUser = await Users.findOneByUsername(username);
				if (existingUser) {
					const existingBridge = await MatrixBridgedUser.getExternalUserIdByLocalUserId(existingUser._id);
					if (!existingBridge) {
						const remoteDomain = externalUserId.split(':')[1] || this.serverName;
						await MatrixBridgedUser.createOrUpdateByLocalId(existingUser._id, externalUserId, true, remoteDomain);
					}
					continue;
				}

				this.logger.debug('Creating federated user locally', { externalUserId, username });

				const remoteDomain = externalUserId.split(':')[1] || this.serverName;
				const localName = username.split(':')[0]?.replace('@', '') || username;

				const newUser = {
					username,
					name: localName,
					type: 'user' as const,
					status: UserStatus.OFFLINE,
					active: true,
					roles: ['user'],
					requirePasswordChange: false,
					federated: true,
					createdAt: new Date(),
					_updatedAt: new Date(),
				};

				const { insertedId } = await Users.insertOne(newUser);
				await MatrixBridgedUser.createOrUpdateByLocalId(insertedId, externalUserId, true, remoteDomain);

				this.logger.debug('Successfully created federated user locally', { userId: insertedId, externalUserId });
			}
		} catch (error) {
			this.logger.error('Failed to ensure federated users exist locally:', error);
		}
	}

	async createDirectMessageRoom(room: IRoom, members: (IUser | string)[], creatorId: IUser['_id']): Promise<void> {
		try {
			this.logger.debug('Creating direct message room in Matrix', { roomId: room._id, memberCount: members.length });

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping DM room creation');
				return;
			}

			const creator = await Users.findOneById(creatorId);
			if (!creator) {
				throw new Error('Creator not found in members list');
			}

			const matrixUserId = `@${creator.username}:${this.serverName}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(creator._id);
			if (!existingMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(creator._id, matrixUserId, true, this.serverName);
			}

			const actualMatrixUserId = existingMatrixUserId || matrixUserId;

			let matrixRoomResult: { room_id: string; event_id?: string };
			if (members.length === 2) {
				const otherMember = members.find((member) => {
					if (typeof member === 'string') {
						return true; // Remote user
					}
					return member._id !== creatorId;
				});
				if (!otherMember) {
					throw new Error('Other member not found for 1-on-1 DM');
				}
				let otherMemberMatrixId: string;
				if (typeof otherMember === 'string') {
					otherMemberMatrixId = otherMember.startsWith('@') ? otherMember : `@${otherMember}`;
				} else if (otherMember.username?.includes(':')) {
					otherMemberMatrixId = otherMember.username.startsWith('@') ? otherMember.username : `@${otherMember.username}`;
				} else {
					otherMemberMatrixId = `@${otherMember.username}:${this.serverName}`;
				}
				const roomId = await this.homeserverServices.room.createDirectMessageRoom(actualMatrixUserId, otherMemberMatrixId);
				matrixRoomResult = { room_id: roomId };
			} else {
				// For group DMs (more than 2 members), create a private room
				const roomName = room.name || room.fname || `Group chat with ${members.length} members`;
				matrixRoomResult = await this.homeserverServices.room.createRoom(actualMatrixUserId, roomName, 'invite');
			}

			const mapping = await MatrixBridgedRoom.getLocalRoomId(matrixRoomResult.room_id);
			if (!mapping) {
				await MatrixBridgedRoom.createOrUpdateByLocalRoomId(room._id, matrixRoomResult.room_id, this.serverName);
			}

			for await (const member of members) {
				if (typeof member !== 'string' && member._id === creatorId) continue;

				try {
					let memberMatrixUserId: string;
					let memberId: string | undefined;

					if (typeof member === 'string') {
						memberMatrixUserId = member.startsWith('@') ? member : `@${member}`;
						memberId = undefined;
					} else if (member.username?.includes(':')) {
						memberMatrixUserId = member.username.startsWith('@') ? member.username : `@${member.username}`;
						memberId = member._id;
					} else {
						memberMatrixUserId = `@${member.username}:${this.serverName}`;
						memberId = member._id;
					}

					if (memberId) {
						const existingMemberMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(memberId);

						if (!existingMemberMatrixUserId) {
							await MatrixBridgedUser.createOrUpdateByLocalId(memberId, memberMatrixUserId, true, this.serverName);
						}
					}

					if (members.length > 2) {
						await this.homeserverServices.invite.inviteUserToRoom(memberMatrixUserId, matrixRoomResult.room_id, actualMatrixUserId);
					}
				} catch (error) {
					this.logger.error('Error creating or updating bridged user for DM:', error);
				}
			}
			await Rooms.setAsFederated(room._id);
			this.logger.debug('Direct message room creation completed successfully', room._id);
		} catch (error) {
			this.logger.error('Failed to create direct message room:', error);
			throw error;
		}
	}

	async sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void> {
		try {
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(room._id);
			if (!matrixRoomId) {
				throw new Error(`No Matrix room mapping found for room ${room._id}`);
			}

			const matrixUserId = `@${user.username}:${this.serverName}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);
			if (!existingMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, true, this.serverName);
			}

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping message send');
				return;
			}

			const actualMatrixUserId = existingMatrixUserId || matrixUserId;

			let result;

			const parsedMessage = await toExternalMessageFormat({
				message: message.msg,
				externalRoomId: matrixRoomId,
				homeServerDomain: this.serverName,
			});
			if (!message.tmid) {
				if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
					const quoteMessage = await this.getQuoteMessage(message, matrixRoomId, actualMatrixUserId, this.serverName);
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

					if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
						const quoteMessage = await this.getQuoteMessage(message, matrixRoomId, actualMatrixUserId, this.serverName);
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
					if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
						const quoteMessage = await this.getQuoteMessage(message, matrixRoomId, actualMatrixUserId, this.serverName);
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
			const matrixUserId = `@${message.u.username}:${this.serverName}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(message.u._id);
			if (!existingMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(message.u._id, matrixUserId, true, this.serverName);
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

			const inviterUserId = `@${inviter.username}:${this.serverName}`;

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
							externalUserId = `@${username}:${this.serverName}`;
							await MatrixBridgedUser.createOrUpdateByLocalId(localUser._id, externalUserId, false, this.serverName);
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

			const matrixUserId = `@${user.username}:${this.serverName}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);

			if (!existingMatrixUserId) {
				// User might not have been bridged yet if they never sent a message
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, true, this.serverName);
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

			const kickedMatrixUserId = `@${removedUser.username}:${this.serverName}`;
			const existingKickedMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(removedUser._id);
			if (!existingKickedMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(removedUser._id, kickedMatrixUserId, true, this.serverName);
			}
			const actualKickedMatrixUserId = existingKickedMatrixUserId || kickedMatrixUserId;

			const senderMatrixUserId = `@${userWhoRemoved.username}:${this.serverName}`;
			const existingSenderMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(userWhoRemoved._id);
			if (!existingSenderMatrixUserId) {
				await MatrixBridgedUser.createOrUpdateByLocalId(userWhoRemoved._id, senderMatrixUserId, true, this.serverName);
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
				homeServerDomain: this.serverName,
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

		const powerLevel = role === 'owner' ? 100 : role === 'moderator' ? 50 : 0;

		await this.homeserverServices.room.setPowerLevelForUser(matrixRoomId, senderMatrixUserId, matrixUserId, powerLevel);
	}
}
