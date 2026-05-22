import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { setUserActiveStatus } from '../../lib/users/setUserActiveStatus';

export const executeSetUserActiveStatus = async (
	fromUserId: string,
	userId: string,
	active: boolean,
	confirmRelinquish?: boolean,
): Promise<boolean> => {
	check(userId, String);
	check(active, Boolean);

	if (!fromUserId || (await hasPermissionAsync(fromUserId, 'edit-other-user-active-status')) !== true) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'setUserActiveStatus',
		});
	}

	await setUserActiveStatus(userId, active, confirmRelinquish, fromUserId);

	return true;
};
