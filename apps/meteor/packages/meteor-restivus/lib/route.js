import { Users } from '@rocket.chat/models';

import { ironRouterSendErrorToResponse } from './iron-router-error-to-response';
import { JsonRoutes } from './json-routes';

const availableMethods = ['get', 'post', 'put', 'patch', 'delete', 'options'];

export class Route {
	constructor(api, path, options, endpoints1) {
		this.api = api;
		this.path = path;
		this.options = options;
		this.endpoints = endpoints1;
		if (!this.endpoints) {
			this.endpoints = this.options;
			this.options = {};
		}
	}

	addToApi() {
		const self = this;
		if (this.api._config.paths.includes(this.path)) {
			throw new Error(`Cannot add a route at an existing path: ${this.path}`);
		}
		this.endpoints = {
			options: this.api._config.defaultOptionsEndpoint,
			...this.endpoints,
		};
		this._resolveEndpoints();
		this._configureEndpoints();
		this.api._config.paths.push(this.path);
		const allowedMethods = availableMethods.filter(function (method) {
			return Object.keys(self.endpoints).includes(method);
		});
		const rejectedMethods = availableMethods.filter(function (method) {
			return !Object.keys(self.endpoints).includes(method);
		});
		const fullPath = this.api._config.apiPath + this.path;
		allowedMethods.forEach(function (method) {
			const endpoint = self.endpoints[method];
			return JsonRoutes.add(method, fullPath, async function (req, res) {
				let responseInitiated = false;
				const doneFunc = function () {
					responseInitiated = true;
				};
				const endpointContext = {
					urlParams: req.params,
					queryParams: req.query,
					bodyParams: req.body,
					request: req,
					response: res,
					done: doneFunc,
					...endpoint,
				};
				let responseData = null;
				try {
					responseData = await self._callEndpoint(endpointContext, endpoint);
				} catch (e) {
					ironRouterSendErrorToResponse(e, req, res);
					return;
				}
				if (responseInitiated) {
					res.end();
					return;
				}
				if (res.headersSent) {
					throw new Error(`Must call this.done() after handling endpoint response manually: ${method} ${fullPath}`);
				} else if (responseData === null || responseData === void 0) {
					throw new Error(`Cannot return null or undefined from an endpoint: ${method} ${fullPath}`);
				}
				if (responseData.body && (responseData.statusCode || responseData.headers)) {
					return self._respond(res, responseData.body, responseData.statusCode, responseData.headers);
				}
				return self._respond(res, responseData);
			});
		});
		return rejectedMethods.forEach(function (method) {
			return JsonRoutes.add(method, fullPath, function (req, res) {
				const responseData = {
					status: 'error',
					message: 'API endpoint does not exist',
				};
				const headers = {
					Allow: allowedMethods.join(', ').toUpperCase(),
				};
				return self._respond(res, responseData, 405, headers);
			});
		});
	}

	/*
		Convert all endpoints on the given route into our expected endpoint object if it is a bare
		function

		@param {Route} route The route the endpoints belong to
		*/

	_resolveEndpoints() {
		Object.entries(this.endpoints).forEach(([method, endpoint]) => {
			if (typeof endpoint === 'function') {
				this.endpoints[method] = {
					action: endpoint,
				};
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
		Object.entries(this.endpoints).forEach(([method, endpoint]) => {
			if (method !== 'options') {
				if (!this.options?.roleRequired) {
					this.options.roleRequired = [];
				}
				if (!endpoint.roleRequired) {
					endpoint.roleRequired = [];
				}
				endpoint.roleRequired = [...endpoint.roleRequired, ...this.options.roleRequired];
				if (endpoint.roleRequired.length === 0) {
					endpoint.roleRequired = false;
				}
				if (endpoint.authRequired === void 0) {
					if (this.options?.authRequired || endpoint.roleRequired) {
						endpoint.authRequired = true;
					} else {
						endpoint.authRequired = false;
					}
				}
			}
		});
	}

	/*
		Authenticate an endpoint if required, and return the result of calling it

		@returns The endpoint response or a 401 if authentication fails
		*/

	async _callEndpoint(endpointContext, endpoint) {
		const auth = await this._authAccepted(endpointContext, endpoint);
		if (auth.success) {
			if (this._roleAccepted(endpointContext, endpoint)) {
				return endpoint.action.call(endpointContext);
			}
			return {
				statusCode: 403,
				body: {
					status: 'error',
					message: 'You do not have permission to do this.',
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

	async _authAccepted(endpointContext, endpoint) {
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

	async _authenticate(endpointContext) {
		const auth = await this.api._config.auth.user.call(endpointContext);
		if (!auth) {
			return {
				success: false,
			};
		}
		if (auth.userId && auth.token && !auth.user) {
			const userSelector = {};
			userSelector._id = auth.userId;
			userSelector[this.api._config.auth.token] = auth.token;
			auth.user = await Users.findOne(userSelector);
		}
		if (auth.error) {
			return {
				success: false,
				data: auth.error,
			};
		}
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
			const intersection = [endpoint.roleRequired, endpointContext.user.roles].reduce((a, b) => a.filter((c) => b.includes(c)));
			if (intersection.length === 0) {
				return false;
			}
		}
		return true;
	}

	/*
		Respond to an HTTP request
		*/

	_respond(response, body, statusCode, headers) {
		let delayInMilliseconds;
		let minimumDelayInMilliseconds;
		let randomMultiplierBetweenOneAndTwo;
		if (statusCode == null) {
			statusCode = 200;
		}
		if (headers == null) {
			headers = {};
		}
		const defaultHeaders = this._lowerCaseKeys(this.api._config.defaultHeaders);
		headers = this._lowerCaseKeys(headers);
		headers = { ...defaultHeaders, ...headers };
		if (headers['content-type'].match(/json|javascript/) !== null) {
			if (this.api._config.prettyJson) {
				body = JSON.stringify(body, void 0, 2);
			} else {
				body = JSON.stringify(body);
			}
		}
		const sendResponse = function () {
			response.writeHead(statusCode, headers);
			response.write(body);
			return response.end();
		};
		if (statusCode === 401 || statusCode === 403) {
			minimumDelayInMilliseconds = 500;
			randomMultiplierBetweenOneAndTwo = 1 + Math.random();
			delayInMilliseconds = minimumDelayInMilliseconds * randomMultiplierBetweenOneAndTwo;
			return setTimeout(sendResponse, delayInMilliseconds);
		}
		return sendResponse();
	}

	/*
		Return the object with all of the keys converted to lowercase
		*/

	_lowerCaseKeys(object) {
		return Object.keys(object).reduce((accumulator, key) => {
			accumulator[key.toLowerCase()] = object[key];
			return accumulator;
		}, {});
	}
}
