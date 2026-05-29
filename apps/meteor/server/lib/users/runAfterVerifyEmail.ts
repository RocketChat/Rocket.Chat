import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { addUserRolesAsync } from '../roles/addUserRoles';
import { removeUserFromRolesAsync } from '../roles/removeUserFromRoles';

const rolesToChangeTo: Map<IRole['_id'], [IRole['_id']]> = new Map([['anonymous', ['user']]]);

export const runAfterVerifyEmail = async (userId: IUser['_id']): Promise<void> => {
	const user = await Users.findOneById(userId);
	if (!user?.emails || !Array.isArray(user.emails)) {
		return;
	}

	const verifiedEmail = user.emails.find((email) => email.verified);
	if (!verifiedEmail) {
		return;
	}

	const rolesThatNeedChanges = user.roles.filter((role) => rolesToChangeTo.has(role));

	await Promise.all(
		rolesThatNeedChanges.map(async (role) => {
			const rolesToAdd = rolesToChangeTo.get(role);
			if (rolesToAdd) {
				await addUserRolesAsync(userId, rolesToAdd);
			}
			await removeUserFromRolesAsync(user._id, [role]);
		}),
	);
};
