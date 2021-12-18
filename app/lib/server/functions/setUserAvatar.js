import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { RocketChatFile } from '../../../file/server';
import { FileUpload } from '../../../file-upload/server';
import { Users } from '../../../models/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { api } from '../../../../server/sdk/api';

export const setUserAvatar = function(user, dataURI, contentType, service, etag = null) {
	let encoding;
	let image;

	if (service === 'initials') {
		return Users.setAvatarData(user._id, service, null);
	} if (service === 'url') {
		let result = null;

		try {
			result = HTTP.get(dataURI, { npmRequestOptions: { encoding: 'binary', rejectUnauthorized: false } });
			if (!result) {
				SystemLogger.info(`Not a valid response, from the avatar url: ${ encodeURI(dataURI) }`);
				throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ encodeURI(dataURI) }`, { function: 'setUserAvatar', url: dataURI });
			}
		} catch (error) {
			if (!error.response || error.response.statusCode !== 404) {
				SystemLogger.info(`Error while handling the setting of the avatar from a url (${ encodeURI(dataURI) }) for ${ user.username }:`, error);
				throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${ encodeURI(dataURI) }) for ${ user.username }`, { function: 'RocketChat.setUserAvatar', url: dataURI, username: user.username });
			}
		}

		if (result.statusCode !== 200) {
			SystemLogger.info(`Not a valid response, ${ result.statusCode }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'setUserAvatar', url: dataURI });
		}

		if (!/image\/.+/.test(result.headers['content-type'])) {
			SystemLogger.info(`Not a valid content-type from the provided url, ${ result.headers['content-type'] }, from the avatar url: ${ dataURI }`);
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

	const buffer = Buffer.from(image, encoding);
	const fileStore = FileUpload.getStore('Avatars');
	fileStore.deleteByName(user.username);

	const file = {
		userId: user._id,
		type: contentType,
		size: buffer.length,
	};

	fileStore.insert(file, buffer, (err, result) => {
		Meteor.setTimeout(function() {
			Users.setAvatarData(user._id, service, etag || result.etag);
			api.broadcast('user.avatarUpdate', { username: user.username, avatarETag: etag || result.etag });
		}, 500);
	});
};
