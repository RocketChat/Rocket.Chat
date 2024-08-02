import type {
	MessageAttachment,
	FileAttachmentProps,
	IUser,
	IUpload,
	AtLeast,
	FilesAndAttachments,
	IMessage,
} from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Uploads, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { getFileExtension } from '../../../../lib/utils/getFileExtension';
import { omit } from '../../../../lib/utils/omit';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import { FileUpload } from '../lib/FileUpload';

function validateFileRequiredFields(file: Partial<IUpload>): asserts file is AtLeast<IUpload, '_id' | 'name' | 'type' | 'size'> {
	const requiredFields = ['_id', 'name', 'type', 'size'];
	requiredFields.forEach((field) => {
		if (!Object.keys(file).includes(field)) {
			throw new Meteor.Error('error-invalid-file', 'Invalid file');
		}
	});
}

export const parseFileIntoMessageAttachments = async (
	file: Partial<IUpload>,
	roomId: string,
	user: IUser,
): Promise<FilesAndAttachments> => {
	validateFileRequiredFields(file);

	await Uploads.updateFileComplete(file._id, user._id, omit(file, '_id'));

	const fileUrl = FileUpload.getPath(`${file._id}/${encodeURI(file.name || '')}`);

	const attachments: MessageAttachment[] = [];

	const files = [
		{
			_id: file._id,
			name: file.name || '',
			type: file.type || 'file',
			size: file.size || 0,
			format: file.identify?.format || '',
		},
	];

	if (/^image\/.+/.test(file.type as string)) {
		const attachment: FileAttachmentProps = {
			title: file.name,
			type: 'file',
			description: file?.description,
			title_link: fileUrl,
			title_link_download: true,
			image_url: fileUrl,
			image_type: file.type as string,
			image_size: file.size,
		};

		if (file.identify?.size) {
			attachment.image_dimensions = file.identify.size;
		}

		try {
			attachment.image_preview = await FileUpload.resizeImagePreview(file);
			const thumbResult = await FileUpload.createImageThumbnail(file);
			if (thumbResult) {
				const { data: thumbBuffer, width, height, thumbFileType, thumbFileName, originalFileId } = thumbResult;
				const thumbnail = await FileUpload.uploadImageThumbnail(
					{
						thumbFileName,
						thumbFileType,
						originalFileId,
					},
					thumbBuffer,
					roomId,
					user._id,
				);
				const thumbUrl = FileUpload.getPath(`${thumbnail._id}/${encodeURI(file.name || '')}`);
				attachment.image_url = thumbUrl;
				attachment.image_type = thumbnail.type;
				attachment.image_dimensions = {
					width,
					height,
				};
				files.push({
					_id: thumbnail._id,
					name: thumbnail.name || '',
					type: thumbnail.type || 'file',
					size: thumbnail.size || 0,
					format: thumbnail.identify?.format || '',
				});
			}
		} catch (e) {
			SystemLogger.error(e);
		}
		attachments.push(attachment);
	} else if (/^audio\/.+/.test(file.type as string)) {
		const attachment: FileAttachmentProps = {
			title: file.name,
			type: 'file',
			description: file.description,
			title_link: fileUrl,
			title_link_download: true,
			audio_url: fileUrl,
			audio_type: file.type as string,
			audio_size: file.size,
		};
		attachments.push(attachment);
	} else if (/^video\/.+/.test(file.type as string)) {
		const attachment: FileAttachmentProps = {
			title: file.name,
			type: 'file',
			description: file.description,
			title_link: fileUrl,
			title_link_download: true,
			video_url: fileUrl,
			video_type: file.type as string,
			video_size: file.size as number,
		};
		attachments.push(attachment);
	} else {
		const attachment = {
			title: file.name,
			type: 'file',
			format: getFileExtension(file.name),
			description: file.description,
			title_link: fileUrl,
			title_link_download: true,
			size: file.size as number,
		};
		attachments.push(attachment);
	}
	return { files, attachments };
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendFileMessage: (roomId: string, _store: string, file: Partial<IUpload>, msgData?: Record<string, any>) => boolean;
	}
}

export const sendFileMessage = async (
	userId: string,
	{
		roomId,
		file,
		msgData,
	}: {
		roomId: string;
		file: Partial<IUpload>;
		msgData?: Record<string, any>;
	},
	{
		parseAttachmentsForE2EE,
	}: {
		parseAttachmentsForE2EE: boolean;
	} = {
		parseAttachmentsForE2EE: true,
	},
): Promise<boolean> => {
	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'sendFileMessage',
		} as any);
	}

	const room = await Rooms.findOneById(roomId);
	if (!room) {
		return false;
	}

	if (user?.type !== 'app' && !(await canAccessRoomAsync(room, user))) {
		return false;
	}

	check(
		msgData,
		Match.Maybe({
			avatar: Match.Optional(String),
			emoji: Match.Optional(String),
			alias: Match.Optional(String),
			groupable: Match.Optional(Boolean),
			msg: Match.Optional(String),
			tmid: Match.Optional(String),
			customFields: Match.Optional(String),
			t: Match.Optional(String),
			content: Match.Optional(
				Match.ObjectIncluding({
					algorithm: String,
					ciphertext: String,
				}),
			),
		}),
	);

	const data = {
		rid: roomId,
		ts: new Date(),
		...(msgData as Partial<IMessage>),
		...(msgData?.customFields && { customFields: JSON.parse(msgData.customFields) }),
		msg: msgData?.msg ?? '',
		groupable: msgData?.groupable ?? false,
	};

	if (parseAttachmentsForE2EE || msgData?.t !== 'e2e') {
		const { files, attachments } = await parseFileIntoMessageAttachments(file, roomId, user);
		data.file = files[0];
		data.files = files;
		data.attachments = attachments;
	}

	const msg = await executeSendMessage(userId, data);

	callbacks.runAsync('afterFileUpload', { user, room, message: msg });

	return msg;
};

Meteor.methods<ServerMethods>({
	async sendFileMessage(roomId, _store, file, msgData = {}) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendFileMessage',
			} as any);
		}

		return sendFileMessage(userId, { roomId, file, msgData });
	},
});
