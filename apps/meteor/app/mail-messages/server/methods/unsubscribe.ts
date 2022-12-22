import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Mailer } from '../lib/Mailer';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'Mailer:unsubscribe'(_id, createdAt) {
		methodDeprecationLogger.warn('Mailer:unsubscribe will be deprecated in future versions of Rocket.Chat');

		return Mailer.unsubscribe(_id, createdAt);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'Mailer:unsubscribe',
		connectionId() {
			return true;
		},
	},
	1,
	60000,
);
