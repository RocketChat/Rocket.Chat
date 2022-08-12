import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models/server';
import { SAMLServiceProvider } from '../lib/ServiceProvider';
import { SAMLUtils } from '../lib/Utils';
import type { IServiceProviderOptions } from '../definition/IServiceProviderOptions';

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

	const samlProvider = function (element: IServiceProviderOptions): boolean {
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

		SAMLUtils.log({ msg: 'Logout request', providerConfig });
		// This query should respect upcoming array of SAML logins
		const user = Users.getSAMLByIdAndSAMLProvider(Meteor.userId(), provider);
		if (!user || !user.services || !user.services.saml) {
			return;
		}

		const { nameID, idpSession } = user.services.saml;
		SAMLUtils.log({ msg: `NameID for user ${Meteor.userId()} found`, nameID });

		const _saml = new SAMLServiceProvider(providerConfig);

		const request = _saml.generateLogoutRequest({
			nameID: nameID || idpSession,
			sessionIndex: idpSession,
		});

		SAMLUtils.log('----Logout Request----');
		SAMLUtils.log(request);

		// request.request: actual XML SAML Request
		// request.id: comminucation id which will be mentioned in the ResponseTo field of SAMLResponse

		Users.setSamlInResponseTo(Meteor.userId(), request.id);

		const result = _saml.syncRequestToUrl(request.request, 'logout');
		SAMLUtils.log(`SAML Logout Request ${result}`);

		return result;
	},
});
