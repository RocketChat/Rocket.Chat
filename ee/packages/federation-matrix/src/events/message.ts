import { FederationMatrix, Message, MeteorService } from '@rocket.chat/core-services';
import type { IUser, IRoom, FileAttachmentProps } from '@rocket.chat/core-typings';
import { type FileMessageType, type MessageType, type FileMessageContent, type EventID, federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Users, Rooms, Messages } from '@rocket.chat/models';

import { fileTypes } from '../FederationMatrix';
import { toInternalMessageFormat, toInternalQuoteMessageFormat } from '../helpers/message.parsers';
import { MatrixMediaService } from '../services/MatrixMediaService';

const logger = new Logger('federation-matrix:message');

async function getThreadMessageId(threadRootEventId: EventID): Promise<{ tmid: string; tshow: boolean } | undefined> {
	const threadRootMessage = await Messages.findOneByFederationId(threadRootEventId);
	if (!threadRootMessage) {
		logger.warn('Thread root message not found for event:', threadRootEventId);
		return;
	}

	const shouldSetTshow = !threadRootMessage?.tcount;
	return { tmid: threadRootMessage._id, tshow: shouldSetTshow };
}

async function handleMediaMessage(
	url: string,
	fileInfo: FileMessageContent['info'],
	msgtype: MessageType,
	messageBody: string,
	user: IUser,
	room: IRoom,
	matrixRoomId: string,
	eventId: EventID,
	thread?: { tmid: string; tshow: boolean },
): Promise<{
	fromId: string;
	rid: string;
	msg: string;
	federation_event_id: string;
	thread?: { tmid: string; tshow: boolean };
	attachments: [FileAttachmentProps];
}> {
	const mimeType = fileInfo?.mimetype;
	const fileName = messageBody;

	const fileRefId = await MatrixMediaService.downloadAndStoreRemoteFile(url, matrixRoomId, {
		name: messageBody,
		size: fileInfo?.size,
		type: mimeType,
		roomId: room._id,
		userId: user._id,
	});

	let fileExtension = '';
	if (fileName?.includes('.')) {
		fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
	} else if (mimeType?.includes('/')) {
		fileExtension = mimeType.split('/')[1] || '';
		if (fileExtension === 'jpeg') {
			fileExtension = 'jpg';
		}
	}

	const fileUrl = `/file-upload/${fileRefId}/${encodeURIComponent(fileName)}`;

	let attachment: FileAttachmentProps = {
		title: fileName,
		type: 'file',
		title_link: fileUrl,
		title_link_download: true,
		description: '',
	};

	if (msgtype === 'm.image') {
		attachment = {
			...attachment,
			image_url: fileUrl,
			image_type: mimeType,
			image_size: fileInfo?.size || 0,
			...(fileInfo?.w &&
				fileInfo?.h && {
					image_dimensions: {
						width: fileInfo.w,
						height: fileInfo.h,
					},
				}),
		};
	} else if (msgtype === 'm.video') {
		attachment = {
			...attachment,
			video_url: fileUrl,
			video_type: mimeType,
			video_size: fileInfo?.size || 0,
		};
	} else if (msgtype === 'm.audio') {
		attachment = {
			...attachment,
			audio_url: fileUrl,
			audio_type: mimeType,
			audio_size: fileInfo?.size || 0,
		};
	}

	return {
		fromId: user._id,
		rid: room._id,
		msg: '',
		federation_event_id: eventId,
		thread,
		attachments: [attachment],
	};
}

