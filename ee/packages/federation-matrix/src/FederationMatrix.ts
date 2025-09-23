import 'reflect-metadata';

import type { FileMessageType, PresenceState } from '@hs/core';
import { ConfigService, createFederationContainer, getAllServices } from '@hs/federation-sdk';
import type { HomeserverEventSignatures, HomeserverServices, FederationContainerOptions } from '@hs/federation-sdk';
import type { EventID } from '@hs/room';
import { type IFederationMatrixService, ServiceClass, Settings } from '@rocket.chat/core-services';
import {
	isDeletedMessage,
	isMessageFromMatrixFederation,
	isQuoteAttachment,
	isRoomNativeFederated,
	isUserNativeFederated,
	UserStatus,
} from '@rocket.chat/core-typings';
import type { MessageQuoteAttachment, IMessage, IRoom, IUser, IRoomNativeFederated } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { Users, Subscriptions, Messages, Rooms } from '@rocket.chat/models';
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
import { isFederationDomainAllowedMiddleware } from './api/middlewares/isFederationDomainAllowed';
import { isFederationEnabledMiddleware } from './api/middlewares/isFederationEnabled';
import { isLicenseEnabledMiddleware } from './api/middlewares/isLicenseEnabled';
import { registerEvents } from './events';
import { toExternalMessageFormat, toExternalQuoteMessageFormat } from './helpers/message.parsers';
import { MatrixMediaService } from './services/MatrixMediaService';

export const fileTypes: Record<string, FileMessageType> = {
	image: 'm.image',
	video: 'm.video',
	audio: 'm.audio',
	file: 'm.file',
};

