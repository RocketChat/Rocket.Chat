import { Upload } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { settings } from '../../settings';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		resetAvatar(userId: IUser['_id']): void;
	}
}

export const resetAvatar = async (fromUserId: IUser['_id'], userId: IUser['_id']): Promise<void> => {
	const canEditOtherUserAvatar = await hasPermissionAsync(fromUserId, 'edit-other-user-avatar');

	if (!settings.get('Accounts_AllowUserAvatarChange') && !canEditOtherUserAvatar) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'resetAvatar',
		});
	}

	let user;

	if (userId !== fromUserId) {
		if (!canEditOtherUserAvatar) {
			throw new Meteor.Error('error-unauthorized', 'Unauthorized', {
				method: 'resetAvatar',
			});
		}

		user = await Users.findOneById(userId, { projection: { _id: 1, username: 1 } });
	} else {
		user = await Users.findOneById(fromUserId, { projection: { _id: 1, username: 1 } });
	}

	if (!user?.username) {
		throw new Meteor.Error('error-invalid-desired-user', 'Invalid desired user', {
			method: 'resetAvatar',
		});
	}

	await Upload.resetUserAvatar(user);
};

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'resetAvatar',
		userId() {
			return true;
		},
	},
	1,
	60000,
);
