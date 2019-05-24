import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';

import { RoomManager } from './RoomManager';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { getRoomAvatarURL } from '../../../utils/lib/getRoomAvatarURL';
import { Subscriptions } from '../../../models';

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

export const updateAvatarOfUsername = function(username) {
	Session.set(`avatar_random_${ username }`, Date.now());
	const url = getUserAvatarURL(username);

	// force reload of avatars of messages
	$(Object.values(RoomManager.openedRooms).map((room) => room.dom))
		.find(`.message[data-username='${ username }'] .avatar-image`).attr('src', url);

	// force reload of avatar on sidenav
	$(`.sidebar-item.js-sidebar-type-d .sidebar-item__link[aria-label='${ username }'] .avatar-image`)
		.attr('src', url);

	return true;
};

export const updateAvatarOfRoom = function(roomId) {
	Session.set(`room_avatar_random_${ roomId }`, Date.now());
	const url = getRoomAvatarURL(roomId);

	// Discussions have the same avatar as the parent room
	const subs = Subscriptions.find({ $or: [{ rid: roomId }, { prid: roomId }] }).fetch();
	const selector = subs.map((sub) => `.sidebar-item[data-id='${ sub._id }'] .avatar-image`).join(',');

	$(selector).attr('src', url);

	return true;
};
