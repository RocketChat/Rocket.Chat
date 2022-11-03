import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { t } from '../../../utils';
import { dispatchToastMessage } from '../../../../client/lib/toast';

Accounts.onEmailVerificationLink(function (token, done) {
	Accounts.verifyEmail(token, function (error) {
		if (error == null) {
			dispatchToastMessage({ type: 'success', message: t('Email_verified') });
			Meteor.call('afterVerifyEmail');
		} else {
			dispatchToastMessage({ type: 'error', message: error.message });
		}
		return done();
	});
});
