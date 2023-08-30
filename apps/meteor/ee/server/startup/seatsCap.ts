import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { throttle } from 'underscore';

import { callbacks } from '../../../lib/callbacks';
import { i18n } from '../../../server/lib/i18n';
import { validateUserRoles } from '../../app/authorization/server/validateUserRoles';
import { canAddNewUser, getMaxActiveUsers, onValidateLicenses } from '../../app/license/server/license';
import {
	createSeatsLimitBanners,
	disableDangerBannerDiscardingDismissal,
	disableWarningBannerDiscardingDismissal,
	enableDangerBanner,
	enableWarningBanner,
} from '../../app/license/server/maxSeatsBanners';

callbacks.add(
	'onCreateUser',
	async ({ isGuest }: { isGuest: boolean }) => {
		if (isGuest) {
			return;
		}

		if (!(await canAddNewUser())) {
			throw new Meteor.Error('error-license-user-limit-reached', i18n.t('error-license-user-limit-reached'));
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-user-seats',
);

callbacks.add(
	'beforeUserImport',
	async ({ userCount }) => {
		if (!(await canAddNewUser(userCount))) {
			throw new Meteor.Error('error-license-user-limit-reached', i18n.t('error-license-user-limit-reached'));
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-user-seats',
);

callbacks.add(
	'beforeActivateUser',
	async (user: IUser) => {
		if (user.roles.length === 1 && user.roles.includes('guest')) {
			return;
		}

		if (user.type === 'app') {
			return;
		}

		if (!(await canAddNewUser())) {
			throw new Meteor.Error('error-license-user-limit-reached', i18n.t('error-license-user-limit-reached'));
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-user-seats',
);

callbacks.add(
	'validateUserRoles',
	async (userData: Partial<IUser>) => {
		const isGuest = userData.roles?.includes('guest');
		if (isGuest) {
			await validateUserRoles(Meteor.userId(), userData);
			return;
		}

		if (!userData._id) {
			return;
		}

		const currentUserData = await Users.findOneById(userData._id);
		if (currentUserData?.type === 'app') {
			return;
		}

		const wasGuest = currentUserData?.roles?.length === 1 && currentUserData.roles.includes('guest');
		if (!wasGuest) {
			return;
		}

		if (!(await canAddNewUser())) {
			throw new Meteor.Error('error-license-user-limit-reached', i18n.t('error-license-user-limit-reached'));
		}
	},
	callbacks.priority.MEDIUM,
	'check-max-user-seats',
);

const handleMaxSeatsBanners = throttle(async function _handleMaxSeatsBanners() {
	const maxActiveUsers = getMaxActiveUsers();

	if (!maxActiveUsers) {
		await disableWarningBannerDiscardingDismissal();
		await disableDangerBannerDiscardingDismissal();
		return;
	}

	const activeUsers = await Users.getActiveLocalUserCount();

	// callback runs before user is added, so we should add the user
	// that is being created to the current value.
	const ratio = activeUsers / maxActiveUsers;
	const seatsLeft = maxActiveUsers - activeUsers;

	if (ratio < 0.8 || ratio >= 1) {
		await disableWarningBannerDiscardingDismissal();
	} else {
		await enableWarningBanner(seatsLeft);
	}

	if (ratio < 1) {
		await disableDangerBannerDiscardingDismissal();
	} else {
		await enableDangerBanner();
	}
}, 10000);

callbacks.add('afterCreateUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterSaveUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterDeleteUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterDeactivateUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterActivateUser', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

callbacks.add('afterUserImport', handleMaxSeatsBanners, callbacks.priority.MEDIUM, 'handle-max-seats-banners');

Meteor.startup(async () => {
	await createSeatsLimitBanners();

	await handleMaxSeatsBanners();

	onValidateLicenses(handleMaxSeatsBanners);
});
