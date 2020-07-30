import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { RocketChatFile } from '../../../file';
import { FileUpload } from '../../../file-upload';
import { Notifications } from '../../../notifications';
import Rooms from '../../../models/server/models/Rooms';

export const setRoomAvatar = function(rid, dataURI, contentType, service) {
	const fileStore = FileUpload.getStore('Avatars');
	fileStore.deleteByName(rid);

	let encoding;
	let image;

	if (service === 'initials' || !dataURI) {
		return Rooms.unsetAvatarData(rid);
	}

	if (service === 'url') {
		try {
			const result = HTTP.get(dataURI, { npmRequestOptions: { encoding: 'binary', rejectUnauthorized: false } });
			if (!result) {
				console.log(`Not a valid response, from the avatar url: ${ dataURI }`);
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'setRoomAvatar', url: dataURI });
			}
			if (result.statusCode !== 200) {
				console.log(`Not a valid response, ${ result.statusCode }, from the avatar url: ${ dataURI }`);
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'setRoomAvatar', url: dataURI });
			}

			if (!/image\/.+/.test(result.headers['content-type'])) {
				console.log(`Not a valid content-type from the provided url, ${ result.headers['content-type'] }, from the avatar url: ${ dataURI }`);
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'setRoomAvatar', url: dataURI });
			}

			encoding = 'binary';
			image = result.content;
			contentType = result.headers['content-type'];
		} catch (error) {
			if (!error.response || error.response.statusCode !== 404) {
				console.log(`Error while handling the setting of the avatar from a url (${ dataURI }) for ${ rid }:`, error);
				throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${ dataURI }) for ${ rid }`, { function: 'RocketChat.setRoomAvatar', url: dataURI, rid });
			}
		}
	} else if (service === 'rest') {
		encoding = 'binary';
		image = dataURI;
	} else {
		const fileData = RocketChatFile.dataURIParse(dataURI);
		encoding = 'base64';
		image = fileData.image;
		contentType = fileData.contentType;
	}

	const buffer = new Buffer(image, encoding);

	const file = {
		rid,
		type: contentType,
		size: buffer.length,
	};

	fileStore.insert(file, buffer, (err, result) => {
		Meteor.setTimeout(function() {
			Rooms.setAvatarData(rid, service, result.etag);
			Notifications.notifyLogged('updateAvatar', { rid, etag: result.etag });
		}, 500);
	});
};
