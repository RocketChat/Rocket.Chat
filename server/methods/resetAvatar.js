import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { FileUpload } from '../../app/file-upload';
import { Users } from '../../app/models';
import { settings } from '../../app/settings';
import { Notifications } from '../../app/notifications';

Meteor.methods({
	resetAvatar(args) {
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

		if (args) {
			FileUpload.getStore('Avatars').deleteByName(args.username);
			Users.unsetAvatarOrigin(args._id);
			Notifications.notifyLogged('updateAvatar', {
				username: args.username,
			});
		} else {
			const user = Meteor.user();
			FileUpload.getStore('Avatars').deleteByName(user.username);
			Users.unsetAvatarOrigin(user._id);
			Notifications.notifyLogged('updateAvatar', {
				username: user.username,
			});
		}
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'resetAvatar',
	userId() {
		return true;
	},
}, 1, 60000);
