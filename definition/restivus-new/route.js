/* eslint-disable prefer-const */
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { ironRouterSendErrorToResponse } from './iron-router-error-to-response';

let share;
let JsonRoutes;

share.Route = function () {
	class Route {
		constructor(api, path, options, endpoints1) {
			this.api = api;
			this.path = path;
			this.options = options;
			this.endpoints = endpoints1;
			// Check if options were provided
			if (!this.endpoints) {
				this.endpoints = this.options;
				this.options = {};
			}
		}

		/*
       Convert all endpoints on the given route into our expected endpoint object if it is a bare
       function
 
       @param {Route} route The route the endpoints belong to
     */
		_resolveEndpoints() {
			_.each(this.endpoints, function (endpoint, method, endpoints) {
				if (_.isFunction(endpoint)) {
					endpoints[method] = {
						action: endpoint,
					};
					return endpoints[method];
				}
			});
		}

		/*
       Configure the authentication and role requirement on all endpoints (except OPTIONS, which must
       be configured directly on the endpoint)
 
       Authentication can be required on an entire route or individual endpoints. If required on an
       entire route, that serves as the default. If required in any individual endpoints, that will
       override the default.
 
       After the endpoint is configured, all authentication and role requirements of an endpoint can be
       accessed at <code>endpoint.authRequired</code> and <code>endpoint.roleRequired</code>,
       respectively.
 
       @param {Route} route The route the endpoints belong to
       @param {Endpoint} endpoint The endpoint to configure
     */
		_configureEndpoints() {
			_.each(
				this.endpoints,
				function (endpoint, method) {
					let ref;
					let ref1;
					if (method !== 'options') {
						// Configure acceptable roles
						if (!((ref = this.options) != null ? ref.roleRequired : undefined)) {
							this.options.roleRequired = [];
						}
						if (!endpoint.roleRequired) {
							endpoint.roleRequired = [];
						}
						endpoint.roleRequired = _.union(endpoint.roleRequired, this.options.roleRequired);
						// Make it easier to check if no roles are required
						if (_.isEmpty(endpoint.roleRequired)) {
							endpoint.roleRequired = false;
						}
						// Configure auth requirement
						if (endpoint.authRequired === undefined) {
							if (((ref1 = this.options) != null ? ref1.authRequired : undefined) || endpoint.roleRequired) {
								endpoint.authRequired = true;
							} else {
								endpoint.authRequired = false;
							}
						}
					}
				},
				this,
			);
		}

		/*
       Authenticate an endpoint if required, and return the result of calling it
 
       @returns The endpoint response or a 401 if authentication fails
     */
		_callEndpoint(endpointContext, endpoint) {
			let auth;
			// Call the endpoint if authentication doesn't fail
			auth = this._authAccepted(endpointContext, endpoint);
			if (auth.success) {
				if (this._roleAccepted(endpointContext, endpoint)) {
					return endpoint.action.call(endpointContext);
				}
				return {
					statusCode: 403,
					body: {
						status: 'error',
						message: 'You do not have permission to do this.', // Auth failed
					},
				};
			}
			if (auth.data) {
				return auth.data;
			}
			return {
				statusCode: 401,
				body: {
					status: 'error',
					message: 'You must be logged in to do this.',
				},
			};
		}

		/*
       Authenticate the given endpoint if required
 
       Once it's globally configured in the API, authentication can be required on an entire route or
       individual endpoints. If required on an entire endpoint, that serves as the default. If required
       in any individual endpoints, that will override the default.
 
       @returns An object of the following format:
 
           {
             success: Boolean
             data: String or Object
           }
 
         where `success` is `true` if all required authentication checks pass and the optional `data`
         will contain the auth data when successful and an optional error response when auth fails.
     */
		_authAccepted(endpointContext, endpoint) {
			if (endpoint.authRequired) {
				return this._authenticate(endpointContext);
			}
			return {
				success: true,
			};
		}

		/*
       Verify the request is being made by an actively logged in user
 
       If verified, attach the authenticated user to the context.
 
       @returns An object of the following format:
 
           {
             success: Boolean
             data: String or Object
           }
 
         where `success` is `true` if all required authentication checks pass and the optional `data`
         will contain the auth data when successful and an optional error response when auth fails.
     */
		_authenticate(endpointContext) {
			let auth;
			let userSelector;
			// Get auth info
			auth = this.api._config.auth.user.call(endpointContext);
			if (!auth) {
				return {
					success: false,
				};
			}
			// Get the user from the database
			if (auth.userId && auth.token && !auth.user) {
				userSelector = {};
				userSelector._id = auth.userId;
				userSelector[this.api._config.auth.token] = auth.token;
				auth.user = Meteor.users.findOne(userSelector);
			}
			if (auth.error) {
				return {
					success: false,
					data: auth.error,
				};
			}
			// Attach the user and their ID to the context if the authentication was successful
			if (auth.user) {
				endpointContext.user = auth.user;
				endpointContext.userId = auth.user._id;
				return {
					success: true,
					data: auth,
				};
			}
			return {
				success: false,
			};
		}

		/*
       Authenticate the user role if required
 
       Must be called after _authAccepted().
 
       @returns True if the authenticated user belongs to <i>any</i> of the acceptable roles on the
                endpoint
     */
		_roleAccepted(endpointContext, endpoint) {
			if (endpoint.roleRequired) {
				if (_.isEmpty(_.intersection(endpoint.roleRequired, endpointContext.user.roles))) {
					return false;
				}
			}
			return true;
		}

		/*
       Respond to an HTTP request
     */
		_respond(response, body, statusCode = 200, headers = {}) {
			let defaultHeaders;
			let delayInMilliseconds;
			let minimumDelayInMilliseconds;
			let randomMultiplierBetweenOneAndTwo;
			let sendResponse;
			// Override any default headers that have been provided (keys are normalized to be case insensitive)
			// TODO: Consider only lowercasing the header keys we need normalized, like Content-Type
			defaultHeaders = this._lowerCaseKeys(this.api._config.defaultHeaders);
			headers = this._lowerCaseKeys(headers);
			headers = _.extend(defaultHeaders, headers);
			// Prepare JSON body for response when Content-Type indicates JSON type
			if (headers['content-type'].match(/json|javascript/) !== null) {
				if (this.api._config.prettyJson) {
					body = JSON.stringify(body, undefined, 2);
				} else {
					body = JSON.stringify(body);
				}
			}
			// Send response
			sendResponse = function () {
				response.writeHead(statusCode, headers);
				response.write(body);
				return response.end();
			};
			if (statusCode === 401 || statusCode === 403) {
				// Hackers can measure the response time to determine things like whether the 401 response was
				// caused by bad user id vs bad password.
				// In doing so, they can first scan for valid user ids regardless of valid passwords.
				// Delay by a random amount to reduce the ability for a hacker to determine the response time.
				// See https://www.owasp.org/index.php/Blocking_Brute_Force_Attacks#Finding_Other_Countermeasures
				// See https://en.wikipedia.org/wiki/Timing_attack
				minimumDelayInMilliseconds = 500;
				randomMultiplierBetweenOneAndTwo = 1 + Math.random();
				delayInMilliseconds = minimumDelayInMilliseconds * randomMultiplierBetweenOneAndTwo;
				return Meteor.setTimeout(sendResponse, delayInMilliseconds);
			}
			return sendResponse();
		}

		/*
       Return the object with all of the keys converted to lowercase
     */
		_lowerCaseKeys(object) {
			return _.chain(object)
				.pairs()
				.map(function (attr) {
					return [attr[0].toLowerCase(), attr[1]];
				})
				.object()
				.value();
		}
	}

	Route.prototype.addToApi = (function () {
		let availableMethods;
		availableMethods = ['get', 'post', 'put', 'patch', 'delete', 'options'];
		return function () {
			let allowedMethods;
			let fullPath;
			let rejectedMethods;
			let self;
			self = this;
			// Throw an error if a route has already been added at this path
			// TODO: Check for collisions with paths that follow same pattern with different parameter names
			if (_.contains(this.api._config.paths, this.path)) {
				throw new Error(`Cannot add a route at an existing path: ${this.path}`);
			}
			// Override the default OPTIONS endpoint with our own
			this.endpoints = _.extend(
				{
					options: this.api._config.defaultOptionsEndpoint,
				},
				this.endpoints,
			);
			// Configure each endpoint on this route
			this._resolveEndpoints();
			this._configureEndpoints();
			// Add to our list of existing paths
			this.api._config.paths.push(this.path);
			allowedMethods = _.filter(availableMethods, function (method) {
				return _.contains(_.keys(self.endpoints), method);
			});
			rejectedMethods = _.reject(availableMethods, function (method) {
				return _.contains(_.keys(self.endpoints), method);
			});
			// Setup endpoints on route
			fullPath = this.api._config.apiPath + this.path;
			_.each(allowedMethods, function (method) {
				let endpoint;
				endpoint = self.endpoints[method];
				return JsonRoutes.add(method, fullPath, function (req, res) {
					let doneFunc;
					let endpointContext;
					let error;
					let responseData;
					let responseInitiated;
					// Add function to endpoint context for indicating a response has been initiated manually
					responseInitiated = false;
					doneFunc = function () {
						responseInitiated = true;
						return responseInitiated;
					};
					endpointContext = {
						urlParams: req.params,
						queryParams: req.query,
						bodyParams: req.body,
						request: req,
						response: res,
						done: doneFunc,
					};
					// Add endpoint config options to context
					_.extend(endpointContext, endpoint);
					// Run the requested endpoint
					responseData = null;
					try {
						responseData = self._callEndpoint(endpointContext, endpoint);
					} catch (error1) {
						error = error1;
						// Do exactly what Iron Router would have done, to avoid changing the API
						ironRouterSendErrorToResponse(error, req, res);
						return;
					}
					if (responseInitiated) {
						// Ensure the response is properly completed
						res.end();
						return;
					}
					if (res.headersSent) {
						throw new Error(`Must call this.done() after handling endpoint response manually: ${method} ${fullPath}`);
					} else if (responseData === null || responseData === undefined) {
						throw new Error(`Cannot return null or undefined from an endpoint: ${method} ${fullPath}`);
					}
					// Generate and return the http response, handling the different endpoint response types
					if (responseData.body && (responseData.statusCode || responseData.headers)) {
						return self._respond(res, responseData.body, responseData.statusCode, responseData.headers);
					}
					return self._respond(res, responseData);
				});
			});
			return _.each(rejectedMethods, function (method) {
				return JsonRoutes.add(method, fullPath, function (req, res) {
					let headers;
					let responseData;
					responseData = {
						status: 'error',
						message: 'API endpoint does not exist',
					};
					headers = {
						Allow: allowedMethods.join(', ').toUpperCase(),
					};
					return self._respond(res, responseData, 405, headers);
				});
			});
		};
	})();

	return Route;
}.call(this);
