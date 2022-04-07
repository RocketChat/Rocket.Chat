import { Users } from '../../../models';

export function userLoggedOut(userId) {
	if (!userId) {
		return false;
	}

	const user = Users.findOneById(userId);

	if (user && user.services && user.services.cloud) {
		Users.update(user._id, {
			$unset: {
				'services.cloud': 1,
			},
		});
	}

	return true;
}