export function message() {
	federationSDK.eventEmitterService.on('homeserver.matrix.message', async ({ event, event_id: eventId }) => {
		try {
			const { msgtype, body } = event.content;
			const messageBody = body.toString();

			if (!messageBody && !msgtype) {
				logger.debug('No message content found in event');
				return;
			}

			// at this point we know for sure the user already exists
			const user = await Users.findOneByUsername(event.sender);
			if (!user) {
				throw new Error(`User not found for sender: ${event.sender}`);
			}

			const room = await Rooms.findOne({ 'federation.mrid': event.room_id });
			if (!room) {
				throw new Error(`No mapped room found for room_id: ${event.room_id}`);
			}

			const serverName = federationSDK.getConfig('serverName');

			const relation = event.content['m.relates_to'];

			// SPEC: For example, an m.thread relationship type denotes that the event is part of a “thread” of messages and should be rendered as such.
			const hasRelation = relation && 'rel_type' in relation;

			const isThreadMessage = hasRelation && relation.rel_type === 'm.thread';

			const threadRootEventId = isThreadMessage && relation.event_id;

			// SPEC: Though rich replies form a relationship to another event, they do not use rel_type to create this relationship.
			// Instead, a subkey named m.in_reply_to is used to describe the reply’s relationship,
			const isRichReply = relation && !('rel_type' in relation) && 'm.in_reply_to' in relation;

			const quoteMessageEventId = isRichReply && relation['m.in_reply_to']?.event_id;

			const thread = threadRootEventId ? await getThreadMessageId(threadRootEventId) : undefined;

			const isEditedMessage = hasRelation && relation.rel_type === 'm.replace';
			if (isEditedMessage && relation.event_id && event.content['m.new_content']) {
				logger.debug('Received edited message from Matrix, updating existing message');
				const originalMessage = await Messages.findOneByFederationId(relation.event_id);
				if (!originalMessage) {
					logger.error({ event_id: relation.event_id, msg: 'Original message not found for edit' });
					return;
				}
				if (originalMessage.federation?.eventId !== relation.event_id) {
					return;
				}
				if (originalMessage.msg === event.content['m.new_content']?.body) {
					logger.debug('No changes in message content, skipping update');
					return;
				}

				if (quoteMessageEventId) {
					const messageToReplyToUrl = await MeteorService.getMessageURLToReplyTo(room.t as string, room._id, originalMessage._id);
					const formatted = await toInternalQuoteMessageFormat({
						messageToReplyToUrl,
						formattedMessage: event.content.formatted_body || '',
						rawMessage: messageBody,
						homeServerDomain: serverName,
						senderExternalId: event.sender,
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
					rawMessage: event.content['m.new_content'].body,
					formattedMessage: event.content.formatted_body || '',
					homeServerDomain: serverName,
					senderExternalId: event.sender,
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

			if (quoteMessageEventId) {
				const originalMessage = await Messages.findOneByFederationId(quoteMessageEventId);
				if (!originalMessage) {
					logger.error({ quoteMessageEventId, msg: 'Original message not found for quote' });
					return;
				}
				const messageToReplyToUrl = await MeteorService.getMessageURLToReplyTo(room.t as string, room._id, originalMessage._id);
				const formatted = await toInternalQuoteMessageFormat({
					messageToReplyToUrl,
					formattedMessage: event.content.formatted_body || '',
					rawMessage: messageBody,
					homeServerDomain: serverName,
					senderExternalId: event.sender,
				});
				await Message.saveMessageFromFederation({
					fromId: user._id,
					rid: room._id,
					msg: formatted,
					federation_event_id: eventId,
					thread,
				});
				return;
			}

			const isMediaMessage = Object.values(fileTypes).includes(msgtype as FileMessageType);
			if (isMediaMessage && 'url' in event.content) {
				const result = await handleMediaMessage(
					event.content.url,
					event.content.info,
					msgtype,
					messageBody,
					user,
					room,
					event.room_id,
					eventId,
					thread,
				);
				await Message.saveMessageFromFederation(result);
			} else {
				const formatted = toInternalMessageFormat({
					rawMessage: messageBody,
					formattedMessage: event.content.formatted_body || '',
					homeServerDomain: serverName,
					senderExternalId: event.sender,
				});

				await Message.saveMessageFromFederation({
					fromId: user._id,
					rid: room._id,
					msg: formatted,
					federation_event_id: eventId,
					thread,
				});
			}
		} catch (error) {
			logger.error(error, 'Error processing Matrix message:');
		}
	});

	federationSDK.eventEmitterService.on('homeserver.matrix.encrypted', async ({ event, event_id: eventId }) => {
		try {
			if (!event.content.ciphertext) {
				logger.debug('No message content found in event');
				return;
			}

			// at this point we know for sure the user already exists
			const user = await Users.findOneByUsername(event.sender);
			if (!user) {
				throw new Error(`User not found for sender: ${event.sender}`);
			}

			const room = await Rooms.findOne({ 'federation.mrid': event.room_id });
			if (!room) {
				throw new Error(`No mapped room found for room_id: ${event.room_id}`);
			}

			const relation = event.content['m.relates_to'];

			// SPEC: For example, an m.thread relationship type denotes that the event is part of a “thread” of messages and should be rendered as such.
			const hasRelation = relation && 'rel_type' in relation;

			const isThreadMessage = hasRelation && relation.rel_type === 'm.thread';

			const threadRootEventId = isThreadMessage && relation.event_id;

			// SPEC: Though rich replies form a relationship to another event, they do not use rel_type to create this relationship.
			// Instead, a subkey named m.in_reply_to is used to describe the reply’s relationship,
			const isRichReply = relation && !('rel_type' in relation) && 'm.in_reply_to' in relation;

			const quoteMessageEventId = isRichReply && relation['m.in_reply_to']?.event_id;

			const thread = threadRootEventId ? await getThreadMessageId(threadRootEventId) : undefined;

			const isEditedMessage = hasRelation && relation.rel_type === 'm.replace';
			if (isEditedMessage && relation.event_id) {
				logger.debug('Received edited message from Matrix, updating existing message');
				const originalMessage = await Messages.findOneByFederationId(relation.event_id);
				if (!originalMessage) {
					logger.error({ event_id: relation.event_id, msg: 'Original message not found for edit' });
					return;
				}
				if (originalMessage.federation?.eventId !== relation.event_id) {
					return;
				}
				if (originalMessage.content?.ciphertext === event.content.ciphertext) {
					logger.debug('No changes in message content, skipping update');
					return;
				}

				if (quoteMessageEventId) {
					await Message.updateMessage(
						{
							...originalMessage,
							content: {
								algorithm: event.content.algorithm,
								ciphertext: event.content.ciphertext,
							},
						},
						user,
						originalMessage,
					);
					return;
				}

				await Message.updateMessage(
					{
						...originalMessage,
						content: {
							algorithm: event.content.algorithm,
							ciphertext: event.content.ciphertext,
						},
					},
					user,
					originalMessage,
				);
				return;
			}

			if (quoteMessageEventId) {
				const originalMessage = await Messages.findOneByFederationId(quoteMessageEventId);
				if (!originalMessage) {
					logger.error({ quoteMessageEventId, msg: 'Original message not found for quote' });
					return;
				}
				await Message.saveMessageFromFederation({
					fromId: user._id,
					rid: room._id,
					e2e_content: {
						algorithm: event.content.algorithm,
						ciphertext: event.content.ciphertext,
					},
					federation_event_id: eventId,
					thread,
				});
				return;
			}

			await Message.saveMessageFromFederation({
				fromId: user._id,
				rid: room._id,
				e2e_content: {
					algorithm: event.content.algorithm,
					ciphertext: event.content.ciphertext,
				},
				federation_event_id: eventId,
				thread,
			});
		} catch (error) {
			logger.error(error, 'Error processing Matrix message:');
		}
	});

	federationSDK.eventEmitterService.on('homeserver.matrix.redaction', async ({ event }) => {
		try {
			const redactedEventId = event.redacts;
			if (!redactedEventId) {
				logger.debug('No redacts field in redaction event');
				return;
			}

			const messageEvent = await FederationMatrix.getEventById(redactedEventId);
			if (!messageEvent || messageEvent.event.type !== 'm.room.message') {
				logger.debug(`Event ${redactedEventId} is not a message event`);
				return;
			}

			const rcMessage = await Messages.findOneByFederationId(event.redacts);
			if (!rcMessage) {
				logger.debug(`No RC message found for event ${event.redacts}`);
				return;
			}
			const internalUsername = event.sender;
			const user = await Users.findOneByUsername(internalUsername);
			if (!user) {
				logger.debug(`User not found: ${internalUsername}`);
				return;
			}

			await Message.deleteMessage(user, rcMessage);
		} catch (error) {
			logger.error(error, 'Failed to process Matrix removal redaction');
		}
	});
}
