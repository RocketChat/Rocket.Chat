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
	roleAttributeName: string;
	signatureValidationType: string;
	callbackUrl: string;

	// The id attribute is filled midway through some operations
	id?: string;
}
