declare module 'meteor/service-configuration' {
	import type { Mongo } from 'meteor/mongo';

	interface Configuration {
		appId: string;
		secret: string;
		service: string;

		buttonLabelText?: string;
		buttonLabelColor?: string;
		buttonColor?: string;

		clientConfig: unknown;
		clientId?: string;
		loginStyle?: string;
	}

	namespace ServiceConfiguration {
		class ConfigError extends Error {}

		const configurations: Mongo.Collection<Configuration>;
	}
}
