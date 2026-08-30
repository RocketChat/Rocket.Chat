declare module 'meteor/facebook-oauth' {
	export const Facebook: {
		requestCredential: (
			options: Record<string, any>,
			callback: (credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
		) => void;
	};
}
