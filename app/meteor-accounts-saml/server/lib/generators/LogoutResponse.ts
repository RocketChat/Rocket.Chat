import { SAMLUtils } from '../Utils';
import {
	defaultLogoutResponseTemplate,
	defaultIdentifierFormat,
} from '../constants';
import { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';

/*
	A Logout Response is used when the Identity Provider (IdP) sends us a Logout Request.
*/
export class LogoutResponse {
	static generate(serviceProviderOptions: IServiceProviderOptions, nameID: string, sessionIndex: string, inResponseToId: string): { id: string; response: string; inResponseToId: string } {
		const data = this.getDataForNewResponse(serviceProviderOptions, nameID, sessionIndex, inResponseToId);
		const response = SAMLUtils.fillTemplateData(serviceProviderOptions.logoutResponseTemplate || defaultLogoutResponseTemplate, data);

		SAMLUtils.log('------- SAML Logout response -----------');
		SAMLUtils.log(response);

		return {
			response,
			id: data.uniqueId,
			inResponseToId: data.inResponseToId,
		};
	}

	static getDataForNewResponse(serviceProviderOptions: IServiceProviderOptions, nameID: string, sessionIndex: string, inResponseToId: string): Record<string, any> {
		const id = `_${ SAMLUtils.generateUniqueID() }`;
		const instant = SAMLUtils.generateInstant();

		return {
			uniqueId: id,
			instant,
			idpSLORedirectURL: serviceProviderOptions.idpSLORedirectURL,
			issuer: serviceProviderOptions.issuer,
			identifierFormat: serviceProviderOptions.identifierFormat || defaultIdentifierFormat,
			nameID,
			sessionIndex,
			inResponseToId,
		};
	}
}
