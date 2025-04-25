import type { Meteor } from 'meteor/meteor';

export type RequestCredentialOptions = Meteor.LoginWithExternalServiceOptions;
export type RequestCredentialCallback = (credentialTokenOrError?: string | Error) => void;

// Receives a function that accepts an options object and an optional callback
// Returns the same function but with the signature changed to also accept only the callback
// With this, you can make a function that accepts the arguments in any way that Meteor's login handlers may send them, without having to validate the params or mess with the signature types
export function wrapLoginHandlerFn(
	loginHandlerFn: (options: RequestCredentialOptions, callback?: RequestCredentialCallback) => Promise<void> | void,
) {
	return (options?: RequestCredentialOptions | RequestCredentialCallback, callback?: RequestCredentialCallback) => {
		if (!callback && typeof options === 'function') {
			return loginHandlerFn({}, options);
		}

		return loginHandlerFn(options as RequestCredentialOptions, callback);
	};
}
