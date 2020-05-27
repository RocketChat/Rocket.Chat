import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { Users } from '../../../models/server';
import { SAMLServiceProvider } from '../lib/ServiceProvider';

/**
 * Fetch SAML provider configs for given 'provider'.
 */
function getSamlServiceProviderOptions(provider: string): Record<string, any> {
	if (!provider) {
		throw new Meteor.Error('no-saml-provider', 'SAML internal error', {
			method: 'getSamlServiceProviderOptions',
		});
	}

	const samlProvider = function(element: object): boolean {
		return element.provider === provider;
	};

	return Accounts.saml.settings.providers.filter(samlProvider)[0];
}

Meteor.methods({
	samlLogout(provider: string) {
		// Make sure the user is logged in before we initiate SAML Logout
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'samlLogout' });
		}
		const providerConfig = getSamlServiceProviderOptions(provider);

		if (Accounts.saml.settings.debug) {
			console.log(`Logout request from ${ JSON.stringify(providerConfig) }`);
		}
		// This query should respect upcoming array of SAML logins
		const user = Users.getSAMLByIdAndSAMLProvider(Meteor.userId(), provider);
		if (!user || !user.services || !user.services.saml) {
			return;
		}

		let { nameID } = user.services.saml;
		const sessionIndex = user.services.saml.idpSession;
		nameID = sessionIndex;
		if (Accounts.saml.settings.debug) {
			console.log(`NameID for user ${ Meteor.userId() } found: ${ JSON.stringify(nameID) }`);
		}

		const _saml = new SAMLServiceProvider(providerConfig);

		const request = _saml.generateLogoutRequest({
			nameID,
			sessionIndex,
		});

		// request.request: actual XML SAML Request
		// request.id: comminucation id which will be mentioned in the ResponseTo field of SAMLResponse

		Meteor.users.update({
			_id: Meteor.userId(),
		}, {
			$set: {
				'services.saml.inResponseTo': request.id,
			},
		});

		const _syncRequestToUrl = Meteor.wrapAsync(_saml.requestToUrl, _saml);
		const result = _syncRequestToUrl(request.request, 'logout');
		if (Accounts.saml.settings.debug) {
			console.log(`SAML Logout Request ${ result }`);
		}

		return result;
	},
});
