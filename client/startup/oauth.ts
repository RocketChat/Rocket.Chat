import { Meteor } from 'meteor/meteor';
// @ts-ignore #ToDo: Add definitions for meteor/oauth
import { OAuth } from 'meteor/oauth';

// OAuth._retrieveCredentialSecret is a meteor method modified to also check the global localStorage
// This was necessary because of the "Forget User Session on Window Close" setting.
// The setting changes Meteor._localStorage to use the browser's session storage instead, but that doesn't happen on the Oauth's popup code.

Meteor.startup(() => {
	const meteorOAuthRetrieveCredentialSecret = OAuth._retrieveCredentialSecret;
	OAuth._retrieveCredentialSecret = (credentialToken: string): string | undefined => {
		let secret = meteorOAuthRetrieveCredentialSecret.call(OAuth, credentialToken);
		if (!secret) {
			const localStorageKey = `${OAuth._storageTokenPrefix}${credentialToken}`;
			secret = localStorage.getItem(localStorageKey);
			localStorage.removeItem(localStorageKey);
		}

		return secret;
	};
});
