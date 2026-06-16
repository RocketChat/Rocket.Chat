import { Presence } from '@rocket.chat/core-services';
import { UserStatus, type IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { RateLimiter } from '../../../lib/server';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setUserStatus(statusType: IUser['status'], statusText: IUser['statusText']): void;
	}
}

export const setUserStatusMethod = async (
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'statusDefault' | 'roles' | 'statusText'>,
	statusType: IUser['status'],
	statusText: IUser['statusText'],
): Promise<void> => {
	if (statusText != null && !settings.get('Accounts_AllowUserStatusMessageChange')) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'setUserStatus',
		});
	}

	const effectiveStatus = statusType || user.statusDefault || UserStatus.ONLINE;

	if (effectiveStatus === UserStatus.OFFLINE && !settings.get('Accounts_AllowInvisibleStatusOption')) {
		throw new Meteor.Error('error-status-not-allowed', 'Invisible status is disabled', {
			method: 'setUserStatus',
		});
	}

	await Presence.setStatus(user._id, effectiveStatus, statusText);
};

Meteor.methods<ServerMethods>({
	setUserStatus: async (statusType, statusText) => {
		const user = (await Meteor.userAsync()) as IUser;
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUserStatus' });
		}

		await setUserStatusMethod(user, statusType, statusText);
	},
});

RateLimiter.limitMethod('setUserStatus', 1, 1000, {
	userId: () => true,
});
