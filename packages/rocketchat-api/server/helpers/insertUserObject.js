import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.API.helperMethods.set('insertUserObject', function _addUserToObject({ object, userId }) {
	const user = RocketChat.models.Users.findOneById(userId);
	object.user = { };
	if (user) {
		object.user = {
			_id: userId,
			username: user.username,
			name: user.name,
		};
	}


	return object;
});

