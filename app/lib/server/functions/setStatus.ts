import { UserStatus } from '../../../../definition/UserStatus';
import { api } from '../../../../server/sdk/api';
import { Users as UsersRaw } from '../../../models/server/raw';

export const setUserStatus = async function (userId: string, status: UserStatus, statusText = ''): Promise<boolean> {
	if (!userId) {
		return false;
	}

	const user = await UsersRaw.findOneById(userId);

	if (!user) {
		return false;
	}

	await UsersRaw.updateStatusByAppId(user._id, status);

	const { _id, username } = user;
	api.broadcast('presence.status', {
		user: { _id, username, status, statusText },
	});

	return true;
};
