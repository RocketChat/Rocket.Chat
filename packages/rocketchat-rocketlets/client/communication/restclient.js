export class RocketletRestApiClient {
	constructor(orch) {
		this.orch = orch;
	}

	get(endpoint, params) {
		return this._jqueryCall('GET', endpoint, params);
	}

	_jqueryCall(method, endpoint, params) {
		return new Promise(function _rlRestApiGet(resolve, reject) {
			jQuery.ajax({
				method,
				url: `${ Meteor.absoluteUrl() }api/${ endpoint }`,
				headers: {
					'Content-Type': 'application/json',
					'X-User-Id': localStorage['Meteor.userId'],
					'X-Auth-Token': localStorage['Meteor.loginToken']
				},
				data: params,
				success: function _rlGetSuccess(result) {
					resolve(result);
				},
				error: function _rlGetFailure(xhr, status, errorThrown) {
					reject(new Error(errorThrown));
				}
			});
		});
	}
}
