declare module 'meteor/oauth' {
	namespace OAuth {
		function _redirectUri(serviceName: string, config: any, params: any, absoluteUrlOptions: any): string;
	}
}
