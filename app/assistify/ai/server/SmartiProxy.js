import { HTTP } from 'meteor/http';
import { settings } from '../../../settings/server';
import { SystemLogger } from '../../../logger/server';

/** The HTTP methods. */
export const verbs = {
	get: 'GET',
	post: 'POST',
	put: 'PUT',
	delete: 'DELETE',
};

/**
 * The proxy propagates the HTTP requests to Smarti.
 * All HTTP outbound traffic (from Rocket.Chat to Smarti) should pass the this proxy.
 */
export class SmartiProxy {

	static get smartiAuthToken() {
		return settings.get('Assistify_AI_Smarti_Auth_Token');
	}

	static get smartiUrl() {
		return settings.get('Assistify_AI_Smarti_Base_URL');
	}

	/**
	 * Propagates requests to Smarti.
	 * Make sure all requests to Smarti are using this function.
	 *
	 * @param {String} method - the HTTP method to use
	 * @param {String} path - the path to call
	 * @param {Object} [parameters=null] - the http query params (optional)
	 * @param {String} [body=null] - the payload to pass (optional)
	 * @param {Function} onError=null - custom error handler
	 *
	 * @returns {Object}
	 */
	static propagateToSmarti(method, path, parameters = null, body = null, onError = null) {
		const url = `${ SmartiProxy.smartiUrl }${ path }`;
		const header = {
			'X-Auth-Token': SmartiProxy.smartiAuthToken,
			'Content-Type': 'application/json; charset=utf-8',
		};
		try {
			SystemLogger.debug('Sending request to Smarti', method, 'to', url, 'body', JSON.stringify(body));

			const response = HTTP.call(method, url, {
				params: parameters,
				data: body,
				headers: header,
			});

			if (response.statusCode < 400) {
				return response.data || response.content; // .data if it's a json-response
			} else {
				SystemLogger.debug('Got unexpected result from Smarti', method, 'to', url, 'response', JSON.stringify(response));
			}
		} catch (error) {

			if (error && onError) {
				return onError(error);
			}

			SystemLogger.error('Could not complete', method, 'to', url, error.response);
			SystemLogger.debug(error);
			return { error };
		}
	}

	static get googleSearchUrl() {
		return settings.get('Assistify_AI_Google_CS_URL');
	}
	static get googleSearchKey() {
		return settings.get('Assistify_AI_Google_CS_KEY');
	}
	static get googleSearchId() {
		return settings.get('Assistify_AI_Google_CS_ID');
	}

	static propagateToGoogle(method, parameters = null, body = null, onError = null) {
		const url = `${ SmartiProxy.googleSearchUrl }`;
		const header = {
			'Content-Type': 'application/json; charset=utf-8',
			Host: 'www.googleapis.com',
			Origin: 'googleapis.com',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
			'Access-Control-Allow-Headers': 'Authorization',
		};
		try {
			SystemLogger.debug('Sending request to google', method, 'to', url, 'params', parameters);

			parameters.key = SmartiProxy.googleSearchKey;
			parameters.cx = SmartiProxy.googleSearchId;

			const response = HTTP.call(method, url, {
				params: parameters,
				data: body,
				headers: header,
			});

			if (response.statusCode === 200) {
				SystemLogger.debug('response: ', response.data ? response.data : response.content);
				return response.data || response.content; // .data if it's a json-response
			} else {
				SystemLogger.debug('Got unexpected result from google', method, 'to', url, 'response', JSON.stringify(response));
			}
		} catch (error) {

			if (error && onError) {
				return onError(error);
			}

			SystemLogger.error('Could not complete', method, 'to', url, error.response);
			SystemLogger.debug(error);
			return { error };
		}
	}
}
