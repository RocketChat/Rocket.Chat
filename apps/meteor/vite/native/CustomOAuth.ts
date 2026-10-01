// Vite-build stand-in for client/lib/customOAuth/CustomOAuth.ts. It keeps the
// configuration API so the OAuth hooks mount, but the popup/redirect flow
// still lives in Meteor's oauth packages, so logging in through it fails.
import type { OauthConfig } from '@rocket.chat/core-typings';
import { capitalize, isAbsoluteURL } from '@rocket.chat/tools';

import type { IOAuthProvider, LoginWithExternalServiceOptions } from '../../client/definitions/IOAuthProvider';
import type { LoginCallback } from '../../client/lib/2fa/overrideLoginMethod';
import { CustomOAuthError } from '../../client/lib/customOAuth/CustomOAuthError';
import { registerLoginWithMethod } from '../../client/meteor/accounts';

const configuredOAuthServices = new Map<string, CustomOAuth>();

export class CustomOAuth<TServiceName extends string = string> implements IOAuthProvider {
	public serverURL = '';

	public authorizePath = '';

	public scope = '';

	public responseType = '';

	constructor(
		public readonly name: TServiceName,
		options: Readonly<OauthConfig>,
	) {
		this.configure(options);

		registerLoginWithMethod(`loginWith${capitalize(this.name)}`, (_options: LoginWithExternalServiceOptions, callback?: LoginCallback) => {
			callback?.(new CustomOAuthError('OAuth login is not available in the Vite build yet', { service: this.name }));
		});
	}

	configure(options: Readonly<OauthConfig>) {
		if (typeof options !== 'object' || !options) {
			throw new CustomOAuthError('options is required and must be object');
		}

		if (typeof options.serverURL !== 'string') {
			throw new CustomOAuthError('options.serverURL is required and must be string');
		}

		this.serverURL = options.serverURL;
		this.authorizePath = options.authorizePath ?? '/oauth/authorize';
		this.scope = options.scope ?? 'openid';
		this.responseType = options.responseType || 'code';

		if (!isAbsoluteURL(this.authorizePath)) {
			this.authorizePath = this.serverURL + this.authorizePath;
		}
	}

	requestCredential(
		_options: LoginWithExternalServiceOptions | undefined,
		credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void,
	) {
		credentialRequestCompleteCallback(new CustomOAuthError('OAuth login is not available in the Vite build yet', { service: this.name }));
	}

	static configureOAuthService<TServiceName extends string = string>(
		serviceName: TServiceName,
		options: Readonly<OauthConfig>,
	): CustomOAuth<TServiceName> {
		const existingInstance = configuredOAuthServices.get(serviceName);
		if (existingInstance) {
			existingInstance.configure(options);
			return existingInstance as CustomOAuth<TServiceName>;
		}

		const instance = new CustomOAuth(serviceName, options);
		configuredOAuthServices.set(serviceName, instance);
		return instance;
	}

	static configureCustomOAuthService<TServiceName extends string = string>(
		serviceName: TServiceName,
		options: Readonly<OauthConfig>,
	): CustomOAuth<TServiceName> | undefined {
		try {
			return this.configureOAuthService(serviceName, options);
		} catch (e) {
			console.error(e);
		}
	}
}
