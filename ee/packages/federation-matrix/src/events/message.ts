import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { FederationMatrix, Message, MeteorService } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { IUser, IRoom } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { Users, MatrixBridgedUser, MatrixBridgedRoom, Rooms, Subscriptions, Messages } from '@rocket.chat/models';

import { fileTypes } from '../FederationMatrix';
import { toInternalMessageFormat, toInternalQuoteMessageFormat } from '../helpers/message.parsers';
import { MatrixMediaService } from '../services/MatrixMediaService';

const logger = new Logger('federation-matrix:message');

async function getOrCreateFederatedUser(matrixUserId: string): Promise<IUser | null> {
	const [userPart, domain] = matrixUserId.split(':');
	if (!userPart || !domain) {
		logger.error('Invalid Matrix sender ID format:', matrixUserId);
		return null;
	}
	const username = userPart.substring(1);

	const user = await Users.findOneByUsername(matrixUserId);
	if (user) {
		await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, false, domain);
		return user;
	}

	logger.info('Creating new federated user:', { username: matrixUserId, externalId: matrixUserId });

	const userData = {
		username: matrixUserId,
		name: username, // TODO: Fetch display name from Matrix profile
		type: 'user',
		status: UserStatus.ONLINE,
		active: true,
		roles: ['user'],
		requirePasswordChange: false,
		federated: true,
		federation: {
			version: 1,
		},
		createdAt: new Date(),
		_updatedAt: new Date(),
	};

	const { insertedId } = await Users.insertOne(userData);

	await MatrixBridgedUser.createOrUpdateByLocalId(
		insertedId,
		matrixUserId,
		true, // isRemote = true for external Matrix users
		domain,
	);

	const newUser = await Users.findOneById(insertedId);
	if (!newUser) {
		logger.error('Failed to create user:', matrixUserId);
		return null;
	}

	logger.info('Successfully created federated user:', { userId: newUser._id, username });

	return newUser;
}

async function getRoomAndEnsureSubscription(matrixRoomId: string, user: IUser): Promise<IRoom | null> {
	const internalRoomId = await MatrixBridgedRoom.getLocalRoomId(matrixRoomId);
	if (!internalRoomId) {
		logger.error('Room not found in bridge mapping:', matrixRoomId);
		// TODO: Handle room creation for unknown federated rooms
		return null;
	}

	const room = await Rooms.findOneById(internalRoomId);
	if (!room) {
		logger.error('Room not found:', internalRoomId);
		return null;
	}

	if (!room.federated) {
		logger.error('Room is not marked as federated:', { roomId: room._id, matrixRoomId });
		// TODO: Should we update the room to be federated?
	}

	const existingSubscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);

	if (existingSubscription) {
		return room;
	}

	logger.info('Creating subscription for federated user in room:', { userId: user._id, roomId: room._id });

	const { insertedId } = await Subscriptions.createWithRoomAndUser(room, user, {
		ts: new Date(),
		open: false,
		alert: false,
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
	});

	if (insertedId) {
		logger.debug('Successfully created subscription:', insertedId);
		// TODO: Import and use notifyOnSubscriptionChangedById if needed
	}

	return room;
}

async function getThreadMessageId(threadRootEventId: string | undefined): Promise<string | undefined> {
	if (!threadRootEventId) {
		return undefined;
	}

	const threadRootMessage = await Messages.findOneByFederationId(threadRootEventId);
	if (threadRootMessage) {
		logger.debug('Found thread root message:', { tmid: threadRootMessage._id, threadRootEventId });
		return threadRootMessage._id;
	}
	logger.warn('Thread root message not found for event:', threadRootEventId);
	return undefined;
}

async function handleMediaMessage(
	// TODO improve typing
	content: any,
	msgtype: string,
	messageBody: string,
	user: IUser,
	room: IRoom,
	eventId: string,
	tmid?: string,
): Promise<{
	fromId: string;
	rid: string;
	msg: string;
	federation_event_id: string;
	tmid?: string;
	file: any;
	files: any[];
	attachments: any[];
}> {
	const fileInfo = content.info;
	const mimeType = fileInfo.mimetype;
	const fileName = messageBody;

	const fileRefId = await MatrixMediaService.downloadAndStoreRemoteFile(content.url, {
		name: messageBody,
		size: fileInfo.size,
		type: mimeType,
		roomId: room._id,
		userId: user._id,
	});

	let fileExtension = '';
	if (fileName && fileName.includes('.')) {
		fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
	} else if (mimeType && mimeType.includes('/')) {
		fileExtension = mimeType.split('/')[1] || '';
		if (fileExtension === 'jpeg') {
			fileExtension = 'jpg';
		}
	}

	const fileUrl = `/file-upload/${fileRefId}/${encodeURIComponent(fileName)}`;

	// TODO improve typing
	const attachment: any = {
		title: fileName,
		type: 'file',
		title_link: fileUrl,
		title_link_download: true,
	};

	if (msgtype === 'm.image') {
		attachment.image_url = fileUrl;
		attachment.image_type = mimeType;
		attachment.image_size = fileInfo.size || 0;
		attachment.description = '';
		if (fileInfo.w && fileInfo.h) {
			attachment.image_dimensions = {
				width: fileInfo.w,
				height: fileInfo.h,
			};
		}
	} else if (msgtype === 'm.video') {
		attachment.video_url = fileUrl;
		attachment.video_type = mimeType;
		attachment.video_size = fileInfo.size || 0;
		attachment.description = '';
	} else if (msgtype === 'm.audio') {
		attachment.audio_url = fileUrl;
		attachment.audio_type = mimeType;
		attachment.audio_size = fileInfo.size || 0;
		attachment.description = '';
	} else {
		attachment.description = '';
	}

	const fileData = {
		_id: fileRefId,
		name: fileName,
		type: mimeType,
		size: fileInfo.size || 0,
		format: fileExtension,
	};

	return {
		fromId: user._id,
		rid: room._id,
		msg: '',
		federation_event_id: eventId,
		tmid,
		file: fileData,
		files: [fileData],
		attachments: [attachment],
	};
}

