import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { type LoginCallback, callLoginMethod, handleLogin } from '../../lib/2fa/overrideLoginMethod';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithSamlToken(credentialToken: string, callback?: LoginCallback): void;

		function loginWithSaml(options: { provider: string; credentialToken?: string }): void;
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
		logoutBehaviour?: 'SAML' | 'Local';
		idpSLORedirectURL?: string;
	}
}

if (!Accounts.saml) {
	Accounts.saml = {};
}

const { logout } = Meteor;

Meteor.logout = async function (...args) {
	const { sdk } = await import('../../../app/utils/client/lib/SDKClient');
	const samlService = await ServiceConfiguration.configurations.findOneAsync({ service: 'saml' });
	if (samlService) {
		const provider = (samlService.clientConfig as { provider?: string } | undefined)?.provider;
		if (provider) {
			if (samlService.logoutBehaviour == null || samlService.logoutBehaviour === 'SAML') {
				if (samlService.idpSLORedirectURL) {
					console.info('SAML session terminated via SLO');
					sdk
						.call('samlLogout', provider)
						.then((result) => {
							if (!result) {
								logout.apply(Meteor);
								return;
							}

							// Remove the userId from the client to prevent calls to the server while the logout is processed.
							// If the logout fails, the userId will be reloaded on the resume call
							Meteor._localStorage.removeItem(Accounts.USER_ID_KEY);

							// A nasty bounce: 'result' has the SAML LogoutRequest but we need a proper 302 to redirected from the server.
							window.location.replace(Meteor.absoluteUrl(`_saml/sloRedirect/${provider}/?redirect=${encodeURIComponent(result)}`));
						})
						.catch(() => logout.apply(Meteor));
					return;
				}
			}

			if (samlService.logoutBehaviour === 'Local') {
				console.info('SAML session not terminated, only the Rocket.Chat session is going to be killed');
			}
		}
	}
	return logout.apply(Meteor, args);
};

Meteor.loginWithSaml = (options) => {
	options = options || {};
	const credentialToken = `id-${Random.id()}`;
	options.credentialToken = credentialToken;

	window.location.href = `_saml/authorize/${options.provider}/${options.credentialToken}`;
};

const loginWithSamlToken = (credentialToken: string) =>
	callLoginMethod({
		methodArguments: [
			{
				saml: true,
				credentialToken,
			},
		],
	});

const loginWithSamlTokenAndTOTP = (credentialToken: string, code: string) =>
	callLoginMethod({
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
	});

Meteor.loginWithSamlToken = handleLogin(loginWithSamlToken, loginWithSamlTokenAndTOTP);
