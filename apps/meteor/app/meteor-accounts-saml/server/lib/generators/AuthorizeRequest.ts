import type { IAuthorizeRequestVariables } from '../../definition/IAuthorizeRequestVariables';
import type { ISAMLRequest } from '../../definition/ISAMLRequest';
import type { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';
import { SAMLUtils } from '../Utils';
import {
	defaultIdentifierFormat,
	defaultAuthnContext,
	defaultAuthRequestTemplate,
	defaultNameIDTemplate,
	defaultAuthnContextTemplate,
} from '../constants';

/*
	An Authorize Request is used to show the Identity Provider login form when the user clicks on the Rocket.Chat SAML login button
*/
export class AuthorizeRequest {
	public static generate(serviceProviderOptions: IServiceProviderOptions, credentialToken: string): ISAMLRequest {
		const data = this.getDataForNewRequest(serviceProviderOptions, credentialToken);
		const request = SAMLUtils.fillTemplateData(this.authorizeRequestTemplate(serviceProviderOptions), data);

		return {
			request,
			id: data.newId,
		};
	}

	// The AuthorizeRequest template is split into three parts
	// This way, users don't need to change the template when all they want to do is remove the NameID Policy or the AuthnContext.
	// This also ensures compatibility with providers that were configured before the templates existed.
	private static authorizeRequestTemplate(serviceProviderOptions: IServiceProviderOptions): string {
		const data = {
			identifierFormatTag: this.identifierFormatTagTemplate(serviceProviderOptions),
			authnContextTag: this.authnContextTagTemplate(serviceProviderOptions),
		};

		const template = serviceProviderOptions.authRequestTemplate || defaultAuthRequestTemplate;
		return SAMLUtils.fillTemplateData(template, data);
	}

	private static identifierFormatTagTemplate(serviceProviderOptions: IServiceProviderOptions): string {
		if (!serviceProviderOptions.identifierFormat) {
			return '';
		}

		return serviceProviderOptions.nameIDPolicyTemplate || defaultNameIDTemplate;
	}

	private static authnContextTagTemplate(serviceProviderOptions: IServiceProviderOptions): string {
		if (!serviceProviderOptions.customAuthnContext) {
			return '';
		}

		return serviceProviderOptions.authnContextTemplate || defaultAuthnContextTemplate;
	}

	private static getDataForNewRequest(
		serviceProviderOptions: IServiceProviderOptions,
		credentialToken?: string,
	): IAuthorizeRequestVariables {
		const id = credentialToken || `_${SAMLUtils.generateUniqueID()}`;
		const instant = SAMLUtils.generateInstant();

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
