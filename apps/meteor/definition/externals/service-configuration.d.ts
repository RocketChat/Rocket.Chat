declare module 'meteor/service-configuration' {
	interface Configuration {
		appId: string;
		secret: string;
		service: string;

		buttonLabelText?: string;

		clientConfig: unknown;
	}
}

declare module 'meteor' {
	interface Configuration {
		appId: string;
		secret: string;
	}
	const ServiceConfiguration: {
		configurations: Mongo.Collection<Configuration>;
	};
}
