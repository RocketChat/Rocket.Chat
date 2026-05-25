import type {
	SAMLDocumentType,
	SAMLPOSTEnvelope,
	SAMLRedirectEnvelope,
} from '../../../../app/meteor-accounts-saml/server/definition/SAMLEnvelope';

export function makeLogoutEnvelope<T extends SAMLDocumentType>(
	type: T,
	xml: string,
	signedContent?: string,
	signature?: string,
): SAMLRedirectEnvelope<T> {
	return {
		binding: 'HTTP-Redirect',
		encodedDocument: xml,
		decodedDocument: xml,
		type,
		relayState: 'relayState',
		...(signedContent && { signedContent }),
		...(signature && {
			signature,
			sigAlg: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
		}),
	};
}

export function makeLogoutRequestEnvelope(xml: string, signedContent?: string, signature?: string) {
	return makeLogoutEnvelope('SAMLRequest', xml, signedContent, signature);
}

export function makeLogoutResponseEnvelope(xml: string, signedContent?: string, signature?: string) {
	return makeLogoutEnvelope('SAMLResponse', xml, signedContent, signature);
}

export function makeLoginEnvelope<T extends SAMLDocumentType>(type: T, xml: string): SAMLPOSTEnvelope<T> {
	return {
		binding: 'HTTP-POST',
		encodedDocument: xml,
		decodedDocument: xml,
		type,
		relayState: 'relayState',
	};
}

export function makeLoginResponseEnvelope(xml: string) {
	return makeLoginEnvelope('SAMLResponse', xml);
}
