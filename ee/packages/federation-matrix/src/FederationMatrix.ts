import { type IFederationMatrixService, ServiceClass } from '@rocket.chat/core-services';
import {
	isDeletedMessage,
	isMessageFromMatrixFederation,
	isQuoteAttachment,
	isRoomNativeFederated,
	isUserNativeFederated,
	UserStatus,
} from '@rocket.chat/core-typings';
import type { MessageQuoteAttachment, IMessage, IRoom, IUser, IRoomNativeFederated } from '@rocket.chat/core-typings';
import { getAllServices } from '@rocket.chat/federation-sdk';
import type { EventID, HomeserverServices, FileMessageType, PresenceState } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Users, Subscriptions, Messages, Rooms, Settings } from '@rocket.chat/models';
import emojione from 'emojione';

import { toExternalMessageFormat, toExternalQuoteMessageFormat } from './helpers/message.parsers';
import { MatrixMediaService } from './services/MatrixMediaService';

export const fileTypes: Record<string, FileMessageType> = {
	image: 'm.image',
	video: 'm.video',
	audio: 'm.audio',
	file: 'm.file',
};

/** helper to validate the username format */
export function validateFederatedUsername(username: string): username is `@${string}:${string}` {
	return /^@[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(username);
}

/**
 * Helper function to create a federated user
 *
 * Because of historical reasons, we can have users only with federated flag but no federation object
 * So we need to upsert the user with the federation object
 */
export async function createOrUpdateFederatedUser(options: {
	username: `@${string}:${string}`;
	name?: string;
	status?: UserStatus;
	origin: string;
}): Promise<{ insertedId: any }> {
	const { username, name = username, status = UserStatus.OFFLINE, origin } = options;

	return Users.updateOne(
		{
			'federation.mui': username,
		},
		{
			username,
			name,
			type: 'user' as const,
			status,
			active: true,
			roles: ['user'],
			requirePasswordChange: false,
			federated: true,
			federation: {
				version: 1,
				mui: username,
				origin,
			},
			createdAt: new Date(),
			_updatedAt: new Date(),
		},
		{
			upsert: true,
		},
	).then((result) => ({ insertedId: result.upsertedId }));
}

export { generateEd25519RandomSecretKey } from '@rocket.chat/federation-sdk';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';

	private serverName: string;

	private processEDUTyping: boolean;

	private processEDUPresence: boolean;

	private homeserverServices: HomeserverServices;

	private readonly logger = new Logger(this.name);

	async created(): Promise<void> {
		// although this is async function, it is not awaited, so we need to register the listeners before everything else
		this.onEvent('watch.settings', async ({ clientAction, setting }): Promise<void> => {
			if (clientAction === 'removed') {
				return;
			}

			const { _id, value } = setting;
			if (_id === 'Federation_Service_Domain' && typeof value === 'string') {
				this.serverName = value;
			} else if (_id === 'Federation_Service_EDU_Process_Typing' && typeof value === 'boolean') {
				this.processEDUTyping = value;
			} else if (_id === 'Federation_Service_EDU_Process_Presence' && typeof value === 'boolean') {
				this.processEDUPresence = value;
			}
		});

		this.onEvent(
			'presence.status',
			async ({ user }: { user: Pick<IUser, '_id' | 'username' | 'status' | 'statusText' | 'name' | 'roles'> }): Promise<void> => {
				if (!this.processEDUPresence) {
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
				void this.homeserverServices.edu.sendPresenceUpdateToRooms(
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

		this.serverName = (await Settings.getValueById<string>('Federation_Service_Domain')) || '';
		this.processEDUTyping = (await Settings.getValueById<boolean>('Federation_Service_EDU_Process_Typing')) || false;
		this.processEDUPresence = (await Settings.getValueById<boolean>('Federation_Service_EDU_Process_Presence')) || false;

		try {
			this.homeserverServices = getAllServices();

			MatrixMediaService.setHomeserverServices(this.homeserverServices);
		} catch (err) {
			this.logger.warn({ msg: 'Homeserver module not available, running in limited mode', err });
		}
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

	async ensureFederatedUsersExistLocally(usernames: string[]): Promise<void> {
		try {
			this.logger.debug('Ensuring federated users exist locally before DM creation', { memberCount: usernames.length });

			const federatedUsers = usernames.filter((username) => username?.includes(':') && username?.includes('@'));
			for await (const username of federatedUsers) {
				if (!username) {
					continue;
				}

				const existingUser = await Users.findOneByUsername(username);
				if (existingUser) {
					continue;
				}

				await Users.create({
					username,
					name: username,
					type: 'user' as const,
					status: UserStatus.OFFLINE,
					active: true,
					roles: ['user'],
					requirePasswordChange: false,
					federated: true,
					federation: {
						version: 1,
						mui: username,
						origin: username.split(':')[1],
					},
					createdAt: new Date(),
					_updatedAt: new Date(),
				});
			}
		} catch (error) {
			this.logger.error('Failed to ensure federated users exist locally:', error);
		}
	}

	async createDirectMessageRoom(room: IRoom, members: IUser[], creatorId: IUser['_id']): Promise<void> {
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

				if (otherMember.username?.includes(':')) {
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
					if (!member.username?.includes(':')) {
						continue;
					}

					const memberMatrixUserId = member.username.startsWith('@') ? member.username : `@${member.username}`;

					const existingMemberMatrixUserId = await Users.findOne({ 'federation.mui': memberMatrixUserId });
					if (!existingMemberMatrixUserId) {
						await createOrUpdateFederatedUser({
							username: member._id as `@${string}:${string}`,
							origin: memberMatrixUserId.split(':').pop() || '',
						});
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

			// TODO handle multiple files, we currently save thumbs on files[], we need to flag them as thumb so we can ignore them here
			const [file] = message.files;

			const mxcUri = await MatrixMediaService.prepareLocalFileForMatrix(file._id, matrixDomain, matrixRoomId);

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

	async deleteMessage(matrixRoomId: string, message: IMessage): Promise<void> {
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
			const eventId = await this.homeserverServices.message.redactMessage(matrixRoomId, matrixEventId as EventID);

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

	async verifyMatrixIds(matrixIds: string[]): Promise<{ [key: string]: string }> {
		const results = Object.fromEntries(
			await Promise.all(
				matrixIds.map(async (matrixId) => {
					// Split only on the first ':' (after the leading '@') so we keep any port in the homeserver
					const separatorIndex = matrixId.indexOf(':', 1);
					if (separatorIndex === -1) {
						return [matrixId, 'UNABLE_TO_VERIFY'];
					}
					const userId = matrixId.slice(0, separatorIndex);
					const homeserverUrl = matrixId.slice(separatorIndex + 1);

					if (homeserverUrl === this.serverName) {
						const user = await Users.findOneByUsername(userId.slice(1));
						return [matrixId, user ? 'VERIFIED' : 'UNVERIFIED'];
					}

					if (!homeserverUrl) {
						return [matrixId, 'UNABLE_TO_VERIFY'];
					}
					try {
						const result = await this.homeserverServices.request.get<
							| {
									avatar_url: string;
									displayname: string;
							  }
							| {
									errcode: string;
									error: string;
							  }
						>(homeserverUrl, `/_matrix/federation/v1/query/profile`, { user_id: matrixId });

						if ('errcode' in result && result.errcode === 'M_NOT_FOUND') {
							return [matrixId, 'UNVERIFIED'];
						}

						return [matrixId, 'VERIFIED'];
					} catch (e) {
						return [matrixId, 'UNABLE_TO_VERIFY'];
					}
				}),
			),
		);

		return results;
	}
}
