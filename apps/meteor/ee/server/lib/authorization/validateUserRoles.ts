import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';

import { i18n } from '../../../../server/lib/i18n';

export async function validateUserRoles(userData: Partial<IUser>, currentUserData?: Partial<IUser>) {
	const isApp = Boolean(userData.type === 'app');
	const wasApp = Boolean(currentUserData?.type === 'app');

	const isBot = Boolean(userData.type === 'bot');
	const wasBot = Boolean(currentUserData?.type === 'bot');

	const isGuest = Boolean(userData.roles?.includes('guest') && userData.roles.length === 1);
	const wasGuest = Boolean(currentUserData?.roles?.includes('guest') && currentUserData.roles.length === 1);

	const isSpecialType = isApp || isBot;

	const hasGuestToChanged = isGuest && !wasGuest;

	if (isSpecialType) {
		return;
	}

	if (hasGuestToChanged && (await License.shouldPreventAction('guestUsers'))) {
		throw new MeteorError('error-max-guests-number-reached', 'Maximum number of guests reached.', {
			method: 'insertOrUpdateUser',
			field: 'Assign_role',
		});
	}

	if (isGuest) {
		return;
	}

	const isActive = Boolean(userData.active !== false);
	const wasActive = currentUserData && currentUserData?.active !== false;

	const hasRemovedSpecialType = (wasApp && !isApp) || (wasBot && !isBot);

	if (!isActive) {
		return;
	}

	if (!hasRemovedSpecialType && wasActive) {
		return;
	}

	if (await License.shouldPreventAction('activeUsers')) {
		throw new MeteorError('error-license-user-limit-reached', i18n.t('error-license-user-limit-reached'));
	}
}
