/* global Restivus */
class API extends Restivus {
	constructor(properties) {
		super(properties);
		this.logger = new Logger(`API ${properties.version ? properties.version : 'default'} Logger`, {});
		this.authMethods = [];
		this.helperMethods = new Map();
		this.defaultFieldsToExclude = {
			joinCode: 0,
			$loki: 0,
			meta: 0
		};
	}

	addAuthMethod(method) {
		this.authMethods.push(method);
	}

	success(result={}) {
		if (_.isObject(result)) {
			result.success = true;
		}

		return {
			statusCode: 200,
			body: result
		};
	}

	failure(result, errorType) {
		if (_.isObject(result)) {
			result.success = false;
		} else {
			result = {
				success: false,
				error: result
			};

			if (errorType) {
				result.errorType = errorType;
			}
		}

		return {
			statusCode: 400,
			body: result
		};
	}


	unauthorized(msg) {
		return {
			statusCode: 403,
			body: {
				success: false,
				error: msg ? msg : 'unauthorized'
			}
		};
	}

	addRoute(route, options, endpoints) {
		//Note: required if the developer didn't provide options
		if (typeof endpoints === 'undefined') {
			endpoints = options;
			options = {};
		}

		//Note: This is required due to Restivus calling `addRoute` in the constructor of itself
		if (this.helperMethods) {
			Object.keys(endpoints).forEach((method) => {
				if (typeof endpoints[method] === 'function') {
					endpoints[method] = { action: endpoints[method] };
				}

				//Add a try/catch for each much
				const originalAction = endpoints[method].action;
				endpoints[method].action = function() {
					let result;
					try {
						result = originalAction.apply(this);
					} catch (e) {
						this.logger.debug(`${method} ${route} threw an error:`, e);
						return RocketChat.API.v1.failure(e.message, e.error);
					}

					return result ? result : RocketChat.API.v1.success();
				};

				for (const [name, helperMethod] of this.helperMethods) {
					endpoints[method][name] = helperMethod;
				}

				//Allow the endpoints to make usage of the logger which respects the user's settings
				endpoints[method].logger = this.logger;
				endpoints[method].method = method.toUpperCase();
			});
		}

		super.addRoute(route, options, endpoints);
	}
}

RocketChat.API = {};

const getUserAuth = function _getUserAuth() {
	const invalidResults = [undefined, null, false];
	return {
		token: 'services.resume.loginTokens.hashedToken',
		user: function() {
			if (this.bodyParams && this.bodyParams.payload) {
				this.bodyParams = JSON.parse(this.bodyParams.payload);
			}

			for (let i = 0; i < RocketChat.API.v1.authMethods.length; i++) {
				const method = RocketChat.API.v1.authMethods[i];

				if (typeof method === 'function') {
					const result = method.apply(this, arguments);
					if (!invalidResults.includes(result)) {
						return result;
					}
				}
			}

			let token;
			if (this.request.headers['x-auth-token']) {
				token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
			}

			return {
				userId: this.request.headers['x-user-id'],
				token
			};
		}
	};
};

RocketChat.API.v1 = new API({
	version: 'v1',
	useDefaultAuth: true,
	prettyJson: true,
	enableCors: false,
	auth: getUserAuth()
});

RocketChat.API.default = new API({
	useDefaultAuth: true,
	prettyJson: true,
	enableCors: false,
	auth: getUserAuth()
});
