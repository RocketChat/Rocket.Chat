import { Presence } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { RateLimiter } from '../../../lib/server';
import { setStatusText } from '../../../lib/server/functions/setStatusText';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setUserStatus(statusType: IUser['status'], statusText: IUser['statusText']): void;
	}
}

export const setUserStatusMethod = async (userId: string, statusType: IUser['status'], statusText: IUser['statusText']): Promise<void> => {
	if (statusType) {
		if (statusType === 'offline' && !settings.get('Accounts_AllowInvisibleStatusOption')) {
			throw new Meteor.Error('error-status-not-allowed', 'Invisible status is disabled', {
				method: 'setUserStatus',
			});
		}
		await Presence.setStatus(userId, statusType);
	}

	if (statusText || statusText === '') {
		check(statusText, String);

		if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserStatus',
			});
		}

		await setStatusText(userId, statusText);
	}
};

Meteor.methods<ServerMethods>({
	setUserStatus: async (statusType, statusText) => {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUserStatus' });
		}

		await setUserStatusMethod(userId, statusType, statusText);
	},
});

RateLimiter.limitMethod('setUserStatus', 1, 1000, {
	userId: () => true,
});
