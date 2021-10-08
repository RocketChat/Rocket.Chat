import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { Utils2fa } from './lib/2fa';
import '../../meteor-accounts-saml/client/saml_client';
import { reportError } from './utils';

Meteor.loginWithSamlTokenAndTOTP = function(credentialToken, code, callback) {
	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: {
					saml: true,
					credentialToken,
				},
				code,
			},
		}],
		userCallback(error) {
			if (error) {
				reportError(error, callback);
			} else {
				callback && callback();
			}
		},
	});
};

const { loginWithSamlToken } = Meteor;

Meteor.loginWithSamlToken = function(options, callback) {
	Utils2fa.overrideLoginMethod(loginWithSamlToken, [options], callback, Meteor.loginWithSamlTokenAndTOTP);
};
