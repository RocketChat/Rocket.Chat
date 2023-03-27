import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { api } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IUser } from '@rocket.chat/core-typings';

import { FileUpload } from '../../app/file-upload/server';
import { Users } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		resetAvatar(userId: IUser['_id']): void;
	}
}

Meteor.methods<ServerMethods>({
	async resetAvatar(userId) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetAvatar',
			});
		}
		const canEditOtherUserAvatar = await hasPermissionAsync(uid, 'edit-other-user-avatar');

		if (!settings.get('Accounts_AllowUserAvatarChange') && !canEditOtherUserAvatar) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetAvatar',
			});
		}

		let user;

		if (userId && userId !== uid) {
			if (!canEditOtherUserAvatar) {
				throw new Meteor.Error('error-unauthorized', 'Unauthorized', {
					method: 'resetAvatar',
				});
			}

			user = Users.findOneById(userId, { fields: { _id: 1, username: 1 } });
		} else {
			user = Meteor.user();
		}

		if (user == null) {
			throw new Meteor.Error('error-invalid-desired-user', 'Invalid desired user', {
				method: 'resetAvatar',
			});
		}

		FileUpload.getStore('Avatars').deleteByName(user.username);
		Users.unsetAvatarData(user._id);
		void api.broadcast('user.avatarUpdate', { username: user.username, avatarETag: undefined });
	},
});

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
