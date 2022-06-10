import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import jQuery from 'jquery';

import { process2faReturn } from '../../../../client/lib/2fa/process2faReturn';
import { baseURI } from '../../../../client/lib/baseURI';

export const APIClient = {
	delete(endpoint, params) {
		return APIClient._jqueryCall('DELETE', endpoint, params);
	},

	get(endpoint, params) {
		return APIClient._jqueryCall('GET', endpoint, params);
	},

	post(endpoint, params, body) {
		if (!body) {
			body = params;
			params = {};
		}

		return APIClient._jqueryCall('POST', endpoint, params, body);
	},

	put(endpoint, params, body) {
		if (!body) {
			body = params;
			params = {};
		}

		return APIClient._jqueryCall('PUT', endpoint, params, body);
	},

	upload(endpoint, params, formData, xhrOptions) {
		if (!formData) {
			formData = params;
			params = {};
		}

		return APIClient._jqueryFormDataCall(endpoint, params, formData, xhrOptions);
	},

	getCredentials() {
		return {
			'X-User-Id': Meteor._localStorage.getItem(Accounts.USER_ID_KEY),
			'X-Auth-Token': Meteor._localStorage.getItem(Accounts.LOGIN_TOKEN_KEY),
		};
	},

	_generateQueryFromParams(params) {
		let query = '';
		if (params && typeof params === 'object') {
			Object.keys(params).forEach((key) => {
				query += query === '' ? '?' : '&';

				if (Array.isArray(params[key])) {
					const encodedParams = params[key].map((value) => encodeURIComponent(value));
					const joinedArray = encodedParams.join(`&${key}[]=`);
					query += `${key}[]=${joinedArray}`;
				} else {
					query += `${key}=${encodeURIComponent(params[key])}`;
				}
			});
		}

		return query;
	},

	_jqueryCall(method, endpoint, params, body, headers = {}, dataType) {
		const query = APIClient._generateQueryFromParams(params);

		return new Promise(function _rlRestApiGet(resolve, reject) {
			jQuery.ajax({
				method,
				url: `${baseURI}api/${endpoint}${query}`,
				headers: Object.assign(
					{
						'Content-Type': 'application/json',
						...APIClient.getCredentials(),
					},
					headers,
				),
				data: JSON.stringify(body),
				dataType,
				success: function _rlGetSuccess(result) {
					resolve(result);
				},
				error: function _rlGetFailure(xhr, status, errorThrown) {
					APIClient.processTwoFactorError({
						xhr,
						params: [method, endpoint, params, body, headers],
						resolve,
						reject,
						originalCallback() {
							const error = new Error(errorThrown);
							error.xhr = xhr;
							reject(error);
						},
					});
				},
			});
		});
	},

	_jqueryFormDataCall(endpoint, params, formData, { progress = () => {}, error = () => {} } = {}) {
		const ret = {};

		const query = APIClient._generateQueryFromParams(params);

		if (!(formData instanceof FormData)) {
			throw new Error('The formData parameter MUST be an instance of the FormData class.');
		}

		ret.promise = new Promise(function _jqueryFormDataPromise(resolve, reject) {
			ret.xhr = jQuery.ajax({
				xhr() {
					const xhr = new window.XMLHttpRequest();

					xhr.upload.addEventListener(
						'progress',
						function (evt) {
							if (evt.lengthComputable) {
								const percentComplete = evt.loaded / evt.total;
								progress(percentComplete * 100);
							}
						},
						false,
					);

					xhr.upload.addEventListener('error', error, false);

					return xhr;
				},
				url: `${baseURI}api/${endpoint}${query}`,
				headers: APIClient.getCredentials(),
				data: formData,
				processData: false,
				contentType: false,
				type: 'POST',
				success: function _jqueryFormDataSuccess(result) {
					resolve(result);
				},
				error: function _jqueryFormDataError(xhr, status, errorThrown) {
					const error = new Error(errorThrown);
					error.xhr = xhr;
					reject(error);
				},
			});
		});

		return ret;
	},

	processTwoFactorError({ xhr, params, originalCallback, resolve, reject }) {
		if (!xhr.responseJSON || !xhr.responseJSON.errorType) {
			return originalCallback();
		}

		process2faReturn({
			error: xhr.responseJSON,
			originalCallback,
			onCode(code, method) {
				const headers = params[params.length - 1];
				headers['x-2fa-code'] = code;
				headers['x-2fa-method'] = method;
				APIClient._jqueryCall(...params)
					.then(resolve)
					.catch(reject);
			},
		});
	},

	v1: {
		delete(endpoint, params) {
			return APIClient.delete(`v1/${endpoint}`, params);
		},

		get(endpoint, params) {
			return APIClient.get(`v1/${endpoint}`, params);
		},

		post(endpoint, params, body) {
			return APIClient.post(`v1/${endpoint}`, params, body);
		},

		upload(endpoint, params, formData) {
			return APIClient.upload(`v1/${endpoint}`, params, formData);
		},

		put(endpoint, params, body) {
			return APIClient.put(`v1/${endpoint}`, params, body);
		},
	},
};
