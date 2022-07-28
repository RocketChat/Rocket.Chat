import { SAMLUtils } from '../Utils';
import { defaultIdentifierFormat, defaultLogoutRequestTemplate } from '../constants';
import { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';
import { ISAMLRequest } from '../../definition/ISAMLRequest';
import { ILogoutRequestVariables } from '../../definition/ILogoutRequestVariables';

/*
	A Logout Request is used when the user is logged out of Rocket.Chat and the Service Provider is configured to also logout from the Identity Provider.
*/
export class LogoutRequest {
	static generate(serviceProviderOptions: IServiceProviderOptions, nameID: string, sessionIndex: string): ISAMLRequest {
		const data = this.getDataForNewRequest(serviceProviderOptions, nameID, sessionIndex);
		const request = SAMLUtils.fillTemplateData(serviceProviderOptions.logoutRequestTemplate || defaultLogoutRequestTemplate, data);

		SAMLUtils.log('------- SAML Logout request -----------');
		SAMLUtils.log(request);

		return {
			request,
			id: data.newId,
		};
	}

	static getDataForNewRequest(
		serviceProviderOptions: IServiceProviderOptions,
		nameID: string,
		sessionIndex: string,
	): ILogoutRequestVariables {
		// nameId: <nameId as submitted during SAML SSO>
		// sessionIndex: sessionIndex
		// --- NO SAMLsettings: <Meteor.setting.saml  entry for the provider you want to SLO from

		const id = `_${SAMLUtils.generateUniqueID()}`;
		const instant = SAMLUtils.generateInstant();

		return {
			newId: id,
			instant,
			idpSLORedirectURL: serviceProviderOptions.idpSLORedirectURL,
			issuer: serviceProviderOptions.issuer,
			identifierFormat: serviceProviderOptions.identifierFormat || defaultIdentifierFormat,
			nameID,
			sessionIndex,
		};
	}
}
