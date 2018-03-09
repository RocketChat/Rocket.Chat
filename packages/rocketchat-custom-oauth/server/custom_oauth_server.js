/*globals OAuth*/
import _ from 'underscore';

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

		this.serverURL = options.serverURL;
		this.tokenPath = options.tokenPath;
		this.identityPath = options.identityPath;
		this.tokenSentVia = options.tokenSentVia;
		this.identityTokenSentVia = options.identityTokenSentVia;
		this.usernameField = (options.usernameField || '').trim();
		this.mergeUsers = options.mergeUsers;

		if (this.identityTokenSentVia == null || this.identityTokenSentVia === 'default') {
			this.identityTokenSentVia = this.tokenSentVia;
		}

		if (!/^https?:\/\/.+/.test(this.tokenPath)) {
			this.tokenPath = this.serverURL + this.tokenPath;
		}

		if (!/^https?:\/\/.+/.test(this.identityPath)) {
			this.identityPath = this.serverURL + this.identityPath;
		}

		if (Match.test(options.addAutopublishFields, Object)) {
			Accounts.addAutopublishFields(options.addAutopublishFields);
		}
	}

	getAccessToken(query) {
		const config = ServiceConfiguration.configurations.findOne({service: this.name});
		if (!config) {
			throw new ServiceConfiguration.ConfigError();
		}

		let response = undefined;

		const allOptions = {
			headers: {
				'User-Agent': this.userAgent, // http://doc.gitlab.com/ce/api/users.html#Current-user
				Accept: 'application/json'
			},
			params: {
				code: query.code,
				redirect_uri: OAuth._redirectUri(this.name, config),
				grant_type: 'authorization_code',
				state: query.state
			}
		};

		// Only send clientID / secret once on header or payload.
		if (this.tokenSentVia === 'header') {
			allOptions['auth'] = `${ config.clientId }:${ OAuth.openSecret(config.secret) }`;
		} else {
			allOptions['params']['client_secret'] = OAuth.openSecret(config.secret);
			allOptions['params']['client_id'] = config.clientId;
		}

		try {
			response = HTTP.post(this.tokenPath, allOptions);
		} catch (err) {
			const error = new Error(`Failed to complete OAuth handshake with ${ this.name } at ${ this.tokenPath }. ${ err.message }`);
			throw _.extend(error, {response: err.response});
		}

		let data;
		if (response.data) {
			data = response.data;
		} else {
			data = JSON.parse(response.content);
		}

		if (data.error) { //if the http response was a json object with an error attribute
			throw new Error(`Failed to complete OAuth handshake with ${ this.name } at ${ this.tokenPath }. ${ data.error }`);
		} else {
			return data.access_token;
		}
	}

	getIdentity(accessToken) {
		const params = {};
		const headers = {
			'User-Agent': this.userAgent // http://doc.gitlab.com/ce/api/users.html#Current-user
		};

		if (this.identityTokenSentVia === 'header') {
			headers['Authorization'] = `Bearer ${ accessToken }`;
		} else {
			params['access_token'] = accessToken;
		}

		try {
			const response = HTTP.get(this.identityPath, {
				headers,
				params
			});

			let data;

			if (response.data) {
				data = response.data;
			} else {
				data = JSON.parse(response.content);
			}

			logger.debug('Identity response', JSON.stringify(data, null, 2));

			return data;
		} catch (err) {
			const error = new Error(`Failed to fetch identity from ${ this.name } at ${ this.identityPath }. ${ err.message }`);
			throw _.extend(error, {response: err.response});
		}
	}

	registerService() {
		const self = this;
		OAuth.registerService(this.name, 2, null, (query) => {
			const accessToken = self.getAccessToken(query);
			// console.log 'at:', accessToken

			let identity = self.getIdentity(accessToken);

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

				// Fix general 'userid' instead of 'id' from provider
				if (identity.userid && !identity.id) {
					identity.id = identity.userid;
				}
				
				// Fix Nextcloud provider
				if (identity.ocs.data.id && !identity.id) {
					identity.id = identity.ocs.data.id;
					identity.name = identity.ocs.data.display-name;
					identity.email = identity.ocs.data.email;
				}

				// Fix when authenticating from a meteor app with 'emails' field
				if (!identity.email && (identity.emails && Array.isArray(identity.emails) && identity.emails.length >= 1)) {
					identity.email = identity.emails[0].address ? identity.emails[0].address : undefined;
				}
			}

			// console.log 'id:', JSON.stringify identity, null, '  '

			const serviceData = {
				_OAuthCustom: true,
				accessToken
			};

			_.extend(serviceData, identity);

			const data = {
				serviceData,
				options: {
					profile: {
						name: identity.name || identity.username || identity.nickname || identity.CharacterName || identity.userName || identity.preferred_username || (identity.user && identity.user.name)
					}
				}
			};

			// console.log data

			return data;
		});
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

	addHookToProcessUser() {
		BeforeUpdateOrCreateUserFromExternalService.push((serviceName, serviceData/*, options*/) => {
			if (serviceName !== this.name) {
				return;
			}

			if (this.usernameField) {
				const username = this.getUsername(serviceData);

				const user = RocketChat.models.Users.findOneByUsername(username);
				if (!user) {
					return;
				}

				// User already created or merged
				if (user.services && user.services[serviceName] && user.services[serviceName].id === serviceData.id) {
					return;
				}

				if (this.mergeUsers !== true) {
					throw new Meteor.Error('CustomOAuth', `User with username ${ user.username } already exists`);
				}

				const serviceIdKey = `services.${ serviceName }.id`;
				const update = {
					$set: {
						[serviceIdKey]: serviceData.id
					}
				};

				RocketChat.models.Users.update({_id: user._id}, update);
			}
		});

		Accounts.validateNewUser((user) => {
			if (!user.services || !user.services[this.name] || !user.services[this.name].id) {
				return true;
			}

			if (this.usernameField) {
				user.username = this.getUsername(user.services[this.name]);
			}

			return true;
		});

	}
}


const updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService;
Accounts.updateOrCreateUserFromExternalService = function(/*serviceName, serviceData, options*/) {
	for (const hook of BeforeUpdateOrCreateUserFromExternalService) {
		hook.apply(this, arguments);
	}

	return updateOrCreateUserFromExternalService.apply(this, arguments);
};
