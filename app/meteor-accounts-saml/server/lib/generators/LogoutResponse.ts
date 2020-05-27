import {
	SAMLUtils,
	defaultLogoutResponseTemplate,
} from '../Utils';
import { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';

/*
	A Logout Response is used when the Identity Provider (IdP) sends us a Logout Request.
*/
export class LogoutResponse {
	static generate(serviceProviderOptions: IServiceProviderOptions): { id: string; response: string } {
		const data = this.getDataForNewResponse(serviceProviderOptions);
		const response = SAMLUtils.fillTemplateData(serviceProviderOptions.logoutResponseTemplate || defaultLogoutResponseTemplate, data);

		SAMLUtils.log('------- SAML Logout response -----------');
		SAMLUtils.log(response);

		return {
			response,
			id: data.uniqueId,
		};
	}

	static getDataForNewResponse(serviceProviderOptions: IServiceProviderOptions): Record<string, any> {
		const id = `_${ SAMLUtils.generateUniqueID() }`;
		const instant = SAMLUtils.generateInstant();

		return {
			uniqueId: id,
			instant,
			idpSLORedirectURL: serviceProviderOptions.idpSLORedirectURL,
			issuer: serviceProviderOptions.issuer,
		};
	}
}
