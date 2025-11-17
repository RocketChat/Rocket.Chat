import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Accounts } from 'meteor/accounts-base';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

import { normalizers, fromTemplate, renameInvalidProperties } from '../../../app/custom-oauth/server/transform_helpers';
import { callbacks } from '../../../lib/callbacks';
import { isURL } from '../../../lib/utils/isURL';
import { notifyOnUserChange } from '../../../app/lib/server/lib/notifyListener';
import { registerAccessTokenService } from '../../../app/lib/server/oauth/oauth';

const logger = new Logger('OpenIDConnect');

const Services: Record<string, OpenIDConnect> = {};
const BeforeUpdateOrCreateUserFromExternalService: Array<(serviceName: string, serviceData: any, options?: any) => Promise<void>> = [];

interface OpenIDConnectOptions {
	serverURL: string;
	discoveryEndpoint?: string;
	authorizePath?: string;
	tokenPath?: string;
	userinfoPath?: string;
	jwksUri?: string;
	endSessionEndpoint?: string;
	tokenSentVia?: 'header' | 'payload';
	identityTokenSentVia?: 'header' | 'payload' | 'default' | string;
	keyField?: 'username' | 'email';
	usernameField?: string;
	emailField?: string;
	nameField?: string;
	avatarField?: string;
	mergeUsers?: boolean;
	mergeUsersDistinctServices?: boolean;
	rolesClaim?: string;
	groupsClaim?: string;
	accessTokenParam?: string;
	channelsAdmin?: string;
	scope?: string;
	loginStyle?: 'redirect' | 'popup' | '';
	mapChannels?: boolean;
	channelsMap?: string;
	mergeRoles?: boolean;
	rolesToSync?: string;
	showButton?: boolean;
	buttonLabelText?: string;
	buttonLabelColor?: string;
	buttonColor?: string;
	addAutopublishFields?: Record<string, any>;
	// OpenID Connect specific
	useDiscovery?: boolean;
	responseType?: string;
	idTokenSigningAlg?: string;
	enableSLO?: boolean; // Single Logout
	postLogoutRedirectUri?: string;
	claimsFromIdToken?: boolean;
	validateIdToken?: boolean;
}

interface OpenIDDiscoveryDocument {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint?: string;
	jwks_uri: string;
	end_session_endpoint?: string;
	response_types_supported: string[];
	subject_types_supported: string[];
	id_token_signing_alg_values_supported: string[];
	scopes_supported?: string[];
	token_endpoint_auth_methods_supported?: string[];
	claims_supported?: string[];
}

export class OpenIDConnect {
	name: string;
	serverURL: string;
	discoveryEndpoint: string;
	authorizePath: string;
	tokenPath: string;
	userinfoPath: string;
	jwksUri: string;
	endSessionEndpoint?: string;
	tokenSentVia: 'header' | 'payload';
	identityTokenSentVia: 'header' | 'payload' | string;
	keyField: 'username' | 'email';
	usernameField: string;
	emailField: string;
	nameField: string;
	avatarField: string;
	mergeUsers: boolean;
	mergeUsersDistinctServices: boolean;
	rolesClaim: string;
	groupsClaim: string;
	accessTokenParam: string;
	channelsAdmin: string;
	scope: string;
	loginStyle?: 'redirect' | 'popup' | '';
	userAgent: string;
	useDiscovery: boolean;
	responseType: string;
	idTokenSigningAlg: string;
	enableSLO: boolean;
	postLogoutRedirectUri?: string;
	claimsFromIdToken: boolean;
	validateIdToken: boolean;
	discoveryDocument?: OpenIDDiscoveryDocument;

	constructor(name: string, options: OpenIDConnectOptions) {
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
		this.addHookToProcessUser();
		this.registerAccessTokenService(this.name, this.accessTokenParam);
	}

