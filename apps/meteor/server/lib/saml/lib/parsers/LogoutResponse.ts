import xmldom from '@xmldom/xmldom';

import type { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';
import type { SAMLRedirectEnvelope } from '../../definition/SAMLEnvelope';
import type { ILogoutResponseValidateCallback } from '../../definition/callbacks';
import { SAMLUtils } from '../Utils';
import { validateRedirectSignature } from '../signature/validateRedirectSignature';

export class LogoutResponseParser {
	serviceProviderOptions: IServiceProviderOptions;

	constructor(serviceProviderOptions: IServiceProviderOptions) {
		this.serviceProviderOptions = serviceProviderOptions;
	}

	public async validate(envelope: SAMLRedirectEnvelope<'SAMLResponse'>, callback: ILogoutResponseValidateCallback): Promise<void> {
		const { decodedDocument: xmlString } = envelope;

		SAMLUtils.log({ msg: 'Validating SAML Logout Response', xmlString });

		if (!this.verifySignature(envelope)) {
			SAMLUtils.log({ msg: 'Failed to verify signature from Logout Response' });
			return callback('Signature validation failed');
		}

		const doc = new xmldom.DOMParser().parseFromString(xmlString, 'text/xml');
		if (!doc) {
			return callback('No Doc Found');
		}

		const response = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutResponse')[0];
		if (!response) {
			return callback('No Response Found', null);
		}

		// TBD. Check if this msg corresponds to one we sent
		let inResponseTo;
		try {
			inResponseTo = response.getAttribute('InResponseTo');
			SAMLUtils.log({ msg: `Found InResponseTo`, inResponseTo });
		} catch (err) {
			SAMLUtils.log({ err });
			const msg = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage');
			SAMLUtils.log(`Unexpected msg from IDP. Does your session still exist at IDP? Idp returned: \n ${msg}`);
		}

		if (!inResponseTo) {
			return callback('Unexpected Response from IDP', null);
		}

		const statusValidateObj = SAMLUtils.validateStatus(doc);
		if (!statusValidateObj.success) {
			return callback('Error. Logout not confirmed by IDP', null);
		}

		return callback(null, inResponseTo);
	}

	private verifySignature(envelope: SAMLRedirectEnvelope<'SAMLResponse'>): boolean {
		if (!this.serviceProviderOptions.validateLogoutResponseSignature) {
			return true;
		}

		return validateRedirectSignature(envelope, this.serviceProviderOptions.cert);
	}
}
