import { Blaze } from 'meteor/blaze';

import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';

Blaze.registerHelper('avatarUrlFromUsername', getUserAvatarURL);

export const getAvatarAsPng = function(username, cb) {
	const image = new Image();
	image.src = getUserAvatarURL(username);
	image.onload = function() {
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext('2d');
		context.drawImage(image, 0, 0);
		try {
			return cb(canvas.toDataURL('image/png'));
		} catch (e) {
			return cb('');
		}
	};
	image.onerror = function() {
		return cb('');
	};
	return image.onerror;
};
