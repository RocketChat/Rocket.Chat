import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import '../../meteor-accounts-saml/client/saml_client';
import { reportError } from '../../../client/lib/2fa/utils';
import { overrideLoginMethod } from '../../../client/lib/2fa/overrideLoginMethod';

Meteor.loginWithSamlTokenAndTOTP = function (credentialToken, code, callback) {
	Accounts.callLoginMethod({
		methodArguments: [
			{
				totp: {
					login: {
						saml: true,
						credentialToken,
					},
					code,
				},
			},
		],
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

Meteor.loginWithSamlToken = function (options, callback) {
	overrideLoginMethod(loginWithSamlToken, [options], callback, Meteor.loginWithSamlTokenAndTOTP);
};
