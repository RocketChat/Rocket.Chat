import xmldom from 'xmldom';

import {
	SAMLUtils,
} from '../Utils';
import { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';

export class LogoutRequestParser {
	constructor(serviceProviderOptions: IServiceProviderOptions) {
		this.serviceProviderOptions = serviceProviderOptions;
	}

	validate(xmlString: string, callback: (err: object, data?: object) => void): void {
		SAMLUtils.log(`LogoutRequest: ${ xmlString }`);

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

			return callback(null, { idpSession, nameID });
		} catch (e) {
			console.error(e);
			SAMLUtils.log(`Caught error: ${ e }`);

			const msg = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage');
			SAMLUtils.log(`Unexpected msg from IDP. Does your session still exist at IDP? Idp returned: \n ${ msg }`);

			return callback(e, null);
		}
	}
}
