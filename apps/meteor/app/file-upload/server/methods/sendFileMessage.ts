import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { MessageAttachment, FileAttachmentProps, IUser, IUpload, AtLeast } from '@rocket.chat/core-typings';
import { Rooms, Uploads } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../lib/FileUpload';
import { canAccessRoom } from '../../../authorization/server/functions/canAccessRoom';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { omit } from '../../../../lib/utils/omit';

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
): Promise<Record<string, any>> => {
	validateFileRequiredFields(file);

	await Uploads.updateFileComplete(file._id, user._id, omit(file, '_id'));

	const fileUrl = FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`);

	const attachments: MessageAttachment[] = [];

	const files = [
		{
			_id: file._id,
			name: file.name,
			type: file.type,
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
				const { data: thumbBuffer, width, height } = thumbResult;
				const thumbnail = FileUpload.uploadImageThumbnail(file, thumbBuffer, roomId, user._id);
				const thumbUrl = FileUpload.getPath(`${thumbnail._id}/${encodeURI(file.name)}`);
				attachment.image_url = thumbUrl;
				attachment.image_type = thumbnail.type;
				attachment.image_dimensions = {
					width,
					height,
				};
				files.push({
					_id: thumbnail._id,
					name: file.name,
					type: thumbnail.type,
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
			description: file.description,
			title_link: fileUrl,
			title_link_download: true,
		};
		attachments.push(attachment);
	}
	return { files, attachments };
};

Meteor.methods({
	async sendFileMessage(roomId, _store, file, msgData = {}) {
		const user = Meteor.user() as IUser | undefined;
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendFileMessage',
			} as any);
		}

		const room = await Rooms.findOneById(roomId);
		if (!room) {
			return false;
		}

		if (user?.type !== 'app' && !canAccessRoom(room, user)) {
			return false;
		}

		check(msgData, {
			avatar: Match.Optional(String),
			emoji: Match.Optional(String),
			alias: Match.Optional(String),
			groupable: Match.Optional(Boolean),
			msg: Match.Optional(String),
			tmid: Match.Optional(String),
		});

		const { files, attachments } = await parseFileIntoMessageAttachments(file, roomId, user);

		const msg = Meteor.call('sendMessage', {
			rid: roomId,
			ts: new Date(),
			file: files[0],
			files,
			attachments,
			...msgData,
			msg: msgData.msg ?? '',
			groupable: msgData.groupable ?? false,
		});

		callbacks.runAsync('afterFileUpload', { user, room, message: msg });

		return msg;
	},
});
