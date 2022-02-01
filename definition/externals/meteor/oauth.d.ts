declare module 'meteor/oauth' {
	namespace OAuth {
		function _redirectUri(serviceName: string, config: any, params: any, absoluteUrlOptions: any): string;
		function _retrieveCredentialSecret(credentialToken: string): string | null;
		const _storageTokenPrefix: string;
	}
}
