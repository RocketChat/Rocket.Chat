import { Random } from '@rocket.chat/random';
import type { Meteor } from 'meteor/meteor';

import { handleLogin } from '../../lib/2fa/overrideLoginMethod';
import { absoluteUrl } from '../../lib/absoluteUrl';
import { STORAGE_KEYS, removeStoredItem } from '../../lib/sdk/storage';
import { settings } from '../../lib/settings';
import { callLoginMethod, registerLoginWithMethod } from '../accounts';

declare module 'meteor/accounts-base' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Accounts {
		/**
		 * There is one case where the onlogout event is triggered with no user:
		 * during the deletion, the user is logged out, and the framework try to get the user from the database.
		 */
		function onLogout(func: (options: { user?: Meteor.User; connection: Meteor.Connection }) => void): void;
	}
}

declare module 'meteor/service-configuration' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Configuration {
		logoutBehaviour?: 'SAML' | 'Local';
		idpSLORedirectURL?: string;
	}
}

/** Ends the session at the SAML identity provider; resolves `false` when the caller should log out locally instead. */
export const logoutFromSamlIdp = async (): Promise<boolean> => {
	if (!settings.peek('SAML_Custom_Default')) {
		return false;
	}

	if (settings.peek('SAML_Custom_Default_logout_behaviour') === 'Local') {
		console.info('SAML session not terminated, only the Rocket.Chat session is going to be killed');
		return false;
	}

	const provider = settings.peek('SAML_Custom_Default_provider');

	if (!provider || !settings.peek('SAML_Custom_Default_idp_slo_redirect_url')) {
		return false;
	}

	console.info('SAML session terminated via SLO');

	// Any failure on the way to the identity provider falls back to the local logout.
	try {
		const { sdk } = await import('../../lib/SDKClient');
		const result = await sdk.call('samlLogout', provider);

		if (!result) {
			return false;
		}

		// Remove the userId from the client to prevent calls to the server while the logout is processed.
		// If the logout fails, the userId will be reloaded on the resume call
		removeStoredItem(STORAGE_KEYS.USER_ID);

		// A nasty bounce: 'result' has the SAML LogoutRequest but we need a proper 302 to redirected from the server.
		window.location.replace(absoluteUrl(`_saml/sloRedirect/${provider}/?redirect=${encodeURIComponent(result)}`));
		return true;
	} catch (error) {
		console.warn('[saml] single logout failed, logging out locally', error);
		return false;
	}
};

registerLoginWithMethod('loginWithSaml', (options: { provider: string; credentialToken?: string } = { provider: '' }) => {
	options.credentialToken = `id-${Random.id()}`;

	let url = `_saml/authorize/${options.provider}/${options.credentialToken}`;

	// Forward the loginClient so the session can be deep-linked back to the native client.
	const loginClient = new URLSearchParams(window.location.search).get('loginClient');
	if (loginClient === 'desktop' || loginClient === 'mobile') {
		url += `?loginClient=${loginClient}`;
	}

	window.location.href = url;
});

const loginWithSamlTokenOnly = (credentialToken: string) =>
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

export const loginWithSamlToken = handleLogin(loginWithSamlTokenOnly, loginWithSamlTokenAndTOTP);
