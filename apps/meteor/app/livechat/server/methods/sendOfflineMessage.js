import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:sendOfflineMessage'(data) {
		methodDeprecationLogger.warn('livechat:sendOfflineMessage will be deprecated in future versions of Rocket.Chat');

		check(data, {
			name: String,
			email: String,
			message: String,
		});

		return Livechat.sendOfflineMessage(data);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'livechat:sendOfflineMessage',
		connectionId() {
			return true;
		},
	},
	1,
	5000,
);
