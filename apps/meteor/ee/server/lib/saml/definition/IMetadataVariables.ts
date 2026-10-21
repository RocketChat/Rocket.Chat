export interface IMetadataVariables extends Record<string, string> {
	issuer: string;
	certificate: string;
	identifierFormat: string;
	callbackUrl: string;
	sloLocation: string;
}
