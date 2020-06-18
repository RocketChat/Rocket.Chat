import { SAMLUtils } from '../Utils';
import {
	defaultIdentifierFormat,
	defaultAuthnContext,
	defaultAuthRequestTemplate,
	defaultNameIDTemplate,
	defaultAuthnContextTemplate,
} from '../constants';
import { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';

/*
	An Authorize Request is used to show the Identity Provider login form when the user clicks on the Rocket.Chat SAML login button
*/
export class AuthorizeRequest {
	static generate(serviceProviderOptions: IServiceProviderOptions): { id: string; request: string } {
		const data = this.getDataForNewRequest(serviceProviderOptions);
		const request = SAMLUtils.fillTemplateData(this.authorizeRequestTemplate(serviceProviderOptions), data);

		return {
			request,
			id: data.newId,
		};
	}

	// The AuthorizeRequest template is split into three parts
	// This way, users don't need to change the template when all they want to do is remove the NameID Policy or the AuthnContext.
	// This also ensures compatibility with providers that were configured before the templates existed.
	static authorizeRequestTemplate(serviceProviderOptions: IServiceProviderOptions): string {
		const data = {
			identifierFormatTag: this.identifierFormatTagTemplate(serviceProviderOptions),
			authnContextTag: this.authnContextTagTemplate(serviceProviderOptions),
		};

		const template = serviceProviderOptions.authRequestTemplate || defaultAuthRequestTemplate;
		return SAMLUtils.fillTemplateData(template, data);
	}

	static identifierFormatTagTemplate(serviceProviderOptions: IServiceProviderOptions): string {
		if (!serviceProviderOptions.identifierFormat) {
			return '';
		}

		return serviceProviderOptions.nameIDPolicyTemplate || defaultNameIDTemplate;
	}

	static authnContextTagTemplate(serviceProviderOptions: IServiceProviderOptions): string {
		if (!serviceProviderOptions.customAuthnContext) {
			return '';
		}

		return serviceProviderOptions.authnContextTemplate || defaultAuthnContextTemplate;
	}

	static getDataForNewRequest(serviceProviderOptions: IServiceProviderOptions): Record<string, string> {
		let id = `_${ SAMLUtils.generateUniqueID() }`;
		const instant = SAMLUtils.generateInstant();

		// Post-auth destination
		if (serviceProviderOptions.id) {
			id = serviceProviderOptions.id;
		}

		return {
			newId: id,
			instant,
			callbackUrl: serviceProviderOptions.callbackUrl,
			entryPoint: serviceProviderOptions.entryPoint,
			issuer: serviceProviderOptions.issuer,
			identifierFormat: serviceProviderOptions.identifierFormat || defaultIdentifierFormat,
			authnContextComparison: serviceProviderOptions.authnContextComparison || 'exact',
			authnContext: serviceProviderOptions.customAuthnContext || defaultAuthnContext,
		};
	}
}
