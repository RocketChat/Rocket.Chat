import crypto from 'node:crypto';

import type { SAMLRedirectEnvelope } from '../../definition/SAMLEnvelope';
import { SAMLUtils } from '../Utils';
import { getSigAlgKeyByURI } from './signatureAlgorithms';

export function validateRedirectSignature(envelope: SAMLRedirectEnvelope, certificate: string): boolean {
	try {
		if (!envelope.sigAlg || !envelope.signature) {
			SAMLUtils.log({ msg: 'Could not validate SAML Document Signature: Missing Signature params', type: envelope.type });
			return false;
		}

		if (!envelope.signedContent) {
			SAMLUtils.log({ msg: 'Could not validate SAML Document signature: signedContent is empty', type: envelope.type });
			return false;
		}

		const algorithm = getSigAlgKeyByURI(envelope.sigAlg);
		if (!algorithm) {
			SAMLUtils.log({ msg: 'Could not validate SAML Document signature: invalid algorithm', type: envelope.type });
			return false;
		}

		const cert = SAMLUtils.certToPEM(certificate);

		SAMLUtils.log({
			msg: 'Verifying Signatures for SAML Document',
			algorithm,
			cert,
			type: envelope.type,
		});
		const verifier = crypto.createVerify(algorithm);

		verifier.update(envelope.signedContent, 'utf8');
		verifier.end();

		return verifier.verify(cert, envelope.signature, 'base64');
	} catch (err) {
		SAMLUtils.error({ msg: 'Failed to validate SAML Document Signature', err });
	}

	return false;
}
