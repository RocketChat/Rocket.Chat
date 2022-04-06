/* eslint-disable @typescript-eslint/camelcase */
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import _ from 'underscore';
import { MessageAttachment, FileAttachmentProps } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

import { Rooms, Uploads } from '../../../models/server/raw';
import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../lib/FileUpload';
import { canAccessRoom } from '../../../authorization/server/functions/canAccessRoom';
import { SystemLogger } from '../../../../server/lib/logger/system';

Meteor.methods({
	async sendFileMessage(roomId, _store, file, msgData = {}) {
		const user = Meteor.user() as IUser | undefined;
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendFileMessage',
			} as any);
		}

		const room = await Rooms.findOneById(roomId);

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

		await Uploads.updateFileComplete(file._id, user._id, _.omit(file, '_id'));

		const fileUrl = FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`);

		const attachments: MessageAttachment[] = [];

		const files = [
			{
				_id: file._id,
				name: file.name,
				type: file.type,
			},
		];

		if (/^image\/.+/.test(file.type)) {
			const attachment: FileAttachmentProps = {
				title: file.name,
				type: 'file',
				description: file.description,
				title_link: fileUrl,
				title_link_download: true,
				image_url: fileUrl,
				image_type: file.type,
				image_size: file.size,
			};

			if (file.identify && file.identify.size) {
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
		} else if (/^audio\/.+/.test(file.type)) {
			const attachment: FileAttachmentProps = {
				title: file.name,
				type: 'file',
				description: file.description,
				title_link: fileUrl,
				title_link_download: true,
				audio_url: fileUrl,
				audio_type: file.type,
				audio_size: file.size,
			};
			attachments.push(attachment);
		} else if (/^video\/.+/.test(file.type)) {
			const attachment: FileAttachmentProps = {
				title: file.name,
				type: 'file',
				description: file.description,
				title_link: fileUrl,
				title_link_download: true,
				video_url: fileUrl,
				video_type: file.type,
				video_size: file.size,
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

		const msg = Meteor.call('sendMessage', {
			rid: roomId,
			ts: new Date(),
			msg: '',
			file: files[0],
			files,
			groupable: false,
			attachments,
			...msgData,
		});

		callbacks.runAsync('afterFileUpload', { user, room, message: msg });

		return msg;
	},
});
