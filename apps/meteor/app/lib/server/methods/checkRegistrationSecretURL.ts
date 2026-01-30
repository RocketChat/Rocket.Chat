import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';

Meteor.methods<ServerMethods>({
	checkRegistrationSecretURL(hash) {
		check(hash, String);

		return hash === settings.get('Accounts_RegistrationForm_SecretURL');
	},
});
