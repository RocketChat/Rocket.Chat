import { SAMLUtils } from '../Utils';
import { defaultLogoutResponseTemplate, defaultIdentifierFormat } from '../constants';
import { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';
import { ILogoutResponse } from '../../definition/ILogoutResponse';
import { ILogoutResponseVariables } from '../../definition/ILogoutResponseVariables';

/*
	A Logout Response is used when the Identity Provider (IdP) sends us a Logout Request.
*/
export class LogoutResponse {
	public static generate(
		serviceProviderOptions: IServiceProviderOptions,
		nameID: string,
		sessionIndex: string,
		inResponseToId: string,
	): ILogoutResponse {
		const data = this.getDataForNewResponse(serviceProviderOptions, nameID, sessionIndex, inResponseToId);
		const response = SAMLUtils.fillTemplateData(serviceProviderOptions.logoutResponseTemplate || defaultLogoutResponseTemplate, data);

		SAMLUtils.log('------- SAML Logout response -----------');
		SAMLUtils.log(response);

		return {
			response,
			id: data.newId,
			inResponseToId: data.inResponseToId,
		};
	}

	private static getDataForNewResponse(
		serviceProviderOptions: IServiceProviderOptions,
		nameID: string,
		sessionIndex: string,
		inResponseToId: string,
	): ILogoutResponseVariables {
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
			inResponseToId,
		};
	}
}
