import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { Accounts } from 'meteor/accounts-base';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Logger } from '@rocket.chat/logger';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import './slo';
import './settings';
import './startup';

const logger = new Logger('OpenIDConnect');

const Services = {};

export class OpenIDConnect {
	constructor(name, options) {
		logger.debug('Init OpenIDConnect', name, options);

		this.name = name;
		if (!Match.test(this.name, String)) {
			throw new Meteor.Error('OpenIDConnect: Name is required and must be String');
		}

		if (Services[this.name]) {
			Services[this.name].configure(options);
			return;
		}

		Services[this.name] = this;

		this.configure(options);

		this.userAgent = 'Meteor';
		if (Meteor.release) {
			this.userAgent += `/${Meteor.release}`;
		}

		Accounts.oauth.registerService(this.name);
		this.registerService();
	}

	async configure(options) {
		if (!Match.test(options, Object)) {
			throw new Meteor.Error('OpenIDConnect: Options is required and must be Object');
		}

		this.options = options;
		this.discovery = await this.getDiscovery();
	}

	async getDiscovery() {
		if (!this.options.issuer) {
			throw new Meteor.Error('OpenIDConnect: Issuer URL is required');
		}

		const discoveryUrl = new URL(this.options.issuer);
		discoveryUrl.pathname = discoveryUrl.pathname.replace(/\/$/, '') + '/.well-known/openid-configuration';


		try {
			const response = await fetch(discoveryUrl.toString(), {
				headers: {
					'Accept': 'application/json',
					'User-Agent': this.userAgent,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch discovery document from ${discoveryUrl}. ${response.statusText}`);
			}

			const discovery = await response.json();
			logger.debug({ msg: 'Discovery response', discovery });
			return discovery;
		} catch (err) {
			const error = new Error(`Failed to fetch discovery document from ${discoveryUrl}. ${err.message}`);
			throw _.extend(error, { response: err.response });
		}
	}

	async getAccessToken(query) {
		const config = await ServiceConfiguration.configurations.findOneAsync({ service: this.name });
		if (!config) {
			throw new Accounts.ConfigError();
		}

		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': this.userAgent,
			'Accept': 'application/json',
		};

		const params = new URLSearchParams({
			code: query.code,
			redirect_uri: OAuth._redirectUri(this.name, config),
			grant_type: 'authorization_code',
			state: query.state,
		});

		if (this.discovery.token_endpoint_auth_methods_supported.includes('client_secret_basic')) {
			const b64 = Buffer.from(`${config.clientId}:${OAuth.openSecret(config.secret)}`).toString('base64');
			headers.Authorization = `Basic ${b64}`;
		} else {
			params.append('client_id', config.clientId);
			params.append('client_secret', OAuth.openSecret(config.secret));
		}

		try {
			const response = await fetch(this.discovery.token_endpoint, {
				method: 'POST',
				headers,
				body: params,
			});

			if (!response.ok) {
				throw new Error(response.statusText);
			}

			const tokens = await response.json();
			return tokens;
		} catch (err) {
			const error = new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.discovery.token_endpoint}. ${err.message}`);
			throw _.extend(error, { response: err.response });
		}
	}

	async getJWKS() {
		if (!this.discovery.jwks_uri) {
			throw new Meteor.Error('OpenIDConnect: JWKS URI is required');
		}

		return createRemoteJWKSet(new URL(this.discovery.jwks_uri));
	}

	async verifyIdToken(idToken, jwks) {
		const config = await ServiceConfiguration.configurations.findOneAsync({ service: this.name });

		try {
			const { payload } = await jwtVerify(idToken, jwks, {
				issuer: this.discovery.issuer,
				audience: config.clientId,
			});
			return payload;
		} catch (err) {
			logger.error({ msg: 'Failed to verify id_token', err });
			throw new Meteor.Error('openid-connect-verify-id-token-failed', 'Failed to verify id_token');
		}
	}

	registerService() {
		const self = this;
		OAuth.registerService(this.name, 2, null, async (query) => {
			const tokens = await self.getAccessToken(query);
			const jwks = await self.getJWKS();
			const claims = await self.verifyIdToken(tokens.id_token, jwks);

			const serviceData = {
				_OAuthCustom: true,
				accessToken: tokens.access_token,
				idToken: tokens.id_token,
				expiresAt: (+new Date) + (1000 * parseInt(tokens.expires_in, 10)),
				refreshToken: tokens.refresh_token,
				...claims,
				id: claims.sub,
			};

			return {
				serviceData,
				options: {
					profile: {
						name: claims.name || claims.preferred_username || claims.sub,
					},
				},
			};
		});
	}
}
