import https from 'https';
import http from 'http';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Messages, Users, Rooms } from '../../models/server';
import { FileUpload } from '../../file-upload';
import { insertMessage } from '../../lib';

export const imageDownloader = async () => {
	const messages = Messages.findAllSlackImportedMessagesWithFilesToDownload();
	if (!messages) {
		return;
	}

	messages.forEach((message) => {
		const file = message.slackFile;
		if (!file || file.downloaded) {
			return;
		}

		const url = file.url_private_download;

		if (!url || !url.startsWith('http')) {
			return;
		}

		const details = {
			message_id: `${ message._id }-file-${ file.id || Random.id() }`,
			name: file.name || Random.id(),
			size: file.size || 0,
			userId: message.u._id,
			rid: message.rid,
		};

		const requestModule = /https/i.test(url) ? https : http;
		const fileStore = FileUpload.getStore('Uploads');

		return requestModule.get(url, Meteor.bindEnvironment(function(res) {
			const contentType = res.headers['content-type'];
			if (!details.type && contentType) {
				details.type = contentType;
			}

			const rawData = [];
			res.on('data', (chunk) => rawData.push(chunk));
			res.on('end', Meteor.bindEnvironment(() => {
				fileStore.insert(details, Buffer.concat(rawData), function(err, file) {
					if (err) {
						throw new Error(err);
					} else {
						const url = FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`);

						const attachment = {
							title: file.name,
							title_link: url,
						};

						if (/^image\/.+/.test(file.type)) {
							attachment.image_url = url;
							attachment.image_type = file.type;
							attachment.image_size = file.size;
							attachment.image_dimensions = file.identify != null ? file.identify.size : undefined;
						}

						if (/^audio\/.+/.test(file.type)) {
							attachment.audio_url = url;
							attachment.audio_type = file.type;
							attachment.audio_size = file.size;
						}

						if (/^video\/.+/.test(file.type)) {
							attachment.video_url = url;
							attachment.video_type = file.type;
							attachment.video_size = file.size;
						}

						if (!message.attachments) {
							message.attachments = [attachment];
						} else {
							message.attachments.push(attachment);
						}

						message.slackFile.downloaded = true;

						const user = Users.findOneById(message.u._id);
						const room = Rooms.findOneById(message.rid);

						insertMessage(user, message, room, true);
					}
				});
			}));
		}));
	});
};
