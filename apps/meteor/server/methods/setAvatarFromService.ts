import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IUser } from '@rocket.chat/core-typings';

import { settings } from '../../app/settings/server';
import { setUserAvatar } from '../../app/lib/server';
import { Users } from '../../app/models/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setAvatarFromService(dataURI: Buffer | Blob, contentType?: string, service?: string, userId?: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async setAvatarFromService(dataURI, contentType, service, userId) {
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));
		check(userId, Match.Optional(String));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setAvatarFromService',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setAvatarFromService',
			});
		}

		let user: IUser | null;

		if (userId && userId !== uid) {
			if (!(await hasPermissionAsync(uid, 'edit-other-user-avatar'))) {
				throw new Meteor.Error('error-unauthorized', 'Unauthorized', {
					method: 'setAvatarFromService',
				});
			}

			user = Users.findOneById(userId, { fields: { _id: 1, username: 1 } });
		} else {
			user = (await Meteor.userAsync()) as IUser | null;
		}

		if (!user) {
			throw new Meteor.Error('error-invalid-desired-user', 'Invalid desired user', {
				method: 'setAvatarFromService',
			});
		}

		return setUserAvatar(user, dataURI, contentType, service);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'setAvatarFromService',
		userId() {
			return true;
		},
	},
	1,
	5000,
);
