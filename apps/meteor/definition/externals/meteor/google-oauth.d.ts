declare module 'meteor/google-oauth' {
	export const Google: {
		requestCredential: (
			options: Record<string, any>,
			callback: (credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
		) => void;
	};
}
