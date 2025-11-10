import type { OAuthConfiguration, OauthConfig } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { capitalize } from '@rocket.chat/string-helpers';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { isURL } from '../../../lib/utils/isURL';
import type { IOAuthProvider } from '../../definitions/IOAuthProvider';
import { createOAuthTotpLoginMethod } from '../../meteor/login/oauth';
import { overrideLoginMethod, type LoginCallback } from '../2fa/overrideLoginMethod';
import { loginServices } from '../loginServices';
import { CustomOAuthError } from './CustomOAuthError';

const configuredOAuthServices = new Map<string, CustomOAuth>();

export class CustomOAuth<TServiceName extends string = string> implements IOAuthProvider {
	public serverURL: string;

	public authorizePath: string;

	public scope: string;

	public responseType: string;

	constructor(
		public readonly name: TServiceName,
		options: Readonly<OauthConfig>,
	) {
		this.configure(options);

		Accounts.oauth.registerService(this.name);

		this.configureLogin();
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

		if (!isURL(this.authorizePath)) {
			this.authorizePath = this.serverURL + this.authorizePath;
		}
	}

	configureLogin() {
		const loginWithService = `loginWith${capitalize(this.name) as Capitalize<TServiceName>}` as const;

		const loginWithOAuthTokenAndTOTP = createOAuthTotpLoginMethod(this);

		const loginWithOAuthToken = async (options?: Meteor.LoginWithExternalServiceOptions, callback?: LoginCallback) => {
			const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
			await this.requestCredential(options, credentialRequestCompleteCallback);
		};

		(Meteor as any)[loginWithService] = (options: Meteor.LoginWithExternalServiceOptions, callback: LoginCallback) => {
			overrideLoginMethod(loginWithOAuthToken, [options], callback, loginWithOAuthTokenAndTOTP);
		};
	}

	async requestCredential(
		options: Meteor.LoginWithExternalServiceOptions = {},
		credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void,
	) {
		const config = await loginServices.loadLoginService<OAuthConfiguration>(this.name);
		if (!config) {
			if (credentialRequestCompleteCallback) {
				credentialRequestCompleteCallback(new Accounts.ConfigError());
			}
			return;
		}

		const credentialToken = Random.secret();
		const loginStyle = OAuth._loginStyle(this.name, config);

		const separator = this.authorizePath.indexOf('?') !== -1 ? '&' : '?';

		const loginUrl =
			`${this.authorizePath}${separator}client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
				OAuth._redirectUri(this.name, config),
			)}&response_type=${encodeURIComponent(this.responseType)}` +
			`&state=${encodeURIComponent(OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl))}&scope=${encodeURIComponent(
				this.scope,
			)}`;

		OAuth.launchLogin({
			loginService: this.name,
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
			popupOptions: {
				width: 900,
				height: 450,
			},
		});
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

		// If we don't have a reference to the instance for this service and it was already registered on meteor,
		// then there's nothing we can do to update it
		if (Accounts.oauth.serviceNames().includes(serviceName)) {
			throw new CustomOAuthError('service already registered, skipping new configuration', { service: serviceName });
		}

		const instance = new CustomOAuth(serviceName, options);
		configuredOAuthServices.set(serviceName, instance);
		return instance;
	}

	static configureCustomOAuthService<TServiceName extends string = string>(
		serviceName: TServiceName,
		options: Readonly<OauthConfig>,
	): CustomOAuth<TServiceName> | undefined {
		// Custom OAuth services are configured based on the login service list, so if this ends up being called multiple times, simply ignore it
		// Non-Custom OAuth services are configured based on code, so if configureOAuthService is called multiple times for them, it's a bug and it should throw.
		try {
			return this.configureOAuthService(serviceName, options);
		} catch (e) {
			console.error(e);
		}
	}
}