export { generateEd25519RandomSecretKey } from '@hs/crypto';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';

	private eventHandler: Emitter<HomeserverEventSignatures>;

	private homeserverServices: HomeserverServices;

	private serverName: string;

	private readonly logger = new Logger(this.name);

	private httpRoutes: { matrix: Router<'/_matrix'>; wellKnown: Router<'/.well-known'> };

	private processEDUTyping = false;

	private processEDUPresence = false;

	private constructor(emitter?: Emitter<HomeserverEventSignatures>) {
		super();
		this.eventHandler = emitter || new Emitter<HomeserverEventSignatures>();
	}

	static async create(instanceId: string, emitter?: Emitter<HomeserverEventSignatures>): Promise<FederationMatrix> {
		const instance = new FederationMatrix(emitter);
		const settingsSigningAlg = await Settings.get<string>('Federation_Service_Matrix_Signing_Algorithm');
		const settingsSigningVersion = await Settings.get<string>('Federation_Service_Matrix_Signing_Version');
		const settingsSigningKey = await Settings.get<string>('Federation_Service_Matrix_Signing_Key');

		const siteUrl = await Settings.get<string>('Site_Url');

		const serverHostname = new URL(siteUrl).hostname;

		instance.serverName = serverHostname;

		instance.processEDUTyping = await Settings.get<boolean>('Federation_Service_EDU_Process_Typing');
		instance.processEDUPresence = await Settings.get<boolean>('Federation_Service_EDU_Process_Presence');

		const mongoUri = process.env.MONGO_URL || 'mongodb://localhost:3001/meteor';

		const dbName = process.env.DATABASE_NAME || new URL(mongoUri).pathname.slice(1);

		const config = new ConfigService({
			instanceId,
			serverName: serverHostname,
			keyRefreshInterval: Number.parseInt(process.env.MATRIX_KEY_REFRESH_INTERVAL || '60', 10),
			matrixDomain: serverHostname,
			version: process.env.SERVER_VERSION || '1.0',
			port: Number.parseInt(process.env.SERVER_PORT || '8080', 10),
			signingKey: `${settingsSigningAlg} ${settingsSigningVersion} ${settingsSigningKey}`,
			signingKeyPath: process.env.CONFIG_FOLDER || './rocketchat.signing.key',
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
		MatrixMediaService.setHomeserverServices(instance.homeserverServices);
		instance.buildMatrixHTTPRoutes();

		instance.onEvent(
			'presence.status',
			async ({ user }: { user: Pick<IUser, '_id' | 'username' | 'status' | 'statusText' | 'name' | 'roles'> }): Promise<void> => {
				if (!instance.processEDUPresence) {
					return;
				}

				if (!user.username || !user.status || user.username.includes(':')) {
					return;
				}
				const localUser = await Users.findOneByUsername(user.username, { projection: { _id: 1, federated: 1, federation: 1 } });
				if (!localUser) {
					return;
				}

				if (!isUserNativeFederated(localUser)) {
					return;
				}

				// TODO: Check if it should exclude himself from the list
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
							user_id: localUser.federation.mui,
							presence: statusMap[user.status] || 'offline',
						},
					],
					roomsUserIsMemberOf.map(({ externalRoomId }) => externalRoomId).filter(Boolean),
				);
			},
		);

		return instance;
	}

	private buildMatrixHTTPRoutes() {
		const matrix = new Router('/_matrix');
		const wellKnown = new Router('/.well-known');

		matrix
			.use(isFederationEnabledMiddleware)
			.use(isLicenseEnabledMiddleware)
			.use(isFederationDomainAllowedMiddleware)
			.use(getMatrixInviteRoutes(this.homeserverServices))
			.use(getMatrixProfilesRoutes(this.homeserverServices))
			.use(getMatrixRoomsRoutes(this.homeserverServices))
			.use(getMatrixSendJoinRoutes(this.homeserverServices))
			.use(getMatrixTransactionsRoutes(this.homeserverServices))
			.use(getKeyServerRoutes(this.homeserverServices))
			.use(getFederationVersionsRoutes(this.homeserverServices))
			.use(getMatrixMediaRoutes(this.homeserverServices));

		wellKnown.use(isFederationEnabledMiddleware).use(isLicenseEnabledMiddleware).use(getWellKnownRoutes(this.homeserverServices));

		this.httpRoutes = { matrix, wellKnown };
	}

	async created(): Promise<void> {
		try {
			registerEvents(this.eventHandler, this.serverName, { typing: this.processEDUTyping, presence: this.processEDUPresence });
		} catch (error) {
			this.logger.warn('Homeserver module not available, running in limited mode');
		}
	}

	getAllRoutes() {
		return this.httpRoutes;
	}

	async createRoom(room: IRoom, owner: IUser, members: string[]): Promise<{ room_id: string; event_id: string }> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping room creation');
			throw new Error('Homeserver services not available');
		}

		if (room.t !== 'c' && room.t !== 'p') {
			throw new Error('Room is not a public or private room');
		}

		try {
			const matrixUserId = `@${owner.username}:${this.serverName}`;
			const roomName = room.name || room.fname || 'Untitled Room';

			// canonical alias computed from name
			const matrixRoomResult = await this.homeserverServices.room.createRoom(matrixUserId, roomName, room.t === 'c' ? 'public' : 'invite');

			this.logger.debug('Matrix room created:', matrixRoomResult);

			await Rooms.setAsFederated(room._id, { mrid: matrixRoomResult.room_id, origin: this.serverName });

			for await (const member of members) {
				if (member === owner.username) {
					continue;
				}

				// We are not generating bridged users for members outside of the current workspace
				// They will be created when the invite is accepted

				await this.homeserverServices.invite.inviteUserToRoom(member, matrixRoomResult.room_id, matrixUserId);
			}

			this.logger.debug('Room creation completed successfully', room._id);

			return matrixRoomResult;
		} catch (error) {
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
				} else if (typeof member.username === 'string') {
					username = member.username;
				} else {
					continue;
				}

				if (!username.includes(':') && !username.includes('@')) {
					continue;
				}

				const existingUser = await Users.findOneByUsername(username);
				if (existingUser) {
					// TODO review: DM
					// const existingBridge = await MatrixBridgedUser.getExternalUserIdByLocalUserId(existingUser._id); // TODO review: DM
					// if (!existingBridge) {
					// 	const remoteDomain = externalUserId.split(':')[1] || this.serverName;
					// 	await MatrixBridgedUser.createOrUpdateByLocalId(existingUser._id, externalUserId, true, remoteDomain);
					// }
					continue;
				}

				// TODO: there is not need to check if the username includes ':' or '@', we should just use the username as is
				const externalUserId = username.includes(':') ? `@${username}` : `@${username}:${this.serverName}`;
				this.logger.debug('Creating federated user locally', { externalUserId, username });

				const remoteDomain = externalUserId.split(':')[1];

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
					federation: {
						version: 1,
						mui: externalUserId,
						origin: remoteDomain,
					},
					createdAt: new Date(),
					_updatedAt: new Date(),
				};

				const { insertedId } = await Users.insertOne(newUser);

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

			const actualMatrixUserId = `@${creator.username}:${this.serverName}`;

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

			// TODO is this needed?
			// const mapping = await MatrixBridgedRoom.getLocalRoomId(matrixRoomResult.room_id);
			// if (!mapping) {
			// 	await MatrixBridgedRoom.createOrUpdateByLocalRoomId(room._id, matrixRoomResult.room_id, this.serverName);
			// }

			for await (const member of members) {
				if (typeof member !== 'string' && member._id === creatorId) {
					continue;
				}

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
						continue;
					}

					if (memberId) {
						const existingMemberMatrixUserId = await Users.findOne({ 'federation.mui': memberId });
						if (!existingMemberMatrixUserId) {
							const newUser = {
								username: memberId,
								name: memberId,
								type: 'user' as const,
								status: UserStatus.OFFLINE,
								active: true,
								roles: ['user'],
								requirePasswordChange: false,
								federated: true,
								federation: {
									version: 1,
									mui: memberId,
									origin: memberMatrixUserId.split(':').pop(),
								},
								createdAt: new Date(),
								_updatedAt: new Date(),
							};

							await Users.insertOne(newUser);
						}
					}

					if (members.length > 2) {
						await this.homeserverServices.invite.inviteUserToRoom(memberMatrixUserId, matrixRoomResult.room_id, actualMatrixUserId);
					}
				} catch (error) {
					this.logger.error('Error creating or updating bridged user for DM:', error);
				}
			}
			await Rooms.setAsFederated(room._id, {
				mrid: matrixRoomResult.room_id,
				origin: this.serverName,
			});
			this.logger.debug('Direct message room creation completed successfully', room._id);
		} catch (error) {
			this.logger.error('Failed to create direct message room:', error);
			throw error;
		}
	}

	private getMatrixMessageType(mimeType?: string): FileMessageType {
		const mainType = mimeType?.split('/')[0];
		if (!mainType) {
			return fileTypes.file;
		}

		return fileTypes[mainType] ?? fileTypes.file;
	}

	private async handleFileMessage(
		message: IMessage,
		matrixRoomId: string,
		matrixUserId: string,
		matrixDomain: string,
	): Promise<{ eventId: string } | null> {
		if (!message.files || message.files.length === 0) {
			return null;
		}

		try {
			let lastEventId: { eventId: string } | null = null;

			for await (const file of message.files) {
				const mxcUri = await MatrixMediaService.prepareLocalFileForMatrix(file._id, matrixDomain);

				const msgtype = this.getMatrixMessageType(file.type);
				const fileContent = {
					body: file.name,
					msgtype,
					url: mxcUri,
					info: {
						mimetype: file.type,
						size: file.size,
					},
				};

				lastEventId = await this.homeserverServices.message.sendFileMessage(matrixRoomId, fileContent, matrixUserId);
			}

			return lastEventId;
		} catch (error) {
			this.logger.error('Failed to handle file message', {
				messageId: message._id,
				error,
			});
			throw error;
		}
	}

	private async handleTextMessage(
		message: IMessage,
		matrixRoomId: string,
		matrixUserId: string,
		matrixDomain: string,
	): Promise<{ eventId: string } | null> {
		const parsedMessage = await toExternalMessageFormat({
			message: message.msg,
			externalRoomId: matrixRoomId,
			homeServerDomain: matrixDomain,
		});

		if (message.tmid) {
			return this.handleThreadedMessage(message, matrixRoomId, matrixUserId, matrixDomain, parsedMessage);
		}

		if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
			return this.handleQuoteMessage(message, matrixRoomId, matrixUserId, matrixDomain);
		}

		return this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, parsedMessage, matrixUserId);
	}

	private async handleThreadedMessage(
		message: IMessage,
		matrixRoomId: string,
		matrixUserId: string,
		matrixDomain: string,
		parsedMessage: string,
	): Promise<{ eventId: string } | null> {
		if (!message.tmid) {
			throw new Error('Thread message ID not found');
		}

		const threadRootMessage = await Messages.findOneById(message.tmid);
		const threadRootEventId = threadRootMessage?.federation?.eventId;

		if (!threadRootEventId) {
			this.logger.warn('Thread root event ID not found, sending as regular message');
			if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
				return this.handleQuoteMessage(message, matrixRoomId, matrixUserId, matrixDomain);
			}
			return this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, parsedMessage, matrixUserId);
		}

		const latestThreadMessage = await Messages.findLatestFederationThreadMessageByTmid(message.tmid, message._id);
		const latestThreadEventId = latestThreadMessage?.federation?.eventId;

		if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
			const quoteMessage = await this.getQuoteMessage(message, matrixRoomId, matrixUserId, matrixDomain);
			if (!quoteMessage) {
				throw new Error('Failed to retrieve quote message');
			}
			return this.homeserverServices.message.sendReplyToInsideThreadMessage(
				matrixRoomId,
				quoteMessage.rawMessage,
				quoteMessage.formattedMessage,
				matrixUserId,
				threadRootEventId,
				quoteMessage.eventToReplyTo,
			);
		}

		return this.homeserverServices.message.sendThreadMessage(
			matrixRoomId,
			message.msg,
			parsedMessage,
			matrixUserId,
			threadRootEventId,
			latestThreadEventId,
		);
	}

	private async handleQuoteMessage(
		message: IMessage,
		matrixRoomId: string,
		matrixUserId: string,
		matrixDomain: string,
	): Promise<{ eventId: string } | null> {
		const quoteMessage = await this.getQuoteMessage(message, matrixRoomId, matrixUserId, matrixDomain);
		if (!quoteMessage) {
			throw new Error('Failed to retrieve quote message');
		}
		return this.homeserverServices.message.sendReplyToMessage(
			matrixRoomId,
			quoteMessage.rawMessage,
			quoteMessage.formattedMessage,
			quoteMessage.eventToReplyTo,
			matrixUserId,
		);
	}

	async sendMessage(message: IMessage, room: IRoomNativeFederated, user: IUser): Promise<void> {
		try {
			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping message send');
				return;
			}

			const userMui = isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${this.serverName}`;

			let result;
			if (message.files && message.files.length > 0) {
				result = await this.handleFileMessage(message, room.federation.mrid, userMui, this.serverName);
			} else {
				result = await this.handleTextMessage(message, room.federation.mrid, userMui, this.serverName);
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
		if (!messageToReplyTo?.federation?.eventId) {
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

	async deleteMessage(matrixRoomId: string, message: IMessage, uid: string): Promise<void> {
		try {
			if (!isMessageFromMatrixFederation(message) || isDeletedMessage(message)) {
				return;
			}

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping message redaction');
				return;
			}

			const matrixEventId = message.federation?.eventId;
			if (!matrixEventId) {
				throw new Error(`No Matrix event ID mapping found for message ${message._id}`);
			}

			// TODO fix branded EventID and remove type casting
			// TODO message.u?.username is not the user who removed the message
			const eventId = await this.homeserverServices.message.redactMessage(matrixRoomId, matrixEventId as EventID, uid);

			this.logger.debug('Message Redaction sent to Matrix successfully:', eventId);
		} catch (error) {
			this.logger.error('Failed to send redaction to Matrix:', error);
			throw error;
		}
	}

	async inviteUsersToRoom(room: IRoomNativeFederated, usersUserName: string[], inviter: IUser): Promise<void> {
		try {
			const inviterUserId = `@${inviter.username}:${this.serverName}`;

			await Promise.all(
				usersUserName
					.filter((username) => {
						const isExternalUser = username.includes(':');
						return isExternalUser;
					})
					.map(async (username) => {
						const alreadyMember = await Subscriptions.findOneByRoomIdAndUsername(room._id, username, { projection: { _id: 1 } });
						if (alreadyMember) {
							return;
						}

						await this.homeserverServices.invite.inviteUserToRoom(username, room.federation.mrid, inviterUserId);
					}),
			);
		} catch (error) {
			this.logger.error({ msg: 'Failed to invite an user to Matrix:', err: error });
			throw error;
		}
	}

	async sendReaction(messageId: string, reaction: string, user: IUser): Promise<void> {
		try {
			const message = await Messages.findOneById(messageId);
			if (!message) {
				throw new Error(`Message ${messageId} not found`);
			}

			const room = await Rooms.findOneById(message.rid);
			if (!room || !isRoomNativeFederated(room)) {
				throw new Error(`No Matrix room mapping found for room ${message.rid}`);
			}

			const matrixEventId = message.federation?.eventId;
			if (!matrixEventId) {
				throw new Error(`No Matrix event ID mapping found for message ${messageId}`);
			}

			const reactionKey = emojione.shortnameToUnicode(reaction);

			const userMui = isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${this.serverName}`;

			const eventId = await this.homeserverServices.message.sendReaction(room.federation.mrid, matrixEventId, reactionKey, userMui);

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

			const room = await Rooms.findOneById(message.rid);
			if (!room || !isRoomNativeFederated(room)) {
				this.logger.error(`No Matrix room mapping found for room ${message.rid}`);
				return;
			}

			const reactionKey = emojione.shortnameToUnicode(reaction);

			const userMui = isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${this.serverName}`;

			const reactionData = oldMessage.reactions?.[reaction];
			if (!reactionData?.federationReactionEventIds) {
				return;
			}

			for await (const [eventId, username] of Object.entries(reactionData.federationReactionEventIds)) {
				if (username !== user.username) {
					continue;
				}

				const redactionEventId = await this.homeserverServices.message.unsetReaction(
					room.federation.mrid,
					eventId as EventID,
					reactionKey,
					userMui,
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

	async getEventById(eventId: EventID): Promise<any | null> {
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
			if (!room || !isRoomNativeFederated(room)) {
				this.logger.debug(`Room ${roomId} is not federated, skipping leave operation`);
				return;
			}

			if (!this.homeserverServices) {
				this.logger.warn('Homeserver services not available, skipping room leave');
				return;
			}

			const actualMatrixUserId = isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${this.serverName}`;

			await this.homeserverServices.room.leaveRoom(room.federation.mrid, actualMatrixUserId);

			this.logger.info(`User ${user.username} left Matrix room ${room.federation.mrid} successfully`);
		} catch (error) {
			this.logger.error('Failed to leave room in Matrix:', error);
			throw error;
		}
	}

	async kickUser(room: IRoomNativeFederated, removedUser: IUser, userWhoRemoved: IUser): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping user kick');
			return;
		}

		try {
			const actualKickedMatrixUserId = isUserNativeFederated(removedUser)
				? removedUser.federation.mui
				: `@${removedUser.username}:${this.serverName}`;

			const actualSenderMatrixUserId = isUserNativeFederated(userWhoRemoved)
				? userWhoRemoved.federation.mui
				: `@${userWhoRemoved.username}:${this.serverName}`;

			await this.homeserverServices.room.kickUser(
				room.federation.mrid,
				actualKickedMatrixUserId,
				actualSenderMatrixUserId,
				`Kicked by ${userWhoRemoved.username}`,
			);

			this.logger.info(`User ${removedUser.username} was kicked from Matrix room ${room.federation.mrid} by ${userWhoRemoved.username}`);
		} catch (error) {
			this.logger.error('Failed to kick user from Matrix room:', error);
			throw error;
		}
	}

	async updateMessage(room: IRoomNativeFederated, message: IMessage): Promise<void> {
		try {
			const matrixEventId = message.federation?.eventId;
			if (!matrixEventId) {
				throw new Error(`No Matrix event ID mapping found for message ${message._id}`);
			}

			const user = await Users.findOneById(message.u._id, { projection: { _id: 1, username: 1, federation: 1, federated: 1 } });
			if (!user) {
				this.logger.error(`No user found for ID ${message.u._id}`);
				return;
			}

			const userMui = isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${this.serverName}`;

			const parsedMessage = await toExternalMessageFormat({
				message: message.msg,
				externalRoomId: room.federation.mrid,
				homeServerDomain: this.serverName,
			});
			const eventId = await this.homeserverServices.message.updateMessage(
				room.federation.mrid,
				message.msg,
				parsedMessage,
				userMui,
				matrixEventId,
			);

			this.logger.debug('Message updated in Matrix successfully:', eventId);
		} catch (error) {
			this.logger.error('Failed to update message in Matrix:', error);
			throw error;
		}
	}

	async updateRoomName(rid: string, displayName: string, user: IUser): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping room name update');
			return;
		}

		const room = await Rooms.findOneById(rid);
		if (!room || !isRoomNativeFederated(room)) {
			throw new Error(`No Matrix room mapping found for room ${rid}`);
		}

		const userMui = isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${this.serverName}`;

		await this.homeserverServices.room.updateRoomName(room.federation.mrid, displayName, userMui);
	}

	async updateRoomTopic(room: IRoomNativeFederated, topic: string, user: IUser): Promise<void> {
		if (!this.homeserverServices) {
			this.logger.warn('Homeserver services not available, skipping room topic update');

			return;
		}

		const userMui = isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${this.serverName}`;

		await this.homeserverServices.room.setRoomTopic(room.federation.mrid, userMui, topic);
	}

	async addUserRoleRoomScoped(
		room: IRoomNativeFederated,
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

		const user = await Users.findOneById(userId);
		if (!user) {
			throw new Error(`No user found for ID ${userId}`);
		}
		const userMui = isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${this.serverName}`;

		const userSender = await Users.findOneById(senderId);
		if (!userSender) {
			throw new Error(`No user found for ID ${senderId}`);
		}
		const senderMui = isUserNativeFederated(userSender) ? userSender.federation.mui : `@${userSender.username}:${this.serverName}`;

		let powerLevel = 0;
		if (role === 'owner') {
			powerLevel = 100;
		} else if (role === 'moderator') {
			powerLevel = 50;
		}
		await this.homeserverServices.room.setPowerLevelForUser(room.federation.mrid, senderMui, userMui, powerLevel);
	}

	async notifyUserTyping(rid: string, user: string, isTyping: boolean) {
		if (!this.processEDUTyping) {
			return;
		}

		if (!rid || !user) {
			return;
		}
		const room = await Rooms.findOneById(rid);
		if (!room || !isRoomNativeFederated(room)) {
			return;
		}
		const localUser = await Users.findOneByUsername<Pick<IUser, '_id' | 'username' | 'federation' | 'federated'>>(user, {
			projection: { _id: 1, username: 1, federation: 1, federated: 1 },
		});

		if (!localUser) {
			return;
		}

		const userMui = isUserNativeFederated(localUser) ? localUser.federation.mui : `@${localUser.username}:${this.serverName}`;

		void this.homeserverServices.edu.sendTypingNotification(room.federation.mrid, userMui, isTyping);
	}
}
