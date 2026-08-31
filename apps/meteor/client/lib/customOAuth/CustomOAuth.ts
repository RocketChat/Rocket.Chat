import type { OAuthConfiguration, OauthConfig } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { capitalize, isAbsoluteURL } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { CustomOAuthError } from './CustomOAuthError';
import type { IOAuthProvider, LoginWithExternalServiceOptions } from '../../definitions/IOAuthProvider';
import { launchLogin, getLoginStyle, redirectUri, stateParam, createOAuthLoginFunctionForMeteor } from '../../meteor/login/oauth';
import { loginServices } from '../loginServices';

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

		if (!isAbsoluteURL(this.authorizePath)) {
			this.authorizePath = this.serverURL + this.authorizePath;
		}
	}

	configureLogin() {
		const loginWithOAuthTokenForMeteor = createOAuthLoginFunctionForMeteor(this.requestCredential.bind(this));

		Object.assign(Meteor, { [`loginWith${capitalize(this.name)}` as const]: loginWithOAuthTokenForMeteor });
	}

	async requestCredential(
		options: LoginWithExternalServiceOptions = {},
		credentialRequestCompleteCallback: (credentialTokenOrError?: string | Error) => void,
	) {
		try {
			const config = await loginServices.loadLoginService<OAuthConfiguration>(this.name);
			if (!config) throw new Accounts.ConfigError();

			const credentialToken = Random.secret();
			const loginStyle = getLoginStyle(config);

			const loginUrl = new URL(this.authorizePath);
			loginUrl.searchParams.append('client_id', config.clientId);
			loginUrl.searchParams.append('redirect_uri', redirectUri(this.name, config));
			loginUrl.searchParams.append('response_type', this.responseType);
			loginUrl.searchParams.append('state', stateParam(loginStyle, credentialToken, options.redirectUrl));
			loginUrl.searchParams.append('scope', this.scope);

			launchLogin({
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
		} catch (error) {
			credentialRequestCompleteCallback?.(
				error instanceof Accounts.ConfigError ? error : new Accounts.ConfigError(undefined, { cause: error }),
			);
		}
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
