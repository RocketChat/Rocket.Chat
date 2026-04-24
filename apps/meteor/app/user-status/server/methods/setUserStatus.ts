import { Presence } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { RateLimiter } from '../../../lib/server';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setUserStatus(
			statusType: IUser['status'],
			statusText: IUser['statusText'],
			statusEmoji?: IUser['statusEmoji'],
			statusExpiresAt?: IUser['statusExpiresAt'],
		): void;
	}
}

export const setUserStatusMethod = async (
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'statusText'>,
	statusType: IUser['status'],
	statusText: IUser['statusText'],
	statusEmoji?: IUser['statusEmoji'],
	statusExpiresAt?: IUser['statusExpiresAt'],
): Promise<void> => {
	if (statusType === UserStatus.OFFLINE && !settings.get('Accounts_AllowInvisibleStatusOption')) {
		throw new Meteor.Error('error-status-not-allowed', 'Invisible status is disabled', {
			method: 'setUserStatus',
		});
	}

	if (statusText != null) {
		check(statusText, String);

		if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserStatus',
			});
		}
	}

	await Presence.setStatus(
		user._id,
		statusType ?? user.status ?? UserStatus.ONLINE,
		statusText ?? user.statusText ?? '',
		statusEmoji,
		statusExpiresAt,
	);
};

Meteor.methods<ServerMethods>({
	setUserStatus: async (statusType, statusText, statusEmoji, statusExpiresAt) => {
		const user = (await Meteor.userAsync()) as IUser;
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUserStatus' });
		}

		await setUserStatusMethod(user, statusType, statusText, statusEmoji, statusExpiresAt);
	},
});

RateLimiter.limitMethod('setUserStatus', 1, 1000, {
	userId: () => true,
});
