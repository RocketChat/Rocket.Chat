declare module 'meteor/service-configuration' {
	interface Configuration {
		appId: string;
		secret: string;
		service: string;

		buttonLabelText?: string;

		clientConfig: unknown;
		clientId?: string;
	}
}
