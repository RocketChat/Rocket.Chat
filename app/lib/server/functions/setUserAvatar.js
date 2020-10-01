import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { RocketChatFile } from '../../../file';
import { FileUpload } from '../../../file-upload';
import { Users } from '../../../models';
import { api } from '../../../../server/sdk/api';

export const setUserAvatar = function(user, dataURI, contentType, service) {
	let encoding;
	let image;

	if (service === 'initials') {
		return Users.setAvatarData(user._id, service, null);
	} if (service === 'url') {
		let result = null;

		try {
			result = HTTP.get(dataURI, { npmRequestOptions: { encoding: 'binary', rejectUnauthorized: false } });
			if (!result) {
				console.log(`Not a valid response, from the avatar url: ${ dataURI }`);
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'setUserAvatar', url: dataURI });
			}
		} catch (error) {
			if (!error.response || error.response.statusCode !== 404) {
				console.log(`Error while handling the setting of the avatar from a url (${ dataURI }) for ${ user.username }:`, error);
				throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${ dataURI }) for ${ user.username }`, { function: 'RocketChat.setUserAvatar', url: dataURI, username: user.username });
			}
		}

		if (result.statusCode !== 200) {
			console.log(`Not a valid response, ${ result.statusCode }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'setUserAvatar', url: dataURI });
		}

		if (!/image\/.+/.test(result.headers['content-type'])) {
			console.log(`Not a valid content-type from the provided url, ${ result.headers['content-type'] }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'setUserAvatar', url: dataURI });
		}

		encoding = 'binary';
		image = result.content;
		contentType = result.headers['content-type'];
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
	const fileStore = FileUpload.getStore('Avatars');
	fileStore.deleteByName(user.username);

	const file = {
		userId: user._id,
		type: contentType,
		size: buffer.length,
	};

	fileStore.insert(file, buffer, (err, result) => {
		Meteor.setTimeout(function() {
			Users.setAvatarData(user._id, service, result.etag);
			api.broadcast('user.avatarUpdate', { username: user.username, avatarETag: result.etag });
		}, 500);
	});
};
