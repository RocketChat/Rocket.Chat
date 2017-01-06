/* global Restivus */
class API extends Restivus {
	constructor(properties) {
		super(properties);
		this.authMethods = [];
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

	// If the count query param is higher than the "API_Upper_Count_Limit" setting, then we limit that
	// If the count query param isn't defined, then we set it to the "API_Default_Count" setting
	// If the count is zero, then that means unlimited and is only allowed if the setting "API_Allow_Infinite_Count" is true
	getPaginationItems(req) {
		const hardUpperLimit = RocketChat.settings.get('API_Upper_Count_Limit') <= 0 ? 100 : RocketChat.settings.get('API_Upper_Count_Limit');
		const defaultCount = RocketChat.settings.get('API_Default_Count') <= 0 ? 50 : RocketChat.settings.get('API_Default_Count');
		const offset = req.queryParams.offset ? parseInt(req.queryParams.offset) : 0;
		let count = defaultCount;

		// Ensure count is an appropiate amount
		if (typeof req.queryParams.count !== 'undefined') {
			count = parseInt(req.queryParams.count);
		} else {
			count = defaultCount;
		}

		if (count > hardUpperLimit) {
			count = hardUpperLimit;
		}

		if (count === 0 && !RocketChat.settings.get('API_Allow_Infinite_Count')) {
			count = defaultCount;
		}

		return {
			offset,
			count
		};
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
