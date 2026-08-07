import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';
import { settings } from '../../settings';

Meteor.methods<ServerMethods>({
	checkRegistrationSecretURL(hash) {
		methodDeprecationLogger.method('checkRegistrationSecretURL', '9.0.0', '/v1/misc.registrationSecretCheck');
		check(hash, String);

		return hash === settings.get('Accounts_RegistrationForm_SecretURL');
	},
});
