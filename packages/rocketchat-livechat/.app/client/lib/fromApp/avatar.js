this.getAvatarUrlFromUsername = username => {
	const key = `avatar_random_${ username }`;
	const random = Session.keys[key] || 0;
	if (!username) {
		return;
	}

	return `${ Meteor.absoluteUrl() }avatar/${ username }.jpg?_dc=${ random }`;
};

this.updateAvatarOfUsername = username => {
	const key = `avatar_random_${ username }`;
	Session.set(key, Math.round(Math.random() * 1000));

	Object.keys(RoomManager.openedRooms).forEach((key) => {
		const room = RoomManager.openedRooms[key];
		const url = getAvatarUrlFromUsername(username);
		$(room.dom).find(`.message[data-username='${ username }'] .avatar-image`).css('background-image', `url(${ url })`);
	});
	return true;
};
