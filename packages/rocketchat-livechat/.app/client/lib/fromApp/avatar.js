import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

this.getAvatarUrlFromUsername = (username) => {
	const key = `avatar_random_${ username }`;
	let _dc = Session.get(key);
	if (!_dc) {
		const now = Date.now();
		Session.set(key, now);
		_dc = now;
	}
	if (!username) {
		return;
	}

	return `${ Meteor.absoluteUrl() }avatar/${ username }.jpg?_dc=${ _dc }`;
};

this.updateAvatarOfUsername = (username) => {
	const key = `avatar_random_${ username }`;
	Session.set(key, Date.now());

	Object.keys(RoomManager.openedRooms).forEach((key) => {
		const room = RoomManager.openedRooms[key];
		const url = getAvatarUrlFromUsername(username);
		$(room.dom).find(`.message[data-username='${ username }'] .avatar-image`).attr('src', url);
	});
	return true;
};
