import { Accounts } from 'meteor/accounts-base';
import { Users } from '@rocket.chat/models';

import { Auth } from './auth';
import { Route } from './route';

export class Restivus {
	constructor(options) {
		this._routes = [];
		this._config = {
			paths: [],
			useDefaultAuth: false,
			apiPath: 'api/',
			version: null,
			prettyJson: false,
			auth: {
				token: 'services.resume.loginTokens.hashedToken',
				user() {
					let token;
					if (this.request.headers['x-auth-token']) {
						token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
					}
					return {
						userId: this.request.headers['x-user-id'],
						token,
					};
				},
			},
			defaultHeaders: {
				'Content-Type': 'application/json',
			},
			enableCors: true,
			...options,
		};

		if (this._config.enableCors) {
			const corsHeaders = {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
			};
			if (this._config.useDefaultAuth) {
				corsHeaders['Access-Control-Allow-Headers'] += ', X-User-Id, X-Auth-Token';
			}
			this._config.defaultHeaders = {
				...this._config.defaultHeaders,
				...corsHeaders,
			};
			if (!this._config.defaultOptionsEndpoint) {
				this._config.defaultOptionsEndpoint = function () {
					this.response.writeHead(200, corsHeaders);
					return this.done();
				};
			}
		}
		if (this._config.apiPath.startsWith('/')) {
			this._config.apiPath = this._config.apiPath.slice(1);
		}
		if (!this._config.apiPath.endsWith('/')) {
			this._config.apiPath = `${this._config.apiPath}/`;
		}
		if (this._config.version) {
			this._config.apiPath += `${this._config.version}/`;
		}
		if (this._config.useDefaultAuth) {
			this._initAuth();
		} else if (this._config.useAuth) {
			this._initAuth();
			console.warn('Warning: useAuth API config option will be removed in Restivus v1.0 \n    Use the useDefaultAuth option instead');
		}
	}

	/**
	 	Add endpoints for the given HTTP methods at the given path

		@param path {String} The extended URL path (will be appended to base path of the API)
		@param options {Object} Route configuration options
		@param options.authRequired {Boolean} The default auth requirement for each endpoint on the route
		@param options.roleRequired {String or String[]} The default role required for each endpoint on the route
		@param endpoints {Object} A set of endpoints available on the new route (get, post, put, patch, delete, options)
		@param endpoints.<method> {Function or Object} If a function is provided, all default route
			configuration options will be applied to the endpoint. Otherwise an object with an `action`
			and all other route config options available. An `action` must be provided with the object.
	*/

	addRoute(path, options, endpoints) {
		const route = new Route(this, path, options, endpoints);
		this._routes.push(route);
		route.addToApi();
		return this;
	}

	/*
		Add /login and /logout endpoints to the API
	*/

	_initAuth() {
		const self = this;

		/*
			Add a login endpoint to the API

			After the user is logged in, the onLoggedIn hook is called (see Restfully.configure() for
			adding hook).
		*/
		this.addRoute(
			'login',
			{ authRequired: false },
			{
				async post() {
					const user = {};
					if (this.bodyParams.user) {
						if (this.bodyParams.user.indexOf('@') === -1) {
							user.username = this.bodyParams.user;
						} else {
							user.email = this.bodyParams.user;
						}
					} else if (this.bodyParams.username) {
						user.username = this.bodyParams.username;
					} else if (this.bodyParams.email) {
						user.email = this.bodyParams.email;
					}
					let { password } = this.bodyParams;
					if (this.bodyParams.hashed) {
						password = {
							digest: password,
							algorithm: 'sha-256',
						};
					}
					let auth;
					try {
						auth = await Auth.loginWithPassword(user, password);
					} catch (e) {
						return {
							statusCode: e.error,
						};
					}
					if (auth.userId && auth.authToken) {
						const searchQuery = {};
						searchQuery[self._config.auth.token] = Accounts._hashLoginToken(auth.authToken);
						this.user = await Users.findOne(
							{
								_id: auth.userId,
							},
							searchQuery,
						);
						this.userId = this.user?._id;
					}
					const response = {
						status: 'success',
						data: auth,
					};
					const extraData = self._config.onLoggedIn?.call(this);
					if (extraData != null) {
						Object.assign(response.data, {
							extra: extraData,
						});
					}
					return response;
				},
			},
		);
		const logout = async function () {
			const authToken = this.request.headers['x-auth-token'];
			const hashedToken = Accounts._hashLoginToken(authToken);
			const tokenLocation = self._config.auth.token;
			const index = tokenLocation.lastIndexOf('.');
			const tokenPath = tokenLocation.substring(0, index);
			const tokenFieldName = tokenLocation.substring(index + 1);
			const tokenToRemove = {};
			tokenToRemove[tokenFieldName] = hashedToken;
			const tokenRemovalQuery = {};
			tokenRemovalQuery[tokenPath] = tokenToRemove;
			await Users.updateOne(
				{ _id: this.user._id },
				{
					$pull: tokenRemovalQuery,
				},
			);
			const response = {
				status: 'success',
				data: {
					message: "You've been logged out!",
				},
			};
			const extraData = self._config.onLoggedOut?.call(this);
			if (extraData != null) {
				Object.assign(response.data, {
					extra: extraData,
				});
			}
			return response;
		};

		/*
			Add a logout endpoint to the API

			After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
			adding hook).
		*/
		return this.addRoute(
			'logout',
			{ authRequired: true },
			{
				async get() {
					console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
					console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
					return logout.call(this);
				},
				post: logout,
			},
		);
	}
}
