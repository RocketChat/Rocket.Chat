declare module 'meteor/twitter-oauth' {
	export const Twitter: {
		validParamsAuthenticate: readonly string[];
		requestCredential: (
			options: Record<string, any>,
			callback: (credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
		) => void;
	};
}
