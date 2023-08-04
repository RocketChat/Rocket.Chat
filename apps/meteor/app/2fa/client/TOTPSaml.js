import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import '../../meteor-accounts-saml/client/saml_client';
import { overrideLoginMethod } from '../../../client/lib/2fa/overrideLoginMethod';
import { reportError } from '../../../client/lib/2fa/utils';

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
