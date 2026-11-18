import xmldom from '@xmldom/xmldom';

import type { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';
import type { SAMLRedirectEnvelope } from '../../definition/SAMLEnvelope';
import type { ILogoutRequestValidateCallback } from '../../definition/callbacks';
import { SAMLUtils } from '../Utils';
import { validateRedirectSignature } from '../signature/validateRedirectSignature';

export class LogoutRequestParser {
	serviceProviderOptions: IServiceProviderOptions;

	constructor(serviceProviderOptions: IServiceProviderOptions) {
		this.serviceProviderOptions = serviceProviderOptions;
	}

	public async validate(envelope: SAMLRedirectEnvelope<'SAMLRequest'>, callback: ILogoutRequestValidateCallback): Promise<void> {
		const { decodedDocument: xmlString } = envelope;

		SAMLUtils.log({ msg: 'Validating SAML Logout Request', xmlString });

		if (!this.verifySignature(envelope)) {
			SAMLUtils.log({ msg: 'Failed to verify signature from Logout Request' });
			return callback('Signature validation failed');
		}

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
		} catch (err) {
			SAMLUtils.error({ err });

			const statusMessage = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage');
			SAMLUtils.log({ msg: `Unexpected msg from IDP. Does your session still exist at IDP?`, statusMessage });

			return callback(err instanceof Error ? err : String(err), null);
		}
	}

	private verifySignature(envelope: SAMLRedirectEnvelope<'SAMLRequest'>): boolean {
		if (!this.serviceProviderOptions.validateLogoutRequestSignature) {
			return true;
		}

		return validateRedirectSignature(envelope, this.serviceProviderOptions.cert);
	}
}
