import { HTTP } from 'meteor/http';

/**
 * Normalize the options object to a shape
 * the HTTP.call method recognizes
 *
 * @param Object options Http options received from the engine
 *
 */
function normalizeHttpOptions(options) {
	const npmRequestOptions = {};

	if (options.hasOwnProperty('strictSSL')) {
		npmRequestOptions.strictSSL = options.strictSSL;
		delete options.strictSSL;
	}

	if (options.hasOwnProperty('rejectUnauthorized')) {
		npmRequestOptions.agentOptions = {
			rejectUnauthorized: options.rejectUnauthorized,
		};

		delete options.rejectUnauthorized;
	}

	options.npmRequestOptions = npmRequestOptions;
}

export class AppHttpBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async call(info) {
		if (!info.request.content && typeof info.request.data === 'object') {
			info.request.content = JSON.stringify(info.request.data);
		}

		normalizeHttpOptions(info.request);

		this.orch.debugLog(`The App ${ info.appId } is requesting from the outter webs:`, info);

		try {
			return HTTP.call(info.method, info.url, info.request);
		} catch (e) {
			return e.response;
		}
	}
}
