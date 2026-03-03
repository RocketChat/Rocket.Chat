import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { callLoginMethod, handleLogin } from '../../lib/2fa/overrideLoginMethod';
import { settings } from '../../lib/settings';

if (!Accounts.saml) {
	Accounts.saml = {};
}

const { logout } = Meteor;

Meteor.logout = async function (...args) {
	const standardLogout = () => logout.apply(Meteor, args);

	if (!settings.peek('SAML_Custom_Default')) {
		return standardLogout();
	}

	if (settings.peek('SAML_Custom_Default_logout_behaviour') === 'Local') {
		console.info('SAML session not terminated, only the Rocket.Chat session is going to be killed');
		return standardLogout();
	}

	const provider = settings.peek('SAML_Custom_Default_provider');

	if (provider && settings.peek('SAML_Custom_Default_idp_slo_redirect_url')) {
		console.info('SAML session terminated via SLO');

		const { sdk } = await import('../../../app/utils/client/lib/SDKClient');
		sdk
			.call('samlLogout', provider)
			.then((result) => {
				if (!result) {
					logout.apply(Meteor);
					return;
				}

				// Remove the userId from the client to prevent calls to the server while the logout is processed.
				// If the logout fails, the userId will be reloaded on the resume call
				Accounts.storageLocation.removeItem(Accounts.USER_ID_KEY);

				// A nasty bounce: 'result' has the SAML LogoutRequest but we need a proper 302 to redirected from the server.
				window.location.replace(Meteor.absoluteUrl(`_saml/sloRedirect/${provider}/?redirect=${encodeURIComponent(result)}`));
			})
			.catch(() => logout.apply(Meteor));
		return;
	}

	return standardLogout();
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