export function message(emitter: Emitter<HomeserverEventSignatures>, serverName: string) {
	emitter.on('homeserver.matrix.message', async (data) => {
		try {
			// TODO remove type casting
			const content = data.content as any;
			const msgtype = content?.msgtype;
			const messageBody = content?.body?.toString();

			if (!messageBody && !msgtype) {
				logger.debug('No message content found in event');
				return;
			}

			const user = await getOrCreateFederatedUser(data.sender);
			if (!user) {
				return;
			}

			const room = await getRoomAndEnsureSubscription(data.room_id, user);
			if (!room) {
				return;
			}

			const replyToRelation = content?.['m.relates_to'];
			const threadRelation = content?.['m.relates_to'];
			const isThreadMessage = threadRelation?.rel_type === 'm.thread';
			const isQuoteMessage = replyToRelation?.['m.in_reply_to']?.event_id && !replyToRelation?.is_falling_back;
			const threadRootEventId = isThreadMessage ? threadRelation.event_id : undefined;
			const tmid = await getThreadMessageId(threadRootEventId);

			const isMediaMessage = Object.values(fileTypes).includes(msgtype);

			const isEditedMessage = data.content['m.relates_to']?.rel_type === 'm.replace';
			if (isEditedMessage && data.content['m.relates_to']?.event_id && data.content['m.new_content']) {
				logger.debug('Received edited message from Matrix, updating existing message');
				const originalMessage = await Messages.findOneByFederationId(data.content['m.relates_to'].event_id);
				if (!originalMessage) {
					logger.error('Original message not found for edit:', data.content['m.relates_to'].event_id);
					return;
				}
				if (originalMessage.federation?.eventId !== data.content['m.relates_to'].event_id) {
					return;
				}
				if (originalMessage.msg === data.content['m.new_content']?.body) {
					logger.debug('No changes in message content, skipping update');
					return;
				}

				if (isQuoteMessage && room.name) {
					const messageToReplyToUrl = await MeteorService.getMessageURLToReplyTo(
						room.t as string,
						room._id,
						room.name,
						originalMessage._id,
					);
					const formatted = await toInternalQuoteMessageFormat({
						messageToReplyToUrl,
						formattedMessage: data.content.formatted_body || '',
						rawMessage: messageBody,
						homeServerDomain: serverName,
						senderExternalId: data.sender,
					});
					await Message.updateMessage(
						{
							...originalMessage,
							msg: formatted,
						},
						user,
						originalMessage,
					);
					return;
				}

				const formatted = toInternalMessageFormat({
					rawMessage: data.content['m.new_content'].body,
					formattedMessage: data.content.formatted_body || '',
					homeServerDomain: serverName,
					senderExternalId: data.sender,
				});
				await Message.updateMessage(
					{
						...originalMessage,
						msg: formatted,
					},
					user,
					originalMessage,
				);
				return;
			}

			if (isQuoteMessage && room.name) {
				const originalMessage = await Messages.findOneByFederationId(replyToRelation?.['m.in_reply_to']?.event_id);
				if (!originalMessage) {
					logger.error('Original message not found for quote:', replyToRelation?.['m.in_reply_to']?.event_id);
					return;
				}
				const messageToReplyToUrl = await MeteorService.getMessageURLToReplyTo(room.t as string, room._id, room.name, originalMessage._id);
				const formatted = await toInternalQuoteMessageFormat({
					messageToReplyToUrl,
					formattedMessage: data.content.formatted_body || '',
					rawMessage: messageBody,
					homeServerDomain: serverName,
					senderExternalId: data.sender,
				});
				await Message.saveMessageFromFederation({
					fromId: user._id,
					rid: room._id,
					msg: formatted,
					federation_event_id: data.event_id,
					tmid,
				});
				return;
			}

			if (isMediaMessage && content?.url) {
				const result = await handleMediaMessage(content, msgtype, messageBody, user, room, data.event_id, tmid);
				await Message.saveMessageFromFederation(result);
			} else {
				const formatted = toInternalMessageFormat({
					rawMessage: messageBody,
					formattedMessage: data.content.formatted_body || '',
					homeServerDomain: serverName,
					senderExternalId: data.sender,
				});
				await Message.saveMessageFromFederation({
					fromId: user._id,
					rid: room._id,
					msg: formatted,
					federation_event_id: data.event_id,
					tmid,
				});
			}
		} catch (error) {
			logger.error('Error processing Matrix message:', error);
		}
	});

	emitter.on('homeserver.matrix.redaction', async (data) => {
		try {
			const redactedEventId = data.redacts;
			if (!redactedEventId) {
				logger.debug('No redacts field in redaction event');
				return;
			}

			const messageEvent = await FederationMatrix.getEventById(redactedEventId);
			if (!messageEvent || messageEvent.type !== 'm.room.message') {
				logger.debug(`Event ${redactedEventId} is not a message event`);
				return;
			}

			const rcMessage = await Messages.findOneByFederationId(data.redacts);
			if (!rcMessage) {
				logger.debug(`No RC message found for event ${data.redacts}`);
				return;
			}
			const internalUsername = data.sender;
			const user = await Users.findOneByUsername(internalUsername);
			if (!user) {
				logger.debug(`User not found: ${internalUsername}`);
				return;
			}

			await Message.deleteMessage(user, rcMessage);
		} catch (error) {
			logger.error('Failed to process Matrix removal redaction:', error);
		}
	});
}
