import type {
	MessageAttachment,
	ImageAttachmentProps,
	AudioAttachmentProps,
	VideoAttachmentProps,
	IUpload,
} from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatRooms } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { FileUpload } from '../../../file-upload/server';
import { sendMessageLivechat } from './sendMessageLivechat';

interface ISendFileLivechatMessage {
	roomId: string;
	visitorToken: string;
	file: IUpload;
	msgData?: { avatar?: string; emoji?: string; alias?: string; groupable?: boolean; msg?: string };
}

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendFileLivechatMessage(
			roomId: string,
			visitorToken: string,
			file: IUpload,
			msgData?: { avatar?: string; emoji?: string; alias?: string; groupable?: boolean; msg?: string },
		): boolean;
	}
}

export const sendFileLivechatMessage = async ({ roomId, visitorToken, file, msgData = {} }: ISendFileLivechatMessage): Promise<boolean> => {
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

	const fileUrl = file.name && FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`);

	const attachment: MessageAttachment = {
		title: file.name,
		type: 'file',
		description: file.description,
		title_link: fileUrl,
		title_link_download: true,
	};

	if (file.type && /^image\/.+/.test(file.type)) {
		(attachment as ImageAttachmentProps).image_url = fileUrl || '';
		(attachment as ImageAttachmentProps).image_type = file.type;
		(attachment as ImageAttachmentProps).image_size = file.size;
		if (file.identify?.size) {
			(attachment as ImageAttachmentProps).image_dimensions = file.identify.size;
		}
		(attachment as ImageAttachmentProps).image_preview = await FileUpload.resizeImagePreview(file);
	} else if (file.type && /^audio\/.+/.test(file.type)) {
		(attachment as AudioAttachmentProps).audio_url = fileUrl || '';
		(attachment as AudioAttachmentProps).audio_type = file.type;
		(attachment as AudioAttachmentProps).audio_size = file.size;
	} else if (file.type && /^video\/.+/.test(file.type)) {
		(attachment as VideoAttachmentProps).video_url = fileUrl || '';
		(attachment as VideoAttachmentProps).video_type = file.type;
		(attachment as VideoAttachmentProps).video_size = file.size || 0;
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

	return sendMessageLivechat({ message: msg });
};

Meteor.methods<ServerMethods>({
	async sendFileLivechatMessage(roomId, visitorToken, file, msgData = {}) {
		return sendFileLivechatMessage({ roomId, visitorToken, file, msgData });
	},
});
