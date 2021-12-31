import { Meteor } from 'meteor/meteor';

import { isEnterprise, getMaxGuestUsers } from '../../license/server';
import { Users } from '../../../../app/models/server';

export const validateUserRoles = function (userId, userData) {
	if (!isEnterprise()) {
		return;
	}

	if (!userData.roles.includes('guest')) {
		return;
	}

	if (userData.roles.length >= 2) {
		throw new Meteor.Error('error-guests-cant-have-other-roles', "Guest users can't receive any other role", {
			method: 'insertOrUpdateUser',
			field: 'Assign_role',
		});
	}

	const guestCount = Users.getActiveLocalGuestCount(userData._id);
	if (guestCount >= getMaxGuestUsers()) {
		throw new Meteor.Error('error-max-guests-number-reached', 'Maximum number of guests reached.', {
			method: 'insertOrUpdateUser',
			field: 'Assign_role',
		});
	}
};
