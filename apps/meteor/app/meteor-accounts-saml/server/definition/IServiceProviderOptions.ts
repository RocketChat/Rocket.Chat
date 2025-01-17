export interface IServiceProviderOptions {
	provider: string;
	entryPoint: string;
	idpSLORedirectURL: string;
	issuer: string;
	cert: string;
	privateCert: string;
	privateKey: string;
	customAuthnContext: string;
	authnContextComparison: string;
	defaultUserRole: string;
	allowedClockDrift: number;
	signatureValidationType: string;
	identifierFormat: string;
	nameIDPolicyTemplate: string;
	authnContextTemplate: string;
	authRequestTemplate: string;
	logoutResponseTemplate: string;
	logoutRequestTemplate: string;
	metadataCertificateTemplate: string;
	metadataTemplate: string;
	callbackUrl: string;
}
