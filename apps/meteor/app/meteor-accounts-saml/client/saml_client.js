import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { ServiceConfiguration } from 'meteor/service-configuration';

if (!Accounts.saml) {
	Accounts.saml = {};
}

// Override the standard logout behaviour.
//
// If we find a samlProvider, and we are using single
// logout we will initiate logout from rocketchat via saml.
// If not using single logout, we just do the standard logout.
// This can be overridden by a configured logout behaviour.
//
// TODO: This may need some work as it is not clear if we are really
// logging out of the idp when doing the standard logout.

const MeteorLogout = Meteor.logout;
const logoutBehaviour = {
	TERMINATE_SAML: 'SAML',
	ONLY_RC: 'Local',
};

Meteor.logout = function (...args) {
	const samlService = ServiceConfiguration.configurations.findOne({ service: 'saml' });
	if (samlService) {
		const provider = samlService.clientConfig && samlService.clientConfig.provider;
		if (provider) {
			if (samlService.logoutBehaviour == null || samlService.logoutBehaviour === logoutBehaviour.TERMINATE_SAML) {
				if (samlService.idpSLORedirectURL) {
					console.info('SAML session terminated via SLO');
					return Meteor.logoutWithSaml({ provider });
				}
			}

			if (samlService.logoutBehaviour === logoutBehaviour.ONLY_RC) {
				console.info('SAML session not terminated, only the Rocket.Chat session is going to be killed');
			}
		}
	}
	return MeteorLogout.apply(Meteor, args);
};

Meteor.loginWithSaml = function (options /* , callback*/) {
	options = options || {};
	const credentialToken = `id-${Random.id()}`;
	options.credentialToken = credentialToken;

	window.location.href = `_saml/authorize/${options.provider}/${options.credentialToken}`;
};

Meteor.logoutWithSaml = function (options /* , callback*/) {
	// Accounts.saml.idpInitiatedSLO(options, callback);
	Meteor.call('samlLogout', options.provider, function (err, result) {
		if (err || !result) {
			MeteorLogout.apply(Meteor);
			return;
		}

		// Remove the userId from the client to prevent calls to the server while the logout is processed.
		// If the logout fails, the userId will be reloaded on the resume call
		Meteor._localStorage.removeItem(Accounts.USER_ID_KEY);

		// A nasty bounce: 'result' has the SAML LogoutRequest but we need a proper 302 to redirected from the server.
		window.location.replace(Meteor.absoluteUrl(`_saml/sloRedirect/${options.provider}/?redirect=${encodeURIComponent(result)}`));
	});
};

Meteor.loginWithSamlToken = function (token, userCallback) {
	Accounts.callLoginMethod({
		methodArguments: [
			{
				saml: true,
				credentialToken: token,
			},
		],
		userCallback,
	});
};
