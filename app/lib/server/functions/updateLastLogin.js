import { Users } from '../../../models/server';

export const updateLastLogin = function(userId) {
	if (!userId) {
		return undefined;
	}

	return Users.updateLastLoginById(userId);
};
