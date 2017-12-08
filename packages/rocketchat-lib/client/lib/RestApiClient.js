RocketChat.API = {
	get(endpoint, params) {
		return RocketChat.API._jqueryCall('GET', endpoint, params);
	},

	post(endpoint, params, body) {
		if (!body) {
			body = params;
			params = {};
		}
		return RocketChat.API._jqueryCall('POST', endpoint, params, body);
	},

	_jqueryCall(method, endpoint, params, body) {
		let query = '';
		if (params && typeof params === 'object') {
			Object.keys(params).forEach((key) => {
				query += query === '' ? '?' : '&';

				query += `${ key }=${ params[key] }`;
			});
		}

		return new Promise(function _rlRestApiGet(resolve, reject) {
			jQuery.ajax({
				method,
				url: `${ Meteor.absoluteUrl() }api/${ endpoint }${ query }`,
				headers: {
					'Content-Type': 'application/json',
					'X-User-Id': localStorage['Meteor.userId'],
					'X-Auth-Token': localStorage['Meteor.loginToken']
				},
				data: JSON.stringify(body),
				success: function _rlGetSuccess(result) {
					resolve(result);
				},
				error: function _rlGetFailure(xhr, status, errorThrown) {
					reject(new Error(errorThrown));
				}
			});
		});
	},

	v1: {
		get(endpoint, params) {
			return RocketChat.API.get(`v1/${ endpoint }`, params);
		},

		post(endpoint, params, body) {
			return RocketChat.API.post(`v1/${ endpoint }`, params, body);
		}
	}
};
