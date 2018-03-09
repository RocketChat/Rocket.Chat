Blaze.registerHelper('avatarUrlFromUsername', getAvatarUrlFromUsername);

this.getAvatarAsPng = function(username, cb) {
	const image = new Image;
	image.src = getAvatarUrlFromUsername(username);
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

this.updateAvatarOfUsername = function(username) {

	const key = `avatar_random_${ username }`;
	Session.set(key, Math.round(Math.random() * 1000));

	Object.keys(RoomManager.openedRooms).forEach((key) => {
		const room = RoomManager.openedRooms[key];
		const url = getAvatarUrlFromUsername(username);
		$(room.dom).find(`.message[data-username='${ username }'] .avatar-image`).css('background-image', `url(${ url })`);
	});
	return true;
};
