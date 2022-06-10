import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';

import { LivechatRooms, LivechatVisitors } from '../../../models';
import { FileUpload } from '../../../file-upload/server';

Meteor.methods({
	async sendFileLivechatMessage(roomId, visitorToken, file, msgData = {}) {
		const visitor = LivechatVisitors.getVisitorByToken(visitorToken);

		if (!visitor) {
			return false;
		}

		const room = LivechatRooms.findOneOpenByRoomIdAndVisitorToken(roomId, visitorToken);

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

		const attachment = {
			title: file.name,
			type: 'file',
			description: file.description,
			title_link: fileUrl,
			title_link_download: true,
		};

		if (/^image\/.+/.test(file.type)) {
			attachment.image_url = fileUrl;
			attachment.image_type = file.type;
			attachment.image_size = file.size;
			if (file.identify && file.identify.size) {
				attachment.image_dimensions = file.identify.size;
			}
			attachment.image_preview = await FileUpload.resizeImagePreview(file);
		} else if (/^audio\/.+/.test(file.type)) {
			attachment.audio_url = fileUrl;
			attachment.audio_type = file.type;
			attachment.audio_size = file.size;
		} else if (/^video\/.+/.test(file.type)) {
			attachment.video_url = fileUrl;
			attachment.video_type = file.type;
			attachment.video_size = file.size;
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
				groupable: false,
				attachments: [attachment],
				token: visitorToken,
			},
			msgData,
		);

		return Meteor.call('sendMessageLivechat', msg);
	},
});
