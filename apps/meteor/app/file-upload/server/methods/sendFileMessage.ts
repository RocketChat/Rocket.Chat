import type {
	MessageAttachment,
	FileAttachmentProps,
	IUser,
	IUpload,
	AtLeast,
	FilesAndAttachments,
	IMessage,
	FileProp,
} from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Uploads, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { getFileExtension } from '../../../../lib/utils/getFileExtension';
import { omit } from '../../../../lib/utils/omit';
import { callbacks } from '../../../../server/lib/callbacks';
import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import { FileUpload } from '../lib/FileUpload';

type MinimalUploadData = AtLeast<IUpload, '_id' | 'name' | 'type' | 'size'>;

function validateFilesRequiredFields(files: Partial<IUpload>[]): asserts files is MinimalUploadData[] {
	const requiredFields = ['_id', 'name', 'type', 'size'];
	for (const file of files) {
		const fields = Object.keys(file);

		for (const field of requiredFields) {
			if (!fields.includes(field)) {
				throw new Meteor.Error('error-invalid-file', 'Invalid file');
			}
		}
	}
}

const logger = new Logger('sendFileMessage');

export const parseMultipleFilesIntoMessageAttachments = async (
	filesToConfirm: Partial<IUpload>[],
	roomId: string,
	user: IUser,
): Promise<FilesAndAttachments> => {
	// Validate every file before we process any of them
	validateFilesRequiredFields(filesToConfirm);

	const attachments: MessageAttachment[] = [];
	const files: FileProp[] = [];

	// Process one file at a time, to avoid loading too many images into memory at the same time, or sending too many simultaneous requests to external services
	for await (const file of filesToConfirm) {
		await Uploads.updateFileComplete(file._id, user._id, omit(file, '_id'));
		const fileUrl = FileUpload.getPath(`${file._id}/${encodeURI(file.name || '')}`);

		files.push({
			_id: file._id,
			name: file.name || '',
			type: file.type || 'file',
			size: file.size || 0,
			format: file.identify?.format || '',
			typeGroup: file.typeGroup,
		});

		const { attachment, thumbnail } = await createFileAttachment(file, { fileUrl, roomId, uid: user._id });
		if (thumbnail) {
			files.push(thumbnail);
		}
		attachments.push(attachment);
	}

	return { files, attachments };
};

async function createFileAttachment(
	file: MinimalUploadData,
	extraData: { fileUrl: string; roomId: string; uid: string },
): Promise<{ attachment: FileAttachmentProps; thumbnail?: FileProp }> {
	const { fileUrl, roomId, uid } = extraData;

	if (file.type) {
		if (/^image\/.+/.test(file.type)) {
			const attachment: FileAttachmentProps = {
				title: file.name,
				type: 'file',
				description: file?.description,
				title_link: fileUrl,
				title_link_download: true,
				image_url: fileUrl,
				image_type: file.type,
				image_size: file.size,
				fileId: file._id,
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
						uid,
					);
					const thumbUrl = FileUpload.getPath(`${thumbnail._id}/${encodeURI(file.name || '')}`);
					attachment.image_url = thumbUrl;
					attachment.image_type = thumbnail.type;
					attachment.image_dimensions = {
						width,
						height,
					};
					return {
						attachment,
						thumbnail: {
							_id: thumbnail._id,
							name: thumbnail.name || '',
							type: thumbnail.type || 'file',
							size: thumbnail.size || 0,
							format: thumbnail.identify?.format || '',
							typeGroup: thumbnail.typeGroup || '',
						},
					};
				}
			} catch (err) {
				logger.error({ err });
			}

			return { attachment };
		}

		if (/^audio\/.+/.test(file.type)) {
			return {
				attachment: {
					title: file.name,
					type: 'file',
					description: file.description,
					title_link: fileUrl,
					title_link_download: true,
					audio_url: fileUrl,
					audio_type: file.type,
					audio_size: file.size,
					fileId: file._id,
				},
			};
		}

		if (/^video\/.+/.test(file.type)) {
			return {
				attachment: {
					title: file.name,
					type: 'file',
					description: file.description,
					title_link: fileUrl,
					title_link_download: true,
					video_url: fileUrl,
					video_type: file.type,
					video_size: file.size as number,
					fileId: file._id,
				},
			};
		}
	}

	return {
		attachment: {
			title: file.name,
			type: 'file',
			format: getFileExtension(file.name),
			description: file.description,
			title_link: fileUrl,
			title_link_download: true,
			size: file.size as number,
			fileId: file._id,
		},
	};
}

export const parseFileIntoMessageAttachments = async (
	file: Partial<IUpload>,
	roomId: string,
	user: IUser,
): Promise<FilesAndAttachments> => {
	return parseMultipleFilesIntoMessageAttachments([file], roomId, user);
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
	const user = await Users.findOneById(userId, { projection: { services: 0 } });

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'sendFileMessage',
		});
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
			});
		}

		return sendFileMessage(userId, { roomId, file, msgData });
	},
});
