import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { OAuth } from 'meteor/oauth';
import { HTTP } from 'meteor/http';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { Logger } from '../../logger';
import { Users } from '../../models';
import { mapRolesFromSSO, updateRolesFromSSO } from './oauth_helpers';
import _ from 'underscore';
import { isURL } from '../../utils/lib/isURL';
import { registerAccessTokenService } from '../../lib/server/oauth/oauth';

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
			this.userAgent += `/${ Meteor.release }`;
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
		this.usernameField = (options.usernameField || '').trim();
		this.mergeUsers = options.mergeUsers;
		this.mergeRoles = options.mergeRoles || false;
		this.rolesClaim = options.rolesClaim || 'roles';
		this.accessTokenParam = options.accessTokenParam;

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
				Accept: 'application/json',
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
			allOptions.auth = `${ config.clientId }:${ OAuth.openSecret(config.secret) }`;
		} else {
			allOptions.params.client_secret = OAuth.openSecret(config.secret);
			allOptions.params.client_id = config.clientId;
		}

		try {
			response = HTTP.post(this.tokenPath, allOptions);
		} catch (err) {
			const error = new Error(`Failed to complete OAuth handshake with ${ this.name } at ${ this.tokenPath }. ${ err.message }`);
			throw _.extend(error, { response: err.response });
		}

		let data;
		if (response.data) {
			data = response.data;
		} else {
			data = JSON.parse(response.content);
		}

		if (data.error) { // if the http response was a json object with an error attribute
			throw new Error(`Failed to complete OAuth handshake with ${ this.name } at ${ this.tokenPath }. ${ data.error }`);
		} else {
			return data.access_token;
		}
	}

	getIdentity(accessToken, accessTokenParam) {
		const params = {};
		const headers = {
			'User-Agent': this.userAgent, // http://doc.gitlab.com/ce/api/users.html#Current-user
		};

		if (this.identityTokenSentVia === 'header') {
			headers.Authorization = `Bearer ${ accessToken }`;
		} else {
			params[accessTokenParam] = accessToken;
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

			logger.debug('Identity response', JSON.stringify(data, null, 2));

			return this.normalizeIdentity(data);
		} catch (err) {
			const error = new Error(`Failed to fetch identity from ${ this.name } at ${ this.identityPath }. ${ err.message }`);
			throw _.extend(error, { response: err.response });
		}
	}

	registerService() {
		const self = this;
		OAuth.registerService(this.name, 2, null, (query) => {
			const accessToken = self.getAccessToken(query);

			const identity = self.getIdentity(accessToken, this.accessTokenParam);

			const serviceData = {
				_OAuthCustom: true,
				accessToken,
			};

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
			// Set 'id' to '_id' for any sources that provide it
			if (identity._id && !identity.id) {
				identity.id = identity._id;
			}

			// Fix for Reddit
			if (identity.result) {
				identity = identity.result;
			}

			// Fix WordPress-like identities having 'ID' instead of 'id'
			if (identity.ID && !identity.id) {
				identity.id = identity.ID;
			}

			// Fix Auth0-like identities having 'user_id' instead of 'id'
			if (identity.user_id && !identity.id) {
				identity.id = identity.user_id;
			}

			if (identity.CharacterID && !identity.id) {
				identity.id = identity.CharacterID;
			}

			// Fix Dataporten having 'user.userid' instead of 'id'
			if (identity.user && identity.user.userid && !identity.id) {
				if (identity.user.userid_sec && identity.user.userid_sec[0]) {
					identity.id = identity.user.userid_sec[0];
				} else {
					identity.id = identity.user.userid;
				}
				identity.email = identity.user.email;
			}
			// Fix for Xenforo [BD]API plugin for 'user.user_id; instead of 'id'
			if (identity.user && identity.user.user_id && !identity.id) {
				identity.id = identity.user.user_id;
				identity.email = identity.user.user_email;
			}
			// Fix general 'phid' instead of 'id' from phabricator
			if (identity.phid && !identity.id) {
				identity.id = identity.phid;
			}

			// Fix Keycloak-like identities having 'sub' instead of 'id'
			if (identity.sub && !identity.id) {
				identity.id = identity.sub;
			}

			// Fix OpenShift identities where id is in 'metadata' object
			if (!identity.id && identity.metadata && identity.metadata.uid) {
				identity.id = identity.metadata.uid;
				identity.name = identity.fullName;
			}

			// Fix general 'userid' instead of 'id' from provider
			if (identity.userid && !identity.id) {
				identity.id = identity.userid;
			}

			// Fix Nextcloud provider
			if (!identity.id && identity.ocs && identity.ocs.data && identity.ocs.data.id) {
				identity.id = identity.ocs.data.id;
				identity.name = identity.ocs.data.displayname;
				identity.email = identity.ocs.data.email;
			}

			// Fix when authenticating from a meteor app with 'emails' field
			if (!identity.email && (identity.emails && Array.isArray(identity.emails) && identity.emails.length >= 1)) {
				identity.email = identity.emails[0].address ? identity.emails[0].address : undefined;
			}
		}

		if (this.usernameField) {
			identity.username = this.getUsername(identity);
		}

		identity.name = this.getName(identity);

		return identity;
	}

	retrieveCredential(credentialToken, credentialSecret) {
		return OAuth.retrieveCredential(credentialToken, credentialSecret);
	}

	getUsername(data) {
		let username = '';

		username = this.usernameField.split('.').reduce(function(prev, curr) {
			return prev ? prev[curr] : undefined;
		}, data);
		if (!username) {
			throw new Meteor.Error('field_not_found', `Username field "${ this.usernameField }" not found in data`, data);
		}
		return username;
	}

	getName(identity) {
		const name = identity.name || identity.username || identity.nickname || identity.CharacterName || identity.userName || identity.preferred_username || (identity.user && identity.user.name);
		return name;
	}

	addHookToProcessUser() {
		BeforeUpdateOrCreateUserFromExternalService.push((serviceName, serviceData/* , options*/) => {
			if (serviceName !== this.name) {
				return;
			}

			if (serviceData.username) {
				const user = Users.findOneByUsername(serviceData.username);
				if (!user) {
					return;
				}

				if (this.mergeRoles) {
					updateRolesFromSSO(user, serviceData, this.rolesClaim);
				}

				// User already created or merged and has identical name as before
				if (user.services && user.services[serviceName] && user.services[serviceName].id === serviceData.id && user.name === serviceData.name) {
					return;
				}

				if (this.mergeUsers !== true) {
					throw new Meteor.Error('CustomOAuth', `User with username ${ user.username } already exists`);
				}

				const serviceIdKey = `services.${ serviceName }.id`;
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
				user.username = this.getUsername(user.services[this.name]);
			}

			if (this.mergeRoles) {
				user.roles = mapRolesFromSSO(user.services[this.name], this.rolesClaim);
			}

			return true;
		});

	}

	registerAccessTokenService(name, accessTokenParam) {
		const self = this;
		const whitelisted = [
			'id',
			'email',
			'username',
			'name',
			this.rolesClaim,
		];

		registerAccessTokenService(name, function(options) {
			check(options, Match.ObjectIncluding({
				accessToken: String,
				expiresIn: Match.Integer,
				identity: Match.Maybe(Object),
			}));

			const identity = options.identity || self.getIdentity(options.accessToken, accessTokenParam);

			const serviceData = {
				accessToken: options.accessToken,
				expiresAt: (+new Date) + (1000 * parseInt(options.expiresIn, 10)),
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
Accounts.updateOrCreateUserFromExternalService = function(...args /* serviceName, serviceData, options*/) {
	for (const hook of BeforeUpdateOrCreateUserFromExternalService) {
		hook.apply(this, args);
	}

	return updateOrCreateUserFromExternalService.apply(this, args);
};
