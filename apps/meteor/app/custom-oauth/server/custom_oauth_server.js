import { LDAP } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

import { normalizers, fromTemplate, renameInvalidProperties } from './transform_helpers';
import { callbacks } from '../../../lib/callbacks';
import { isURL } from '../../../lib/utils/isURL';
import { notifyOnUserChange } from '../../lib/server/lib/notifyListener';
import { registerAccessTokenService } from '../../lib/server/oauth/oauth';
import { settings } from '../../settings/server';

const logger = new Logger('CustomOAuth');

const Services = {};
const BeforeUpdateOrCreateUserFromExternalService = [];

export class CustomOAuth {
	constructor(name, options) {
		logger.debug('Init CustomOAuth', name, options);

		this.name = name;
		if (!Match.test(this.name, String)) {
			throw new Meteor.Error('CustomOAuth: Name is required and must be String');
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

	configure(options) {
		if (!Match.test(options, Object)) {
			throw new Meteor.Error('CustomOAuth: Options is required and must be Object');
		}

		if (!Match.test(options.serverURL, String)) {
			throw new Meteor.Error('CustomOAuth: Options.serverURL is required and must be String');
		}

		if (!Match.test(options.tokenPath, String)) {
			options.tokenPath = '/oauth/token';
		}

		if (!Match.test(options.identityPath, String)) {
			options.identityPath = '/me';
		}

		if (!Match.test(options.accessTokenParam, String)) {
			options.accessTokenParam = 'access_token';
		}

		this.serverURL = options.serverURL;
		this.tokenPath = options.tokenPath;
		this.identityPath = options.identityPath;
		this.tokenSentVia = options.tokenSentVia;
		this.identityTokenSentVia = options.identityTokenSentVia;
		this.keyField = options.keyField;
		this.usernameField = (options.usernameField || '').trim();
		this.emailField = (options.emailField || '').trim();
		this.nameField = (options.nameField || '').trim();
		this.avatarField = (options.avatarField || '').trim();
		this.mergeUsers = options.mergeUsers;
		this.mergeUsersDistinctServices = options.mergeUsersDistinctServices;
		this.rolesClaim = options.rolesClaim || 'roles';
		this.accessTokenParam = options.accessTokenParam;
		this.channelsAdmin = options.channelsAdmin || 'rocket.cat';

		if (this.identityTokenSentVia == null || this.identityTokenSentVia === 'default') {
			this.identityTokenSentVia = this.tokenSentVia;
		}

		if (!isURL(this.tokenPath)) {
			this.tokenPath = this.serverURL + this.tokenPath;
		}

		if (!isURL(this.identityPath)) {
			this.identityPath = this.serverURL + this.identityPath;
		}

		if (Match.test(options.addAutopublishFields, Object)) {
			Accounts.addAutopublishFields(options.addAutopublishFields);
		}
	}

	async getAccessToken(query) {
		const config = await ServiceConfiguration.configurations.findOneAsync({ service: this.name });
		if (!config) {
			throw new Accounts.ConfigError();
		}

		let response = undefined;

		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': this.userAgent, // http://doc.gitlab.com/ce/api/users.html#Current-user
			'Accept': 'application/json',
		};
		const params = new URLSearchParams({
			code: query.code,
			redirect_uri: OAuth._redirectUri(this.name, config),
			grant_type: 'authorization_code',
			state: query.state,
		});

		// Only send clientID / secret once on header or payload.
		if (this.tokenSentVia === 'header') {
			const b64 = Buffer.from(`${config.clientId}:${OAuth.openSecret(config.secret)}`).toString('base64');
			headers.Authorization = `Basic ${b64}`;
		} else {
			params.append('client_secret', config.secret);
			params.append('client_id', config.clientId);
		}

		try {
			const request = await fetch(`${this.tokenPath}`, {
				method: 'POST',
				headers,
				body: params,
			});

			if (!request.ok) {
				throw new Error(request.statusText);
			}

			response = await request.json();
		} catch (err) {
			const error = new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${err.message}`);
			throw _.extend(error, { response: err.response });
		}

		if (response.error) {
			// if the http response was a json object with an error attribute
			throw new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${response.error}`);
		} else {
			return response;
		}
	}

	async getIdentity(accessToken) {
		const params = {};
		const headers = {
			'User-Agent': this.userAgent, // http://doc.gitlab.com/ce/api/users.html#Current-user
			'Accept': 'application/json',
		};

		if (this.identityTokenSentVia === 'header') {
			headers.Authorization = `Bearer ${accessToken}`;
		} else {
			params[this.accessTokenParam] = accessToken;
		}

		try {
			const request = await fetch(`${this.identityPath}`, { method: 'GET', headers, params });

			if (!request.ok) {
				throw new Error(request.statusText);
			}

			const response = await request.json();

			logger.debug({ msg: 'Identity response', response });

			return this.normalizeIdentity(response);
		} catch (err) {
			const error = new Error(`Failed to fetch identity from ${this.name} at ${this.identityPath}. ${err.message}`);
			throw _.extend(error, { response: err.response });
		}
	}

