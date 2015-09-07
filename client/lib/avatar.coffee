@getAvatarUrlFromUsername = (username) ->
	key = "avatar_random_#{username}"
	random = Session.keys[key] or 0
	if not username?
		return

	return "#{Meteor.absoluteUrl()}avatar/#{username}.jpg?_dc=#{random}"

Blaze.registerHelper 'avatarUrlFromUsername', getAvatarUrlFromUsername

@getAvatarAsPng = (username) ->
	image = new Image
	image.src = getAvatarUrlFromUsername(username)
	canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	context = canvas.getContext('2d');
	context.drawImage(image, 0, 0);
	return canvas.toDataURL('image/png');

@updateAvatarOfUsername = (username) ->
	key = "avatar_random_#{username}"
	Session.set key, Math.round(Math.random() * 1000)

	for key, room of RoomManager.openedRooms
		url = getAvatarUrlFromUsername username

		$(room.dom).find(".message[data-username='#{username}'] .avatar-image").css('background-image', "url(#{url})");

	return true
