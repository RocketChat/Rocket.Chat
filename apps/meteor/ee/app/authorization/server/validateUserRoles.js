import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../../server/lib/i18n';
import { isEnterprise, canAddNewGuestUser, canAddNewUser } from '../../license/server/license';

export const validateUserRoles = async function (userId, userData) {
	if (!isEnterprise()) {
		return;
	}

	const isGuest = Boolean(userData.roles?.includes('guest') && userData.roles.length === 1);
	const currentUserData = userData._id ? await Users.findOneById(userData._id) : null;
	const wasGuest = Boolean(currentUserData.roles?.includes('guest') && currentUserData.roles.length === 1);

	if (currentUserData?.type === 'app') {
		return;
	}

	if (isGuest) {
		if (wasGuest) {
			return;
		}

		if (!(await canAddNewGuestUser())) {
			throw new Meteor.Error('error-max-guests-number-reached', 'Maximum number of guests reached.', {
				method: 'insertOrUpdateUser',
				field: 'Assign_role',
			});
		}

		return;
	}

	if (!wasGuest && userData._id) {
		return;
	}

	if (!(await canAddNewUser())) {
		throw new Meteor.Error('error-license-user-limit-reached', i18n.t('error-license-user-limit-reached'));
	}
};
