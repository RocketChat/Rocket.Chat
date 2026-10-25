export interface ILogoutRequestVariables extends Record<string, string> {
	newId: string;
	instant: string;
	idpSLORedirectURL: string;
	issuer: string;
	identifierFormat: string;
	nameID: string;
	sessionIndex: string;
}
