import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { settings } from '../../app/settings/server';
import { setUserAvatar } from '../../app/lib/server';
import { Users } from '../../app/models/server';
import { hasPermission } from '../../app/authorization/server';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	setAvatarFromService(dataURI: string, contentType: string, service: string, userId: string) {
		methodDeprecationLogger.warn('setAvatarFromService will be deprecated in future versions of Rocket.Chat');
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));
		check(userId, Match.Optional(String));

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

		let user;

		if (userId && userId !== Meteor.userId()) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			if (!hasPermission(Meteor.userId()!, 'edit-other-user-avatar')) {
				throw new Meteor.Error('error-unauthorized', 'Unauthorized', {
					method: 'setAvatarFromService',
				});
			}

			user = Users.findOneById(userId, { fields: { _id: 1, username: 1 } });
		} else {
			user = Meteor.user();
		}

		if (user == null) {
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
