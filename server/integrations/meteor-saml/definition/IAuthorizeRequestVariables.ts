export interface IAuthorizeRequestVariables extends Record<string, string> {
	newId: string;
	instant: string;
	callbackUrl: string;
	entryPoint: string;
	issuer: string;
	identifierFormat: string;
	authnContextComparison: string;
	authnContext: string;
}
