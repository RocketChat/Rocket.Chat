import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { settings } from '/app/settings';
import { setUserAvatar } from '/app/lib';

Meteor.methods({
	setAvatarFromService(dataURI, contentType, service) {
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setAvatarFromService',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setAvatarFromService',
			});
		}

		const user = Meteor.user();

		return setUserAvatar(user, dataURI, contentType, service);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'setAvatarFromService',
	userId() {
		return true;
	},
}, 1, 5000);
