declare module 'meteor/meteor-developer-oauth' {
	export const MeteorDeveloperAccounts: {
		requestCredential: (
			options: Record<string, any>,
			callback: (credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => void,
		) => void;
	};
}
