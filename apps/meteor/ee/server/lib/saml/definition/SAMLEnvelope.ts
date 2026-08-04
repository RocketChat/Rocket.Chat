// Other binding values are not supported: HTTP-Artifact, URI, SOAP, PAOS
export type SAMLBinding = 'HTTP-Redirect' | 'HTTP-POST';

export type SAMLDocumentType = 'SAMLRequest' | 'SAMLResponse';

export type SAMLBaseEnvelope<T extends SAMLDocumentType = SAMLDocumentType> = {
	binding: SAMLBinding;
	/**
	 * encodedDocument is the document in the exact format we received it
	 * */
	encodedDocument: string;
	/**
	 * decodedDocument is the raw XML file; processed according to the binding specification
	 * */
	decodedDocument: string;
	type: T;
	relayState?: string;
};

/**
 * HTTP-Redirect envelope
 * For this binding, the document must be a Deflated XML file that is then base64 encoded
 **/
export type SAMLRedirectEnvelope<T extends SAMLDocumentType = SAMLDocumentType> = SAMLBaseEnvelope<T> & {
	binding: 'HTTP-Redirect';
	sigAlg?: string;
	signature?: string;

	/**
	 * signedContent is the complete string value that must be matched by the signature
	 * */
	signedContent?: string;
};

/**
 * HTTP-POST envelope
 * For this binding, the document must be a regular XML file that is base64 encoded
 **/
export type SAMLPOSTEnvelope<T extends SAMLDocumentType = SAMLDocumentType> = SAMLBaseEnvelope<T> & {
	binding: 'HTTP-POST';
};

export type SAMLEnvelope<T extends SAMLDocumentType = SAMLDocumentType> = SAMLRedirectEnvelope<T> | SAMLPOSTEnvelope<T>;
