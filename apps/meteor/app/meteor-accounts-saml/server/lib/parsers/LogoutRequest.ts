import xmldom from '@xmldom/xmldom';

import { SAMLUtils } from '../Utils';
import type { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';
import type { ILogoutRequestValidateCallback } from '../../definition/callbacks';

export class LogoutRequestParser {
	serviceProviderOptions: IServiceProviderOptions;

	constructor(serviceProviderOptions: IServiceProviderOptions) {
		this.serviceProviderOptions = serviceProviderOptions;
	}

	public validate(xmlString: string, callback: ILogoutRequestValidateCallback): void {
		SAMLUtils.log(`LogoutRequest: ${xmlString}`);

		const doc = new xmldom.DOMParser().parseFromString(xmlString, 'text/xml');
		if (!doc) {
			return callback('No Doc Found');
		}

		const request = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutRequest')[0];
		if (!request) {
			return callback('No Request Found');
		}

		try {
			const sessionNode = request.getElementsByTagNameNS('*', 'SessionIndex')[0];
			const nameIdNode = request.getElementsByTagNameNS('*', 'NameID')[0];

			if (!nameIdNode) {
				throw new Error('SAML Logout Request: No NameID node found');
			}

			const idpSession = sessionNode.childNodes[0].nodeValue;
			const nameID = nameIdNode.childNodes[0].nodeValue;
			const id = request.getAttribute('ID');

			return callback(null, { idpSession, nameID, id });
		} catch (e) {
			SAMLUtils.error(e);
			SAMLUtils.log(`Caught error: ${e}`);

			const msg = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage');
			SAMLUtils.log(`Unexpected msg from IDP. Does your session still exist at IDP? Idp returned: \n ${msg}`);

			return callback(e instanceof Error ? e : String(e), null);
		}
	}
}
