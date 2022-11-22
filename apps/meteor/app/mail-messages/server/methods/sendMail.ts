import { Meteor } from 'meteor/meteor';

import { Mailer } from '../lib/Mailer';
import { hasPermission } from '../../../authorization/server';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'Mailer.sendMail'(from, subject, body, dryrun, query) {
		methodDeprecationLogger.warn('Mailer.sendMail will be deprecated in future versions of Rocket.Chat');

		const userId = Meteor.userId();

		if (!userId || !hasPermission(userId, 'send-mail')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'Mailer.sendMail',
			});
		}

		return Mailer.sendMail({ from, subject, body, dryrun, query });
	},
});

// Limit setting username once per minute
// DDPRateLimiter.addRule
//	type: 'method'
//	name: 'Mailer.sendMail'
//	connectionId: -> return true
//	, 1, 60000
