import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { FileUpload } from 'meteor/rocketchat:file-upload';
import { Users } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { Notifications } from 'meteor/rocketchat:notifications';

Meteor.methods({
	resetAvatar() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetAvatar',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetAvatar',
			});
		}

		const user = Meteor.user();
		FileUpload.getStore('Avatars').deleteByName(user.username);
		Users.unsetAvatarOrigin(user._id);
		Notifications.notifyLogged('updateAvatar', {
			username: user.username,
		});
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'resetAvatar',
	userId() {
		return true;
	},
}, 1, 60000);
