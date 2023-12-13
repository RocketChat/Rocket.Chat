import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { sdk } from '../../app/utils/client/lib/SDKClient';

Accounts.onEmailVerificationLink((token: string) => {
	Accounts.verifyEmail(token, (error) => {
		if (error) {
			throw new Meteor.Error('verify-email', 'E-mail not verified');
		}
		void sdk.call('afterVerifyEmail');
	});
});
