RocketChat.setUserAvatar = function(user, dataURI, contentType, service) {
	let encoding;
	let image;

	if (service === 'initials') {
		return RocketChat.models.Users.setAvatarOrigin(user._id, service);
	} else if (service === 'url') {
		let result = null;

		try {
			result = HTTP.get(dataURI, { npmRequestOptions: {encoding: 'binary'} });
		} catch (error) {
			if (error.response.statusCode !== 404) {
				console.log(`Error while handling the setting of the avatar from a url (${ dataURI }) for ${ user.username }:`, error);
				throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${ dataURI }) for ${ user.username }`, { function: 'RocketChat.setUserAvatar', url: dataURI, username: user.username });
			}
		}

		if (result.statusCode !== 200) {
			console.log(`Not a valid response, ${ result.statusCode }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'RocketChat.setUserAvatar', url: dataURI });
		}

		if (!/image\/.+/.test(result.headers['content-type'])) {
			console.log(`Not a valid content-type from the provided url, ${ result.headers['content-type'] }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'RocketChat.setUserAvatar', url: dataURI });
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

	const rs = RocketChatFile.bufferToStream(new Buffer(image, encoding));
	RocketChatFileAvatarInstance.deleteFile(encodeURIComponent(`${ user.username }.jpg`));
	const ws = RocketChatFileAvatarInstance.createWriteStream(encodeURIComponent(`${ user.username }.jpg`), contentType);
	ws.on('end', Meteor.bindEnvironment(function() {
		Meteor.setTimeout(function() {
			RocketChat.models.Users.setAvatarOrigin(user._id, service);
			RocketChat.Notifications.notifyLogged('updateAvatar', {username: user.username});
		}, 500);
	}));
	rs.pipe(ws);
};
