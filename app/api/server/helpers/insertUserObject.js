import { Users } from '../../../models';
import { API } from '../api';

API.helperMethods.set('insertUserObject', function _addUserToObject({ object, userId }) {
	const user = Users.findOneById(userId);
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

