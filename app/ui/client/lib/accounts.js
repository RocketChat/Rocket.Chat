import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import toastr from 'toastr';

import { t } from '../../../utils';

Accounts.onEmailVerificationLink(function(token, done) {
	Accounts.verifyEmail(token, function(error) {
		if (error == null) {
			toastr.success(t('Email_verified'));
			Meteor.call('afterVerifyEmail');
		} else {
			toastr.error(error.message);
		}
		return done();
	});
});