	registerService() {
		const self = this;
		OAuth.registerService(this.name, 2, null, async (query) => {
			const response = await self.getAccessToken(query);
			const identity = await self.getIdentity(response.access_token, query);

			const serviceData = {
				_OAuthCustom: true,
				serverURL: self.serverURL,
				accessToken: response.access_token,
				idToken: response.id_token,
				expiresAt: +new Date() + 1000 * parseInt(response.expires_in, 10),
			};

			// only set the token in serviceData if it's there. this ensures
			// that we don't lose old ones (since we only get this on the first
			// log in attempt)
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

	normalizeIdentity(identity) {
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

	retrieveCredential(credentialToken, credentialSecret) {
		return OAuth.retrieveCredential(credentialToken, credentialSecret);
	}

	getUsername(data) {
		try {
			const value = fromTemplate(this.usernameField, data);

			if (!value) {
				throw new Meteor.Error('field_not_found', `Username field "${this.usernameField}" not found in data`, data);
			}
			return value;
		} catch (error) {
			throw new Error('CustomOAuth: Failed to extract username', error.message);
		}
	}

	getEmail(data) {
		try {
			const value = fromTemplate(this.emailField, data);

			if (!value) {
				throw new Meteor.Error('field_not_found', `Email field "${this.emailField}" not found in data`, data);
			}
			return value;
		} catch (error) {
			throw new Error('CustomOAuth: Failed to extract email', error.message);
		}
	}

	getCustomName(data) {
		try {
			const value = fromTemplate(this.nameField, data);

			if (!value) {
				return this.getName(data);
			}

			return value;
		} catch (error) {
			throw new Error('CustomOAuth: Failed to extract custom name', error.message);
		}
	}

	getAvatarUrl(data) {
		try {
			const value = fromTemplate(this.avatarField, data);

			if (!value) {
				logger.debug(`Avatar field "${this.avatarField}" not found in data`, data);
			}
			return value;
		} catch (error) {
			throw new Error('CustomOAuth: Failed to extract avatar url', error.message);
		}
	}

	getName(identity) {
		const name =
			identity.name ||
			identity.username ||
			identity.nickname ||
			identity.CharacterName ||
			identity.userName ||
			identity.preferred_username ||
			(identity.user && identity.user.name);
		return name;
	}

	addHookToProcessUser() {
		BeforeUpdateOrCreateUserFromExternalService.push(async (serviceName, serviceData /* , options*/) => {
			if (serviceName !== this.name) {
				return;
			}

			if (serviceData.username) {
				let user = undefined;

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

				// User already created or merged and has identical name as before
				if (
					user.services &&
					user.services[serviceName] &&
					user.services[serviceName].id === serviceData.id &&
					user.name === serviceData.name &&
					(this.keyField === 'email' || !serviceData.email || user.emails?.find(({ address }) => address === serviceData.email))
				) {
					return;
				}

				if (this.mergeUsers !== true) {
					throw new Meteor.Error('CustomOAuth', `User with username ${user.username} already exists`);
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

		Accounts.validateNewUser((user) => {
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

	registerAccessTokenService(name) {
		const self = this;
		const whitelisted = ['id', 'email', 'username', 'name', this.rolesClaim];

		registerAccessTokenService(name, async (options) => {
			check(
				options,
				Match.ObjectIncluding({
					accessToken: String,
					expiresIn: Match.Integer,
				}),
			);

			const identity = await self.getIdentity(options.accessToken);

			const serviceData = {
				accessToken: options.accessToken,
				expiresAt: +new Date() + 1000 * parseInt(options.expiresIn, 10),
			};

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
}

const { updateOrCreateUserFromExternalService } = Accounts;

Accounts.updateOrCreateUserFromExternalService = async function (...args /* serviceName, serviceData, options*/) {
	for await (const hook of BeforeUpdateOrCreateUserFromExternalService) {
		await hook.apply(this, args);
	}

	const [serviceName, serviceData] = args;

	const user = await updateOrCreateUserFromExternalService.apply(this, args);
	if (!user.userId) {
		return undefined;
	}

	const fullUser = await Users.findOneById(user.userId);
	if (settings.get('LDAP_Update_Data_On_OAuth_Login')) {
		await LDAP.loginAuthenticatedUserRequest(fullUser.username);
	}

	await callbacks.run('afterValidateNewOAuthUser', {
		identity: serviceData,
		serviceName,
		user: fullUser,
	});

	return user;
};
