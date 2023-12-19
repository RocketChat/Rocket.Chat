import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { reportError } from '../../lib/2fa/utils';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithSamlTokenAndTOTP(credentialToken: string, code: string, callback?: LoginCallback): void;

		function loginWithSamlToken(credentialToken: string, callback?: LoginCallback): void;

		function loginWithSaml(options: { provider: string; credentialToken?: string }): void;

		function logoutWithSaml(options: { provider: string }): void;
	}
}

declare module 'meteor/accounts-base' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Accounts {
		export let saml: {
			credentialToken?: string;
			credentialSecret?: string;
		};
	}
}

declare module 'meteor/service-configuration' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Configuration {
		logoutBehaviour?: string;
		idpSLORedirectURL?: string;
	}
}

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

Meteor.loginWithSaml = function (options /* , callback*/) {
	options = options || {};
	const credentialToken = `id-${Random.id()}`;
	options.credentialToken = credentialToken;

	window.location.href = `_saml/authorize/${options.provider}/${options.credentialToken}`;
};

Meteor.logoutWithSaml = function (options /* , callback*/) {
	// Accounts.saml.idpInitiatedSLO(options, callback);
	sdk
		.call('samlLogout', options.provider)
		.then((result) => {
			if (!result) {
				MeteorLogout.apply(Meteor);
				return;
			}

			// Remove the userId from the client to prevent calls to the server while the logout is processed.
			// If the logout fails, the userId will be reloaded on the resume call
			Meteor._localStorage.removeItem(Accounts.USER_ID_KEY);

			// A nasty bounce: 'result' has the SAML LogoutRequest but we need a proper 302 to redirected from the server.
			window.location.replace(Meteor.absoluteUrl(`_saml/sloRedirect/${options.provider}/?redirect=${encodeURIComponent(result)}`));
		})
		.catch(() => MeteorLogout.apply(Meteor));
};

Meteor.logout = async function (...args) {
	const samlService = await ServiceConfiguration.configurations.findOneAsync({ service: 'saml' });
	if (samlService) {
		const provider = (samlService.clientConfig as { provider?: string } | undefined)?.provider;
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
				callback?.(undefined);
			}
		},
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

const { loginWithSamlToken } = Meteor;

Meteor.loginWithSamlToken = function (credentialToken, callback) {
	overrideLoginMethod(loginWithSamlToken, [credentialToken], callback, Meteor.loginWithSamlTokenAndTOTP);
};
