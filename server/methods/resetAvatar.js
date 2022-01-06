import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { FileUpload } from '../../app/file-upload';
import { Users } from '../../app/models/server';
import { settings } from '../../app/settings';
import { hasPermission } from '../../app/authorization/server';
import { api } from '../sdk/api';

Meteor.methods({
	resetAvatar(userId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetAvatar',
			});
		}
		const canEditOtherUserAvatar = hasPermission(Meteor.userId(), 'edit-other-user-avatar');

		if (!settings.get('Accounts_AllowUserAvatarChange') && !canEditOtherUserAvatar) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetAvatar',
			});
		}

		let user;

		if (userId && userId !== Meteor.userId()) {
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
		api.broadcast('user.avatarUpdate', { username: user.username, avatarETag: null });
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
