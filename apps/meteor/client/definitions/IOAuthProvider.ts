import type { Meteor } from 'meteor/meteor';

export interface IOAuthProvider {
	readonly name: string;
	requestCredential(
		options: Meteor.LoginWithExternalServiceOptions | undefined,
		credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void,
	): void;
}
