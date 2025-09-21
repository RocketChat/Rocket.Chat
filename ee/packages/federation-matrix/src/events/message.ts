import type { FileMessageType, MessageType, FileMessageContent } from '@hs/core';
import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import type { EventID } from '@hs/room';
import { FederationMatrix, Message, MeteorService } from '@rocket.chat/core-services';
import type { IUser, IRoom, FileAttachmentProps } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
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
	eventId: EventID,
	tmid?: string,
): Promise<{
	fromId: string;
	rid: string;
	msg: string;
	federation_event_id: string;
	tmid?: string;
}> {
	const mimeType = fileInfo?.mimetype;
	const fileName = messageBody;

	const fileRefId = await MatrixMediaService.downloadAndStoreRemoteFile(url, {
		name: messageBody,
		size: fileInfo?.size,
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
		tmid,
	};
}

export function message(emitter: Emitter<HomeserverEventSignatures>, serverName: string) {
	emitter.on('homeserver.matrix.message', async (data) => {
		try {
			const { content } = data;
			const msgtype = content?.msgtype;
			const messageBody = content?.body?.toString();

			if (!messageBody && !msgtype) {
				logger.debug('No message content found in event');
				return;
			}

			// at this point we know for sure the user already exists
			const user = await Users.findOne({ 'federation.mui': data.sender });
			if (!user) {
				throw new Error(`User not found for sender: ${data.sender}`);
			}

			const room = await Rooms.findOne({ 'federation.mrid': data.room_id });
			if (!room) {
				throw new Error(`No mapped room found for room_id: ${data.room_id}`);
			}

			const relation = content['m.relates_to'];

			const isThreadMessage = relation && relation.rel_type === 'm.thread';
			const threadRootEventId = isThreadMessage && relation.event_id;

			const quoteMessageEventId = relation && 'm.in_reply_to' in relation && relation['m.in_reply_to']?.event_id;

			const thread = threadRootEventId ? await getThreadMessageId(threadRootEventId) : undefined;

			const isEditedMessage = relation?.rel_type === 'm.replace';
			if (isEditedMessage && relation?.event_id && data.content['m.new_content']) {
				logger.debug('Received edited message from Matrix, updating existing message');
				const originalMessage = await Messages.findOneByFederationId(relation.event_id);
				if (!originalMessage) {
					logger.error('Original message not found for edit:', relation.event_id);
					return;
				}
				if (originalMessage.federation?.eventId !== relation.event_id) {
					return;
				}
				if (originalMessage.msg === data.content['m.new_content']?.body) {
					logger.debug('No changes in message content, skipping update');
					return;
				}

				if (quoteMessageEventId && room.name) {
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

			if (quoteMessageEventId && room.name) {
				const originalMessage = await Messages.findOneByFederationId(quoteMessageEventId);
				if (!originalMessage) {
					logger.error('Original message not found for quote:', quoteMessageEventId);
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
					thread,
				});
				return;
			}

			const isMediaMessage = Object.values(fileTypes).includes(msgtype as FileMessageType);
			if (isMediaMessage && content.url) {
				const result = await handleMediaMessage(content.url, content.info, msgtype, messageBody, user, room, data.event_id, thread?.tmid);
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
					thread,
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