	configure(options: OpenIDConnectOptions): void {
		if (!Match.test(options, Object)) {
			throw new Meteor.Error('OpenIDConnect: Options is required and must be Object');
		}

		if (!Match.test(options.serverURL, String)) {
			throw new Meteor.Error('OpenIDConnect: Options.serverURL is required and must be String');
		}

		// OpenID Connect specific defaults
		this.useDiscovery = options.useDiscovery !== false; // Default to true
		this.responseType = options.responseType || 'code';
		this.idTokenSigningAlg = options.idTokenSigningAlg || 'RS256';
		this.enableSLO = options.enableSLO || false;
		this.claimsFromIdToken = options.claimsFromIdToken !== false; // Default to true
		this.validateIdToken = options.validateIdToken !== false; // Default to true

		this.serverURL = options.serverURL;
		this.discoveryEndpoint = options.discoveryEndpoint || `${this.serverURL}/.well-known/openid-configuration`;
		
		// These will be set from discovery or options
		this.tokenPath = options.tokenPath || '';
		this.authorizePath = options.authorizePath || '';
		this.userinfoPath = options.userinfoPath || '';
		this.jwksUri = options.jwksUri || '';
		this.endSessionEndpoint = options.endSessionEndpoint;
		
		this.tokenSentVia = options.tokenSentVia || 'payload';
		this.identityTokenSentVia = options.identityTokenSentVia || 'default';
		this.keyField = options.keyField || 'email';
		this.usernameField = (options.usernameField || 'preferred_username').trim();
		this.emailField = (options.emailField || 'email').trim();
		this.nameField = (options.nameField || 'name').trim();
		this.avatarField = (options.avatarField || 'picture').trim();
		this.mergeUsers = options.mergeUsers || false;
		this.mergeUsersDistinctServices = options.mergeUsersDistinctServices || false;
		this.rolesClaim = options.rolesClaim || 'roles';
		this.groupsClaim = options.groupsClaim || 'groups';
		this.accessTokenParam = options.accessTokenParam || 'access_token';
		this.channelsAdmin = options.channelsAdmin || 'rocket.cat';
		this.scope = options.scope || 'openid profile email';
		this.loginStyle = options.loginStyle;
		this.postLogoutRedirectUri = options.postLogoutRedirectUri;

		if (this.identityTokenSentVia === 'default' || !this.identityTokenSentVia) {
			this.identityTokenSentVia = this.tokenSentVia;
		}

		// Initialize discovery if enabled
		if (this.useDiscovery) {
			void this.loadDiscoveryDocument();
		} else {
			// Use provided paths
			if (!isURL(this.tokenPath)) {
				this.tokenPath = this.serverURL + (options.tokenPath || '/oauth/token');
			}
			if (!isURL(this.authorizePath)) {
				this.authorizePath = this.serverURL + (options.authorizePath || '/oauth/authorize');
			}
			if (!isURL(this.userinfoPath)) {
				this.userinfoPath = this.serverURL + (options.userinfoPath || '/oauth/userinfo');
			}
		}

		if (Match.test(options.addAutopublishFields, Object)) {
			Accounts.addAutopublishFields(options.addAutopublishFields);
		}
	}

