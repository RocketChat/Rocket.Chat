import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { RoomManager } from './RoomManager';

Blaze.registerHelper('avatarUrlFromUsername', getUserAvatarURL);

export const getAvatarAsPng = function(username, cb) {
	const image = new Image;
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
	return image.onerror = function() {
		return cb('');
	};
};

export const updateAvatarOfUsername = function(username) {
	Session.set(`avatar_random_${ username }`, Math.round(Math.random() * 1000));
	const url = getUserAvatarURL(username);

	// force reload of avatars of messages
	$(Object.values(RoomManager.openedRooms).map((room) => room.dom))
		.find(`.message[data-username='${ username }'] .avatar-image`).attr('src', url);

	// force reload of avatar on sidenav
	$(`.sidebar-item__link[aria-label='${ username }'] .avatar-image`).attr('src', url);

	return true;
};
