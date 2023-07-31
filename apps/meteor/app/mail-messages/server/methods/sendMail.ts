import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Mailer } from '../lib/Mailer';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'Mailer.sendMail'(from: string, subject: string, body: string, dryrun?: boolean, query?: string): any;
	}
}

Meteor.methods<ServerMethods>({
	async 'Mailer.sendMail'(from, subject, body, dryrun, query) {
		methodDeprecationLogger.method('Mailer.sendMail', '7.0.0');

		const userId = Meteor.userId();

		if (!userId || !(await hasPermissionAsync(userId, 'send-mail'))) {
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
