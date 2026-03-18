import { Logger } from '@rocket.chat/logger';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import OAuth2Strategy from 'passport-oauth2';
import type { VerifyCallback } from 'passport-oauth2';

import { normalizeIdentity } from './normalizers';
import type { CustomOAuthOptions, CustomOAuthProfile, NormalizedIdentity } from './types';

const logger = new Logger('CustomOAuthStrategy');

export interface CustomOAuthStrategyOptions extends CustomOAuthOptions {
	clientID: string;
	clientSecret: string;
	callbackURL: string;
}

type VerifyFunction = (
	accessToken: string,
	refreshToken: string,
	profile: CustomOAuthProfile,
	done: VerifyCallback,
) => void | Promise<void>;

interface OAuth2StrategyWithOAuth2 extends OAuth2Strategy {
	_oauth2: {
		useAuthorizationHeaderforGET(useIt: boolean): void;
	};
}

export class CustomOAuthStrategy extends OAuth2Strategy {
	public name: string;

	private readonly customOptions: CustomOAuthOptions;

	private readonly userAgent: string;

	constructor(name: string, options: CustomOAuthStrategyOptions, verify: VerifyFunction) {
		const serverURL = options.serverURL.replace(/\/$/, '');
		const tokenPath = options.tokenPath || '/oauth/token';
		const authorizePath = options.authorizePath || '/oauth/authorize';

		const tokenURL = CustomOAuthStrategy.buildURL(serverURL, tokenPath);
		const authorizationURL = CustomOAuthStrategy.buildURL(serverURL, authorizePath);

		const oauth2Options: OAuth2Strategy.StrategyOptions = {
			clientID: options.clientID,
			clientSecret: options.clientSecret,
			callbackURL: options.callbackURL,
			authorizationURL,
			tokenURL,
			scope: options.scope?.split(/[\s,]+/).filter(Boolean),
			state: true,
		};

		const wrappedVerify: OAuth2Strategy.VerifyFunction = (accessToken, refreshToken, _params, _profile, done) => {
			this.fetchAndNormalizeIdentity(accessToken)
				.then((identity) => {
					const profile: CustomOAuthProfile = {
						...identity,
						provider: name,
						providerId: String(identity.id),
						accessToken,
						refreshToken,
						idToken: _params.id_token,
						expiresAt: _params.expires_in ? Date.now() + _params.expires_in * 1000 : undefined,
						serverURL,
						_OAuthCustom: true,
					};

					verify(accessToken, refreshToken, profile, done);
				})
				.catch((err) => {
					logger.error({ msg: 'Error fetching identity', error: err });
					done(err);
				});
		};

		super(oauth2Options, wrappedVerify);

		this.name = name;
		this.customOptions = {
			...options,
			serverURL,
			tokenPath,
			identityPath: options.identityPath || '/me',
			authorizePath,
			accessTokenParam: options.accessTokenParam || 'access_token',
			tokenSentVia: options.tokenSentVia || 'payload',
			identityTokenSentVia: options.identityTokenSentVia || options.tokenSentVia || 'header',
			keyField: options.keyField || 'username',
			rolesClaim: options.rolesClaim || 'roles',
			channelsAdmin: options.channelsAdmin || 'rocket.cat',
		};

		this.userAgent = `Rocket.Chat/CustomOAuth`;

		if (this.customOptions.tokenSentVia === 'header') {
			(this as unknown as OAuth2StrategyWithOAuth2)._oauth2.useAuthorizationHeaderforGET(true);
		}
	}

	private static isAbsoluteURL(url: string): boolean {
		return /^https?:\/\//i.test(url);
	}

	private static buildURL(serverURL: string, path: string): string {
		if (CustomOAuthStrategy.isAbsoluteURL(path)) {
			return path;
		}
		return `${serverURL}${path.startsWith('/') ? '' : '/'}${path}`;
	}

	private async fetchAndNormalizeIdentity(accessToken: string): Promise<NormalizedIdentity> {
		const identityPath = CustomOAuthStrategy.buildURL(this.customOptions.serverURL, this.customOptions.identityPath || '/me');

		const headers: Record<string, string> = {
			'User-Agent': this.userAgent,
			'Accept': 'application/json',
		};

		const params: Record<string, string> = {};

		const identityTokenSentVia =
			this.customOptions.identityTokenSentVia === 'default'
				? this.customOptions.tokenSentVia
				: this.customOptions.identityTokenSentVia;

		if (identityTokenSentVia === 'header') {
			headers.Authorization = `Bearer ${accessToken}`;
		} else {
			params[this.customOptions.accessTokenParam || 'access_token'] = accessToken;
		}

		const url = new URL(identityPath);
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.append(key, value);
		});

		try {
			const response = await fetch(url.toString(), {
				method: 'GET',
				headers,
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const identity = await response.json();
			logger.debug({ msg: 'Identity response', identity });

			return normalizeIdentity(identity, {
				usernameField: this.customOptions.usernameField,
				emailField: this.customOptions.emailField,
				nameField: this.customOptions.nameField,
				avatarField: this.customOptions.avatarField,
			});
		} catch (err) {
			const error = new Error(`Failed to fetch identity from ${this.name} at ${identityPath}. ${(err as Error).message}`);
			throw error;
		}
	}

	getCustomOptions(): CustomOAuthOptions {
		return { ...this.customOptions };
	}
}

export function createCustomOAuthStrategy(
	name: string,
	options: Omit<CustomOAuthStrategyOptions, 'callbackURL'> & { callbackURL?: string },
	callbackURL: string,
): CustomOAuthStrategy {
	return new CustomOAuthStrategy(
		name,
		{
			...options,
			callbackURL: options.callbackURL || callbackURL,
		},
		(accessToken, refreshToken, profile, done) => {
			return done(null, profile);
		},
	);
}
