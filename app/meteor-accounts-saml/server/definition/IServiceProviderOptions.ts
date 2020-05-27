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
	roleAttributeSync: boolean;
	allowedClockDrift: number;
	signatureValidationType: string;
	identifierFormat: string;
	nameIDPolicyTemplate: string;
	authnContextTemplate: string;
	authRequestTemplate: string;
	logoutResponseTemplate: string;
	logoutRequestTemplate: string;
}
