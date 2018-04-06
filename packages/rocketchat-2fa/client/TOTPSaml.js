Meteor.loginWithSamlAndTOTP = function(options, code, callback) {
	// support a callback without options
	if (!callback && typeof options === 'function') {
		callback = options;
		options = null;
	}

	console.log('options');
	console.log(options);

	if (!options) {
		options = {};
		options.credentialToken = `id-${ Random.id() }`;
	}
	const credentialToken = options.credentialToken;

	Accounts.saml.initiateLogin(options, function(/*error, result*/) {
		Accounts.callLoginMethod({
			methodArguments: [{
				saml: true,
				credentialToken,
				totp: {
					code
				}
			}],
			userCallback: callback
		});
	});
};

const loginWithSaml = Meteor.loginWithSaml;

Meteor.loginWithSaml = function(options, callback) {
	console.log('first call');
	console.log(options);
	/* globals overrideLoginMethod*/
	overrideLoginMethod(loginWithSaml, [options], callback, Meteor.loginWithSamlAndTOTP);
};
