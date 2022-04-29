import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { OAuth } from 'meteor/oauth';
import { HTTP } from 'meteor/http';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

import { normalizers, fromTemplate, renameInvalidProperties } from './transform_helpers';
import { Logger } from '../../logger';
import { Users } from '../../models';
import { isURL } from '../../utils/lib/isURL';
import { registerAccessTokenService } from '../../lib/server/oauth/oauth';
import { callbacks } from '../../../lib/callbacks';

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

	getAccessToken(query) {
		const config = ServiceConfiguration.configurations.findOne({ service: this.name });
		if (!config) {
			throw new ServiceConfiguration.ConfigError();
		}

		let response = undefined;

		const allOptions = {
			headers: {
				'User-Agent': this.userAgent, // http://doc.gitlab.com/ce/api/users.html#Current-user
				'Accept': 'application/json',
			},
			params: {
				code: query.code,
				redirect_uri: OAuth._redirectUri(this.name, config),
				grant_type: 'authorization_code',
				state: query.state,
			},
		};

		// Only send clientID / secret once on header or payload.
		if (this.tokenSentVia === 'header') {
			allOptions.auth = `${config.clientId}:${OAuth.openSecret(config.secret)}`;
		} else {
			allOptions.params.client_secret = OAuth.openSecret(config.secret);
			allOptions.params.client_id = config.clientId;
		}

		try {
			response = HTTP.post(this.tokenPath, allOptions);
		} catch (err) {
			const error = new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${err.message}`);
			throw _.extend(error, { response: err.response });
		}

		let data;
		if (response.data) {
			data = response.data;
		} else {
			data = JSON.parse(response.content);
		}

		if (data.error) {
			// if the http response was a json object with an error attribute
			throw new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${data.error}`);
		} else {
			return data;
		}
	}

	getIdentity(accessToken) {
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
			const response = HTTP.get(this.identityPath, {
				headers,
				params,
			});

			let data;

			if (response.data) {
				data = response.data;
			} else {
				data = JSON.parse(response.content);
			}

			logger.debug({ msg: 'Identity response', data });

			return this.normalizeIdentity(data);
		} catch (err) {
			const error = new Error(`Failed to fetch identity from ${this.name} at ${this.identityPath}. ${err.message}`);
			throw _.extend(error, { response: err.response });
		}
	}

	registerService() {
		const self = this;
		OAuth.registerService(this.name, 2, null, (query) => {
			const response = self.getAccessToken(query);
			const identity = self.getIdentity(response.access_token, query);

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
		BeforeUpdateOrCreateUserFromExternalService.push((serviceName, serviceData /* , options*/) => {
			if (serviceName !== this.name) {
				return;
			}

			if (serviceData.username) {
				let user = undefined;

				if (this.keyField === 'username') {
					user = Users.findOneByUsernameAndServiceNameIgnoringCase(serviceData.username, serviceData._id, serviceName);
				} else if (this.keyField === 'email') {
					user = Users.findOneByEmailAddressAndServiceNameIgnoringCase(serviceData.email, serviceData._id, serviceName);
				}

				if (!user) {
					return;
				}

				callbacks.run('afterProcessOAuthUser', { serviceName, serviceData, user });

				// User already created or merged and has identical name as before
				if (
					user.services &&
					user.services[serviceName] &&
					user.services[serviceName].id === serviceData.id &&
					user.name === serviceData.name
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
						[serviceIdKey]: serviceData.id,
					},
				};

				Users.update({ _id: user._id }, update);
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

			callbacks.run('afterValidateNewOAuthUser', {
				identity: user.services[this.name],
				serviceName: this.name,
				user,
			});

			return true;
		});
	}

	registerAccessTokenService(name) {
		const self = this;
		const whitelisted = ['id', 'email', 'username', 'name', this.rolesClaim];

		registerAccessTokenService(name, function (options) {
			check(
				options,
				Match.ObjectIncluding({
					accessToken: String,
					expiresIn: Match.Integer,
				}),
			);

			const identity = self.getIdentity(options.accessToken);

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
Accounts.updateOrCreateUserFromExternalService = function (...args /* serviceName, serviceData, options*/) {
	for (const hook of BeforeUpdateOrCreateUserFromExternalService) {
		hook.apply(this, args);
	}

	return updateOrCreateUserFromExternalService.apply(this, args);
};
