declare module 'meteor/google-oauth' {
	export const Google: {
		readonly name: string;
		readonly whitelistedFields: string[];
		requestCredential(
			options: Meteor.LoginWithExternalServiceOptions | undefined,
			credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void,
		): void;
		signIn?(
			options: Meteor.LoginWithExternalServiceOptions | undefined,
			callback?: (error: LoginError | undefined, result?: unknown) => void,
		): void;
	};
}
