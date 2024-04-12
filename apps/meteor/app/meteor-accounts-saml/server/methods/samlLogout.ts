import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import type { IServiceProviderOptions } from '../definition/IServiceProviderOptions';
import { SAMLServiceProvider } from '../lib/ServiceProvider';
import { SAMLUtils } from '../lib/Utils';

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

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		samlLogout(provider: string): string | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async samlLogout(provider: string) {
		const userId = Meteor.userId();
		// Make sure the user is logged in before we initiate SAML Logout
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'samlLogout' });
		}
		const providerConfig = getSamlServiceProviderOptions(provider);

		SAMLUtils.log({ msg: 'Logout request', providerConfig });
		// This query should respect upcoming array of SAML logins
		const user = await Users.getSAMLByIdAndSAMLProvider(userId, provider);
		if (!user?.services?.saml) {
			return;
		}

		const { nameID, idpSession } = user.services.saml;
		SAMLUtils.log({ msg: `NameID for user ${Meteor.userId()} found`, nameID });

		const _saml = new SAMLServiceProvider(providerConfig);

		if (!nameID || !idpSession) {
			SAMLUtils.log({ msg: 'No NameID or idpSession found for user', userId });
			return;
		}

		const request = _saml.generateLogoutRequest({
			nameID: nameID || idpSession,
			sessionIndex: idpSession,
		});

		SAMLUtils.log('----Logout Request----');
		SAMLUtils.log(request);

		// request.request: actual XML SAML Request
		// request.id: comminucation id which will be mentioned in the ResponseTo field of SAMLResponse

		await Users.setSamlInResponseTo(userId, request.id);

		const result = await _saml.requestToUrl(request.request, 'logout');
		SAMLUtils.log(`SAML Logout Request ${result}`);

		return result;
	},
});
