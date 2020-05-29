import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';
import { SAMLServiceProvider } from '../lib/ServiceProvider';
import { SAMLUtils } from '../lib/Utils';
import { IServiceProviderOptions } from '../definition/IServiceProviderOptions';

/**
 * Fetch SAML provider configs for given 'provider'.
 */
function getSamlServiceProviderOptions(provider: string): IServiceProviderOptions {
	if (!provider) {
		throw new Meteor.Error('no-saml-provider', 'SAML internal error', {
			method: 'getSamlServiceProviderOptions',
		});
	}

	const providers = SAMLUtils.serviceProviders;

	const samlProvider = function(element: IServiceProviderOptions): boolean {
		return element.provider === provider;
	};

	return providers.filter(samlProvider)[0];
}

Meteor.methods({
	samlLogout(provider: string) {
		// Make sure the user is logged in before we initiate SAML Logout
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'samlLogout' });
		}
		const providerConfig = getSamlServiceProviderOptions(provider);

		SAMLUtils.log(`Logout request from ${ JSON.stringify(providerConfig) }`);
		// This query should respect upcoming array of SAML logins
		const user = Users.getSAMLByIdAndSAMLProvider(Meteor.userId(), provider);
		if (!user || !user.services || !user.services.saml) {
			return;
		}

		// We store a nameID and an idpSession on the user object, but for some reason we use the idpSession for both attributes here
		// I wonder if this is an error, but I'm afraid to change it and break things for everyone.
		// let { nameID } = user.services.saml;
		const sessionIndex = user.services.saml.idpSession;
		const nameID = sessionIndex;

		SAMLUtils.log(`NameID for user ${ Meteor.userId() } found: ${ JSON.stringify(nameID) }`);

		const _saml = new SAMLServiceProvider(providerConfig);

		const request = _saml.generateLogoutRequest({
			nameID,
			sessionIndex,
		});

		// request.request: actual XML SAML Request
		// request.id: comminucation id which will be mentioned in the ResponseTo field of SAMLResponse

		Users.setSamlInResponseTo(Meteor.userId(), request.id);

		const _syncRequestToUrl = Meteor.wrapAsync(_saml.requestToUrl, _saml);
		const result = _syncRequestToUrl(request.request, 'logout');
		SAMLUtils.log(`SAML Logout Request ${ result }`);

		return result;
	},
});
