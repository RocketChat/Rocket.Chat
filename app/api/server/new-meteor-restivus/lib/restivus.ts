/* eslint-disable prefer-const */

import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import { Accounts } from 'meteor/accounts-base';
import { IApiEndpoint } from '@rocket.chat/apps-engine/definition/api';
import { Mongo } from 'meteor/mongo';
import { Route, RouteOptions } from 'meteor/kadira:flow-router';

type Options = {
	permissionsRequired?: string[];
	authRequired?: boolean;
	forceTwoFactorAuthenticationForNonEnterprise?: boolean;
};

export let Restivus: any;
const { indexOf } = [];

(this as any).Restivus = function (): typeof Restivus {
	class Restivus {
		_routes: Route[];

		_config: any;

		_userCollectionEndpoints: { [x: string]: { call: (arg0: any, arg1: Mongo.Collection<Meteor.User, Meteor.User>) => _.List<unknown> } };

		_collectionEndpoints: { [x: string]: { call: (arg0: any, arg1: Mongo.Collection<Meteor.User, Meteor.User>) => _.List<unknown> } };

		constructor(options: unknown) {
			let corsHeaders: {
				'Access-Control-Allow-Origin': string;
				'Access-Control-Allow-Headers': string;
			};
			this._routes = [];
			this._config = {
				paths: [],
				useDefaultAuth: false,
				apiPath: 'api/',
				version: null,
				prettyJson: false,
				auth: {
					token: 'services.resume.loginTokens.hashedToken',
					user(): {
						userId: string;
						token: string | undefined;
					} {
						let token;
						if ((this as any).request.headers['x-auth-token']) {
							token = Accounts._hashLoginToken((this as any).request.headers['x-auth-token']);
						}
						return {
							userId: (this as any).request.headers['x-user-id'],
							token,
						};
					},
				},
				defaultHeaders: {
					'Content-Type': 'application/json',
				},
				enableCors: true,
			};
			// Configure API with the given options
			_.extend(this._config, options);
			if (this._config.enableCors) {
				corsHeaders = {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
				};
				if (this._config.useDefaultAuth) {
					corsHeaders['Access-Control-Allow-Headers'] += ', X-User-Id, X-Auth-Token';
				}
				// Set default header to enable CORS if configured
				_.extend(this._config.defaultHeaders, corsHeaders);
				if (!this._config.defaultOptionsEndpoint) {
					this._config.defaultOptionsEndpoint = function (): unknown {
						this.response.writeHead(200, corsHeaders);
						return this.done();
					};
				}
			}
			// Normalize the API path
			if (this._config.apiPath[0] === '/') {
				this._config.apiPath = this._config.apiPath.slice(1);
			}
			if (_.last(this._config.apiPath) !== '/') {
				this._config.apiPath = `${this._config.apiPath}/`;
			}
			// URL path versioning is the only type of API versioning currently available, so if a version is
			// provided, append it to the base path of the API
			if (this._config.version) {
				this._config.apiPath += `${this._config.version}/`;
			}
			// Add default login and logout endpoints if auth is configured
			if (this._config.useDefaultAuth) {
				this._initAuth();
			} else if (this._config.useAuth) {
				this._initAuth();
				console.warn('Warning: useAuth API config option will be removed in Restivus v1.0 \nUse the useDefaultAuth option instead');
			}
			return this;
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
		addRoute(path: string, options: { authRequired: boolean }, endpoints: IApiEndpoint[]): this {
			let route;
			// Create a new route and add it to our list of existing routes
			route = new share.Route(this, path, options, endpoints);
			this._routes.push(route);
			route.addToApi();
			return this;
		}

		/**
      Generate routes for the Meteor Collection with the given name
    */
		addCollection(
			collection: Mongo.Collection<Meteor.User, Meteor.User>,
			options: { endpoints: {}; routeOptions: Options; excludedEndpoints: unknown[]; path: string },
		): this {
			let collectionEndpoints: {
				[x: string]: { call: (arg0: any, arg1: Mongo.Collection<Meteor.User, Meteor.User>) => _.List<string> };
			};
			let collectionRouteEndpoints: {};
			let endpointsAwaitingConfiguration: { [x: string]: any };
			let entityRouteEndpoints: {};
			let excludedEndpoints: unknown;
			let methods: _.List<string>;
			let methodsOnCollection: string[];
			let path: string;
			let routeOptions: Options;
			methods = ['get', 'post', 'put', 'patch', 'delete', 'getAll'];
			methodsOnCollection = ['post', 'getAll'];
			// Grab the set of endpoints
			if (collection === Meteor.users) {
				collectionEndpoints = this._userCollectionEndpoints;
			} else {
				collectionEndpoints = this._collectionEndpoints;
			}
			// Flatten the options and set defaults if necessary
			endpointsAwaitingConfiguration = options.endpoints || {};
			routeOptions = options.routeOptions || {};
			excludedEndpoints = options.excludedEndpoints || [];
			// Use collection name as default path
			path = options.path || collection._name;
			// Separate the requested endpoints by the route they belong to (one for operating on the entire
			// collection and one for operating on a single entity within the collection)
			collectionRouteEndpoints = {};
			entityRouteEndpoints = {};
			if (_.isEmpty(endpointsAwaitingConfiguration) && _.isEmpty(excludedEndpoints)) {
				// Generate all endpoints on this collection
				_.each(
					methods,
					function (method: undefined) {
						// Partition the endpoints into their respective routes
						if (indexOf.call(methodsOnCollection, method) >= 0) {
							_.extend(collectionRouteEndpoints, collectionEndpoints[method].call(this, collection));
						} else {
							_.extend(entityRouteEndpoints, collectionEndpoints[method].call(this, collection));
						}
					},
					this,
				);
			} else {
				// Generate any endpoints that haven't been explicitly excluded
				_.each(
					methods,
					function (method) {
						let configuredEndpoint: {};
						let endpointOptions: unknown;
						if (indexOf.call(excludedEndpoints, method as never) < 0 && endpointsAwaitingConfiguration[method] !== false) {
							// Configure endpoint and map to it's http method
							// TODO: Consider predefining a map of methods to their http method type (e.g., getAll: get)
							endpointOptions = endpointsAwaitingConfiguration[method];
							configuredEndpoint = {};
							_.each(collectionEndpoints[method].call(this, collection), function (action: {}, methodType: string) {
								configuredEndpoint[methodType] = _.chain(action).clone().extend(endpointOptions).value();
								return configuredEndpoint[methodType];
							});
							// Partition the endpoints into their respective routes
							if (indexOf.call(methodsOnCollection, method as never) >= 0) {
								_.extend(collectionRouteEndpoints, configuredEndpoint);
							} else {
								_.extend(entityRouteEndpoints, configuredEndpoint);
							}
						}
					},
					this,
				);
			}
			// Add the routes to the API
			this.addRoute(path, routeOptions, collectionRouteEndpoints);
			this.addRoute(`${path}/:id`, routeOptions, entityRouteEndpoints);
			return this;
		}

		/*
      Add /login and /logout endpoints to the API
    */
		_initAuth() {
			let logout;
			let self;
			self = this;
			/*
        Add a login endpoint to the API

        After the user is logged in, the onLoggedIn hook is called (see Restfully.configure() for
        adding hook).
      */
			this.addRoute(
				'login',
				{
					authRequired: false,
				},
				{
					post() {
						let auth;
						let e;
						let extraData;
						let password;
						let ref;
						let ref1;
						let response;
						let searchQuery;
						let user;
						// Grab the username or email that the user is logging in with
						user = {};
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
						password = this.bodyParams.password;
						if (this.bodyParams.hashed) {
							password = {
								digest: password,
								algorithm: 'sha-256',
							};
						}
						try {
							// Try to log the user into the user's account (if successful we'll get an auth token back)
							auth = Auth.loginWithPassword(user, password);
						} catch (error) {
							e = error;
							return ({} = {
								statusCode: e.error,
								body: {
									status: 'error',
									message: e.reason,
								},
							});
						}
						// Get the authenticated user
						// TODO: Consider returning the user in Auth.loginWithPassword(), instead of fetching it again here
						if (auth.userId && auth.authToken) {
							searchQuery = {};
							searchQuery[self._config.auth.token] = Accounts._hashLoginToken(auth.authToken);
							this.user = Meteor.users.findOne(
								{
									_id: auth.userId,
								},
								searchQuery,
							);
							this.userId = (ref = this.user) != null ? ref._id : void 0;
						}
						response = {
							status: 'success',
							data: auth,
						};
						// Call the login hook with the authenticated user attached
						extraData = (ref1 = self._config.onLoggedIn) != null ? ref1.call(this) : void 0;
						if (extraData != null) {
							_.extend(response.data, {
								extra: extraData,
							});
						}
						return response;
					},
				},
			);
			logout = function () {
				let authToken;
				let extraData;
				let hashedToken;
				let index;
				let ref;
				let response;
				let tokenFieldName;
				let tokenLocation;
				let tokenPath;
				let tokenRemovalQuery;
				let tokenToRemove;
				// Remove the given auth token from the user's account
				authToken = this.request.headers['x-auth-token'];
				hashedToken = Accounts._hashLoginToken(authToken);
				tokenLocation = self._config.auth.token;
				index = tokenLocation.lastIndexOf('.');
				tokenPath = tokenLocation.substring(0, index);
				tokenFieldName = tokenLocation.substring(index + 1);
				tokenToRemove = {};
				tokenToRemove[tokenFieldName] = hashedToken;
				tokenRemovalQuery = {};
				tokenRemovalQuery[tokenPath] = tokenToRemove;
				Meteor.users.update(this.user._id, {
					$pull: tokenRemovalQuery,
				});
				response = {
					status: 'success',
					data: {
						message: "You've been logged out!",
					},
				};
				// Call the logout hook with the authenticated user attached
				extraData = (ref = self._config.onLoggedOut) != null ? ref.call(this) : void 0;
				if (extraData != null) {
					_.extend(response.data, {
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
				{
					authRequired: true,
				},
				{
					get() {
						console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
						console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
						return logout.call(this);
					},
					post: logout,
				},
			);
		}
	}

	/**
    A set of endpoints that can be applied to a Collection Route
  */
	Restivus.prototype._collectionEndpoints = {
		get(collection) {
			return {
				get: {
					action() {
						let entity;
						entity = collection.findOne(this.urlParams.id);
						if (entity) {
							return {
								status: 'success',
								data: entity,
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'Item not found',
							},
						};
					},
				},
			};
		},
		put(collection) {
			return {
				put: {
					action() {
						let entity;
						let entityIsUpdated;
						entityIsUpdated = collection.update(this.urlParams.id, this.bodyParams);
						if (entityIsUpdated) {
							entity = collection.findOne(this.urlParams.id);
							return {
								status: 'success',
								data: entity,
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'Item not found',
							},
						};
					},
				},
			};
		},
		patch(collection) {
			return {
				patch: {
					action() {
						let entity;
						let entityIsUpdated;
						entityIsUpdated = collection.update(this.urlParams.id, {
							$set: this.bodyParams,
						});
						if (entityIsUpdated) {
							entity = collection.findOne(this.urlParams.id);
							return {
								status: 'success',
								data: entity,
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'Item not found',
							},
						};
					},
				},
			};
		},
		delete(collection) {
			return {
				delete: {
					action() {
						if (collection.remove(this.urlParams.id)) {
							return {
								status: 'success',
								data: {
									message: 'Item removed',
								},
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'Item not found',
							},
						};
					},
				},
			};
		},
		post(collection) {
			return {
				post: {
					action() {
						let entity;
						let entityId;
						entityId = collection.insert(this.bodyParams);
						entity = collection.findOne(entityId);
						if (entity) {
							return {
								statusCode: 201,
								body: {
									status: 'success',
									data: entity,
								},
							};
						}
						return {
							statusCode: 400,
							body: {
								status: 'fail',
								message: 'No item added',
							},
						};
					},
				},
			};
		},
		getAll(collection) {
			return {
				get: {
					action() {
						let entities;
						entities = collection.find().fetch();
						if (entities) {
							return {
								status: 'success',
								data: entities,
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'Unable to retrieve items from collection',
							},
						};
					},
				},
			};
		},
	};

	/**
    A set of endpoints that can be applied to a Meteor.users Collection Route
  */
	Restivus.prototype._userCollectionEndpoints = {
		get(collection) {
			return {
				get: {
					action() {
						let entity;
						entity = collection.findOne(this.urlParams.id, {
							fields: {
								profile: 1,
							},
						});
						if (entity) {
							return {
								status: 'success',
								data: entity,
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'User not found',
							},
						};
					},
				},
			};
		},
		put(collection) {
			return {
				put: {
					action() {
						let entity;
						let entityIsUpdated;
						entityIsUpdated = collection.update(this.urlParams.id, {
							$set: {
								profile: this.bodyParams,
							},
						});
						if (entityIsUpdated) {
							entity = collection.findOne(this.urlParams.id, {
								fields: {
									profile: 1,
								},
							});
							return {
								status: 'success',
								data: entity,
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'User not found',
							},
						};
					},
				},
			};
		},
		delete(collection) {
			return {
				delete: {
					action() {
						if (collection.remove(this.urlParams.id)) {
							return {
								status: 'success',
								data: {
									message: 'User removed',
								},
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'User not found',
							},
						};
					},
				},
			};
		},
		post(collection) {
			return {
				post: {
					action() {
						let entity;
						let entityId;
						// Create a new user account
						entityId = Accounts.createUser(this.bodyParams);
						entity = collection.findOne(entityId, {
							fields: {
								profile: 1,
							},
						});
						if (entity) {
							return {
								statusCode: 201,
								body: {
									status: 'success',
									data: entity,
								},
							};
						}
						({
							statusCode: 400,
						});
						return {
							status: 'fail',
							message: 'No user added',
						};
					},
				},
			};
		},
		getAll(collection) {
			return {
				get: {
					action() {
						let entities;
						entities = collection
							.find(
								{},
								{
									fields: {
										profile: 1,
									},
								},
							)
							.fetch();
						if (entities) {
							return {
								status: 'success',
								data: entities,
							};
						}
						return {
							statusCode: 404,
							body: {
								status: 'fail',
								message: 'Unable to retrieve users',
							},
						};
					},
				},
			};
		},
	};

	return Restivus;
}.call(this);

Restivus = this.Restivus;
