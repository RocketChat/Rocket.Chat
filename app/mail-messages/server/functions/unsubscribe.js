import { Users } from '/app/models';

export const unsubscribe = function(_id, createdAt) {
	if (_id && createdAt) {
		return Users.rocketMailUnsubscribe(_id, createdAt) === 1;
	}
	return false;
};
