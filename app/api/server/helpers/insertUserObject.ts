import { Users } from '../../../models/server';
import { API } from '../api';

(API as any).helperMethods.set('insertUserObject', function _addUserToObject({ object, userId }: { object: { user: {} }; userId: string }) {
	const user = Users.findOneById(userId);
	object.user = {};
	if (user) {
		object.user = {
			_id: userId,
			username: user.username,
			name: user.name,
		};
	}

	return object;
});
