import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Utils2fa } from './lib/2fa';
import { Random } from 'meteor/random';

Meteor.loginWithSamlAndTOTP = function(options, code, callback) {
	// support a callback without options
	if (!callback && typeof options === 'function') {
		callback = options;
		options = null;
	}

	if (!options) {
		options = {};
		options.credentialToken = `id-${ Random.id() }`;
	}
	const { credentialToken } = options;

	Accounts.saml.initiateLogin(options, function(/* error, result */) {
		Accounts.callLoginMethod({
			methodArguments: [{
				saml: true,
				credentialToken,
				totp: {
					code,
				},
			}],
			userCallback: callback,
		});
	});
};

const { loginWithSaml } = Meteor;

Meteor.loginWithSaml = function(options, callback) {
	Utils2fa.overrideLoginMethod(loginWithSaml, [options], callback, Meteor.loginWithSamlAndTOTP);
};
