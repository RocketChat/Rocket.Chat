import { Accounts } from 'meteor/accounts-base';

import { createOAuthTotpLoginMethod } from './oauth';
import type { IOAuthProvider } from '../../definitions/IOAuthProvider';
import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { wrapLoginHandlerFn } from '../../lib/wrapLoginHandlerFn';

export const createOAuthLoginFn = (provider: IOAuthProvider) => {
	const loginHandler = wrapLoginHandlerFn((options, callback) => {
		const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
		provider.requestCredential(options, credentialRequestCompleteCallback);
	});

	Accounts.oauth.registerService(provider.name);
	Accounts.registerClientLoginFunction(provider.name, loginHandler);

	const loginWithProvider = (options: Meteor.LoginWithExternalServiceOptions | undefined, cb: LoginCallback) =>
		Accounts.applyLoginFunction(provider.name, [options, cb]);

	const loginWithProviderAndTOTP = createOAuthTotpLoginMethod(provider);

	return (options: Meteor.LoginWithExternalServiceOptions | undefined, callback?: LoginCallback) => {
		overrideLoginMethod(loginWithProvider, [options], callback, loginWithProviderAndTOTP);
	};
};
