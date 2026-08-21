import type { IUser, IRoom, FileAttachmentProps } from '@rocket.chat/core-typings';
import { type MessageType, type FileMessageContent, type EventID } from '@rocket.chat/federation-sdk';

import { MatrixMediaService } from '../services/MatrixMediaService';

export async function handleMediaMessage(
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
		size: fileInfo?.size || 0,
		type: mimeType || 'application/octet-stream',
		rid: room._id,
		userId: user._id,
	});

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
