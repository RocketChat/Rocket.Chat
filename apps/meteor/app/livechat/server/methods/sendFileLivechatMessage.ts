import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from '@rocket.chat/random';
import { LivechatVisitors, LivechatRooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { MessageAttachment, ImageAttachmentProps, AudioAttachmentProps, VideoAttachmentProps } from '@rocket.chat/core-typings';

import { FileUpload } from '../../../file-upload/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendFileLivechatMessage(
			roomId: string,
			visitorToken: string,
			file: {
				_id: string;
				name: string;
				type: string;
				size: number;
				description: string;
				identify: { size: { width: number; height: number } };
			},
			msgData?: { avatar?: string; emoji?: string; alias?: string; groupable?: boolean; msg?: string },
		): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async sendFileLivechatMessage(roomId, visitorToken, file, msgData = {}) {
		const visitor = await LivechatVisitors.getVisitorByToken(visitorToken);

		if (!visitor) {
			return false;
		}

		const room = await LivechatRooms.findOneOpenByRoomIdAndVisitorToken(roomId, visitorToken);

		if (!room) {
			return false;
		}

		check(msgData, {
			avatar: Match.Optional(String),
			emoji: Match.Optional(String),
			alias: Match.Optional(String),
			groupable: Match.Optional(Boolean),
			msg: Match.Optional(String),
		});

		const fileUrl = FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`);

		const attachment: MessageAttachment = {
			title: file.name,
			type: 'file',
			description: file.description,
			title_link: fileUrl,
			title_link_download: true,
		};

		if (/^image\/.+/.test(file.type)) {
			(attachment as ImageAttachmentProps).image_url = fileUrl;
			(attachment as ImageAttachmentProps).image_type = file.type;
			(attachment as ImageAttachmentProps).image_size = file.size;
			if (file.identify?.size) {
				(attachment as ImageAttachmentProps).image_dimensions = file.identify.size;
			}
			(attachment as ImageAttachmentProps).image_preview = await FileUpload.resizeImagePreview(file);
		} else if (/^audio\/.+/.test(file.type)) {
			(attachment as AudioAttachmentProps).audio_url = fileUrl;
			(attachment as AudioAttachmentProps).audio_type = file.type;
			(attachment as AudioAttachmentProps).audio_size = file.size;
		} else if (/^video\/.+/.test(file.type)) {
			(attachment as VideoAttachmentProps).video_url = fileUrl;
			(attachment as VideoAttachmentProps).video_type = file.type;
			(attachment as VideoAttachmentProps).video_size = file.size;
		}

		const msg = Object.assign(
			{
				_id: Random.id(),
				rid: roomId,
				ts: new Date(),
				msg: '',
				file: {
					_id: file._id,
					name: file.name,
					type: file.type,
				},
				files: [
					{
						_id: file._id,
						name: file.name,
						type: file.type,
					},
				],
				groupable: false,
				attachments: [attachment],
				token: visitorToken,
			},
			msgData,
		);

		return Meteor.callAsync('sendMessageLivechat', msg);
	},
});