	async loadDiscoveryDocument(): Promise<void> {
		try {
			logger.info(`Loading OpenID Connect discovery document from ${this.discoveryEndpoint}`);
			
			const response = await fetch(this.discoveryEndpoint, {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'User-Agent': this.userAgent,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to load discovery document: ${response.statusText}`);
			}

			this.discoveryDocument = await response.json() as OpenIDDiscoveryDocument;

			// Update endpoints from discovery
			this.authorizePath = this.discoveryDocument.authorization_endpoint;
			this.tokenPath = this.discoveryDocument.token_endpoint;
			this.userinfoPath = this.discoveryDocument.userinfo_endpoint || this.userinfoPath;
			this.jwksUri = this.discoveryDocument.jwks_uri;
			this.endSessionEndpoint = this.discoveryDocument.end_session_endpoint;

			logger.info('OpenID Connect discovery document loaded successfully', {
				issuer: this.discoveryDocument.issuer,
				authorizePath: this.authorizePath,
				tokenPath: this.tokenPath,
				userinfoPath: this.userinfoPath,
				endSessionEndpoint: this.endSessionEndpoint,
			});
		} catch (error: any) {
			logger.error(`Failed to load OpenID Connect discovery document: ${error.message}`);
			// Fall back to manual configuration
			if (!this.tokenPath) {
				this.tokenPath = `${this.serverURL}/oauth/token`;
			}
			if (!this.authorizePath) {
				this.authorizePath = `${this.serverURL}/oauth/authorize`;
			}
			if (!this.userinfoPath) {
				this.userinfoPath = `${this.serverURL}/oauth/userinfo`;
			}
		}
	}

	async getAccessToken(query: Record<string, any>): Promise<any> {
		const config = await ServiceConfiguration.configurations.findOneAsync({ service: this.name });
		if (!config) {
			throw new Accounts.ConfigError();
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': this.userAgent,
			'Accept': 'application/json',
		};

		const params = new URLSearchParams({
			code: query.code,
			redirect_uri: OAuth._redirectUri(this.name, config),
			grant_type: 'authorization_code',
		});

		// OpenID Connect: Send client credentials
		if (this.tokenSentVia === 'header') {
			const b64 = Buffer.from(`${config.clientId}:${OAuth.openSecret(config.secret)}`).toString('base64');
			headers.Authorization = `Basic ${b64}`;
		} else {
			params.append('client_secret', OAuth.openSecret(config.secret));
			params.append('client_id', config.clientId);
		}

		try {
			const request = await fetch(this.tokenPath, {
				method: 'POST',
				headers,
				body: params,
			});

			if (!request.ok) {
				const errorText = await request.text();
				throw new Error(`${request.statusText}: ${errorText}`);
			}

			const response = await request.json();

			if (response.error) {
				throw new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${response.error}`);
			}

			return response;
		} catch (err: any) {
			const error = new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${err.message}`);
			throw _.extend(error, { response: err.response });
		}
	}

	async getIdentity(accessToken: string, idToken?: string): Promise<any> {
		let identity: any = {};

		// OpenID Connect: Extract claims from ID token if enabled
		if (this.claimsFromIdToken && idToken) {
			try {
				identity = this.decodeIdToken(idToken);
				logger.debug({ msg: 'Claims from ID token', identity });
			} catch (error: any) {
				logger.warn(`Failed to decode ID token: ${error.message}`);
			}
		}

		// Fetch additional user info from userinfo endpoint
		if (this.userinfoPath) {
			const params: Record<string, string> = {};
			const headers: Record<string, string> = {
				'User-Agent': this.userAgent,
				'Accept': 'application/json',
			};

			if (this.identityTokenSentVia === 'header') {
				headers.Authorization = `Bearer ${accessToken}`;
			} else {
				params[this.accessTokenParam] = accessToken;
			}

			try {
				const url = new URL(this.userinfoPath);
				Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

				const request = await fetch(url.toString(), {
					method: 'GET',
					headers,
				});

				if (!request.ok) {
					throw new Error(request.statusText);
				}

				const userinfoResponse = await request.json();
				logger.debug({ msg: 'Userinfo response', userinfoResponse });

				// Merge userinfo with ID token claims (userinfo takes precedence)
				identity = { ...identity, ...userinfoResponse };
			} catch (err: any) {
				logger.warn(`Failed to fetch userinfo from ${this.userinfoPath}: ${err.message}`);
				// Continue with ID token claims if userinfo fails
			}
		}

		return this.normalizeIdentity(identity);
	}

	decodeIdToken(idToken: string): any {
		// Simple JWT decode (payload only, no signature verification here)
		// For production, you should verify the signature using jwksUri
		try {
			const parts = idToken.split('.');
			if (parts.length !== 3) {
				throw new Error('Invalid ID token format');
			}

			const payload = parts[1];
			const decoded = Buffer.from(payload, 'base64').toString('utf8');
			return JSON.parse(decoded);
		} catch (error: any) {
			throw new Error(`Failed to decode ID token: ${error.message}`);
		}
	}

	registerService(): void {
		const self = this;
		OAuth.registerService(this.name, 2, null, async (query: Record<string, any>) => {
			const response = await self.getAccessToken(query);
			const identity = await self.getIdentity(response.access_token, response.id_token);

			const serviceData: any = {
				_OAuthCustom: true,
				_OpenIDConnect: true,
				serverURL: self.serverURL,
				accessToken: response.access_token,
				idToken: response.id_token,
				expiresAt: response.expires_in ? +new Date() + 1000 * parseInt(response.expires_in, 10) : undefined,
			};

			if (response.refresh_token) {
				serviceData.refreshToken = response.refresh_token;
			}

			_.extend(serviceData, identity);

			const data = {
				serviceData,
				options: {
					profile: {
						name: identity.name,
					},
				},
			};

			return data;
		});
	}

	normalizeIdentity(identity: any): any {
		if (identity) {
			for (const normalizer of Object.values(normalizers)) {
				const result = normalizer(identity);
				if (result) {
					identity = result;
				}
			}
		}

		if (this.usernameField) {
			identity.username = this.getUsername(identity);
		}

		if (this.emailField) {
			identity.email = this.getEmail(identity);
		}

		if (this.avatarField) {
			identity.avatarUrl = this.getAvatarUrl(identity);
		}

		if (this.nameField) {
			identity.name = this.getCustomName(identity);
		} else {
			identity.name = this.getName(identity);
		}

		return renameInvalidProperties(identity);
	}

	retrieveCredential(credentialToken: string, credentialSecret: string): any {
		return OAuth.retrieveCredential(credentialToken, credentialSecret);
	}

	getUsername(data: any): string {
		try {
			const value = fromTemplate(this.usernameField, data);

			if (!value) {
				throw new Meteor.Error('field_not_found', `Username field "${this.usernameField}" not found in data`, data);
			}
			return value;
		} catch (error: any) {
			throw new Error(`OpenIDConnect: Failed to extract username: ${error.message}`);
		}
	}

	getEmail(data: any): string {
		try {
			const value = fromTemplate(this.emailField, data);

			if (!value) {
				throw new Meteor.Error('field_not_found', `Email field "${this.emailField}" not found in data`, data);
			}
			return value;
		} catch (error: any) {
			throw new Error(`OpenIDConnect: Failed to extract email: ${error.message}`);
		}
	}

	getCustomName(data: any): string {
		try {
			const value = fromTemplate(this.nameField, data);

			if (!value) {
				return this.getName(data);
			}

			return value;
		} catch (error: any) {
			throw new Error(`OpenIDConnect: Failed to extract custom name: ${error.message}`);
		}
	}

	getAvatarUrl(data: any): string | undefined {
		try {
			const value = fromTemplate(this.avatarField, data);

			if (!value) {
				logger.debug(`Avatar field "${this.avatarField}" not found in data`, data);
			}
			return value;
		} catch (error: any) {
			throw new Error(`OpenIDConnect: Failed to extract avatar url: ${error.message}`);
		}
	}

	getName(identity: any): string {
		const name =
			identity.name ||
			identity.username ||
			identity.nickname ||
			identity.preferred_username ||
			identity.given_name ||
			(identity.user && identity.user.name);
		return name;
	}

	addHookToProcessUser(): void {
		BeforeUpdateOrCreateUserFromExternalService.push(async (serviceName: string, serviceData: any) => {
			if (serviceName !== this.name) {
				return;
			}

			if (serviceData.username) {
				let user;

				if (this.keyField === 'username') {
					user = this.mergeUsersDistinctServices
						? await Users.findOneByUsernameIgnoringCase(serviceData.username)
						: await Users.findOneByUsernameAndServiceNameIgnoringCase(serviceData.username, serviceData.id, serviceName);
				} else if (this.keyField === 'email') {
					user = this.mergeUsersDistinctServices
						? await Users.findOneByEmailAddress(serviceData.email)
						: await Users.findOneByEmailAddressAndServiceNameIgnoringCase(serviceData.email, serviceData.id, serviceName);
				}

				if (!user) {
					return;
				}

				await callbacks.run('afterProcessOAuthUser', { serviceName, serviceData, user });

				if (
					user.services &&
					user.services[serviceName] &&
					user.services[serviceName].id === serviceData.id &&
					user.name === serviceData.name &&
					(this.keyField === 'email' || !serviceData.email || user.emails?.find(({ address }: any) => address === serviceData.email))
				) {
					return;
				}

				if (this.mergeUsers !== true) {
					throw new Meteor.Error('OpenIDConnect', `User with username ${user.username} already exists`);
				}

				const serviceIdKey = `services.${serviceName}.id`;
				const update = {
					$set: {
						name: serviceData.name,
						...(this.keyField === 'username' && serviceData.email && { emails: [{ address: serviceData.email, verified: true }] }),
						[serviceIdKey]: serviceData.id,
					},
				};

				await Users.update({ _id: user._id }, update);

				void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff: update });
			}
		});

		Accounts.validateNewUser((user: any) => {
			if (!user.services || !user.services[this.name] || !user.services[this.name].id) {
				return true;
			}

			if (this.usernameField) {
				user.username = user.services[this.name].username;
			}

			if (this.emailField) {
				user.email = user.services[this.name].email;
			}

			if (this.nameField) {
				user.name = user.services[this.name].name;
			}

			return true;
		});
	}

	registerAccessTokenService(name: string, accessTokenParam: string): void {
		const self = this;
		const whitelisted = ['id', 'email', 'username', 'name', 'sub', this.rolesClaim, this.groupsClaim];

		registerAccessTokenService(name, async (options: any) => {
			const identity = await self.getIdentity(options.accessToken, options.idToken);

			const serviceData: any = {
				accessToken: options.accessToken,
				expiresAt: options.expiresIn ? +new Date() + 1000 * parseInt(options.expiresIn, 10) : undefined,
			};

			if (options.idToken) {
				serviceData.idToken = options.idToken;
			}

			const fields = _.pick(identity, whitelisted);
			_.extend(serviceData, fields);

			return {
				serviceData,
				options: {
					profile: {
						name: identity.name,
					},
				},
			};
		});
	}

	// Single Logout (SLO) support
	async performSingleLogout(userId: string): Promise<string | undefined> {
		if (!this.enableSLO || !this.endSessionEndpoint) {
			return undefined;
		}

		try {
			const user = await Users.findOneById(userId);
			if (!user || !user.services || !user.services[this.name]) {
				return undefined;
			}

			const idToken = user.services[this.name].idToken;
			if (!idToken) {
				logger.warn('No ID token found for Single Logout');
				return undefined;
			}

			const config = await ServiceConfiguration.configurations.findOneAsync({ service: this.name });
			if (!config) {
				return undefined;
			}

			const postLogoutRedirectUri = this.postLogoutRedirectUri || Meteor.absoluteUrl();
			
			const params = new URLSearchParams({
				id_token_hint: idToken,
				post_logout_redirect_uri: postLogoutRedirectUri,
			});

			const logoutUrl = `${this.endSessionEndpoint}?${params.toString()}`;
			logger.info(`Performing Single Logout to ${logoutUrl}`);

			return logoutUrl;
		} catch (error: any) {
			logger.error(`Failed to perform Single Logout: ${error.message}`);
			return undefined;
		}
	}
}

// Export for use in other modules
export { Services, BeforeUpdateOrCreateUserFromExternalService };
