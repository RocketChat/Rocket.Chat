RocketChat.API.helperMethods.set('insertUserObject', function _addUserToObject({ object, userId }) {
	const { username, name } = RocketChat.models.Users.findOneById(userId);

	object.user = {
		_id: userId,
		username,
		name
	};

	return object;
});

