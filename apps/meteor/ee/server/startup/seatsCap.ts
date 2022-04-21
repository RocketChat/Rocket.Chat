import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../lib/callbacks';
import { canAddNewUser, getMaxActiveUsers, onValidateLicenses } from '../../app/license/server/license';
import {
	createSeatsLimitBanners,
	disableDangerBannerDiscardingDismissal,
	disableWarningBannerDiscardingDismissal,
	enableDangerBanner,
	enableWarningBanner,
} from '../../app/license/server/maxSeatsBanners';
import { validateUserRoles } from '../../app/authorization/server/validateUserRoles';
import { Users } from '../../../app/models/server';

callbacks.add(
	'onCreateUser',
	({ isGuest }: { isGuest: boolean }) => {
		if (isGuest) {
			return;
		}

		if (!canAddNewUser()) {
			throw new Meteor.Error('error-license-user-limit-reached', TAPi18n.__('error-license-user-limit-reached'));
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-user-seats',
);

callbacks.add(
	'beforeActivateUser',
	(user: IUser) => {
		if (user.roles.length === 1 && user.roles.includes('guest')) {
			return;
		}

		if (user.type === 'app') {
			return;
		}

		if (!canAddNewUser()) {
			throw new Meteor.Error('error-license-user-limit-reached', TAPi18n.__('error-license-user-limit-reached'));
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-user-seats',
);

callbacks.add(
	'validateUserRoles',
	(userData: Partial<IUser>) => {
		const isGuest = userData.roles?.includes('guest');
		if (isGuest) {
			validateUserRoles(Meteor.userId(), userData);
			return;
		}

		if (!userData._id) {
			return;
		}

		const currentUserData = Users.findOneById(userData._id);
		if (currentUserData.type === 'app') {
			return;
		}

		const wasGuest = currentUserData?.roles?.length === 1 && currentUserData.roles.includes('guest');
		if (!wasGuest) {
			return;
		}

		if (!canAddNewUser()) {
			throw new Meteor.Error('error-license-user-limit-reached', TAPi18n.__('error-license-user-limit-reached'));
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-user-seats',
);

const handleMaxSeatsBanners = (): void => {
	const maxActiveUsers = getMaxActiveUsers();

	if (!maxActiveUsers) {
		disableWarningBannerDiscardingDismissal();
		disableDangerBannerDiscardingDismissal();
		return;
	}

	const activeUsers = Users.getActiveLocalUserCount();

	// callback runs before user is added, so we should add the user
	// that is being created to the current value.
	const ratio = activeUsers / maxActiveUsers;
	const seatsLeft = maxActiveUsers - activeUsers;

	if (ratio < 0.8 || ratio >= 1) {
		disableWarningBannerDiscardingDismissal();
	} else {
		enableWarningBanner(seatsLeft);
	}

	if (ratio < 1) {
		disableDangerBannerDiscardingDismissal();
	} else {
		enableDangerBanner();
	}
};

callbacks.add('afterCreateUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterSaveUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterDeleteUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterDeactivateUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterActivateUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

Meteor.startup(() => {
	createSeatsLimitBanners();

	handleMaxSeatsBanners();

	onValidateLicenses(handleMaxSeatsBanners);
});
