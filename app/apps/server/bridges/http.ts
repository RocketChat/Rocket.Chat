import { HTTP } from 'meteor/http';
import { HttpBridge } from '@rocket.chat/apps-engine/server/bridges/HttpBridge';
import { IHttpResponse, IHttpRequest } from '@rocket.chat/apps-engine/definition/accessors';
import { IHttpBridgeRequestInfo } from '@rocket.chat/apps-engine/server/bridges';

import { AppServerOrchestrator } from '../orchestrator';

type INpmRequestOptions = Pick<IHttpRequest, 'encoding' | 'strictSSL' | 'rejectUnauthorized'> & {
	agentOptions: {
		rejectUnauthorized: boolean | undefined;
	};
};

type iHttpRequestWithOptions = IHttpRequest & {
	npmRequestOptions?: any;
};

/**
 * Normalize the options object to a shape
 * the HTTP.call method recognizes
 *
 * @param Object options Http options received from the engine
 *
 */
function normalizeHttpOptions(options: iHttpRequestWithOptions): void {
	const npmRequestOptions: Partial<INpmRequestOptions> = {};

	if (options.hasOwnProperty('encoding')) {
		npmRequestOptions.encoding = options.encoding;
		delete options.encoding;
	}

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

export class AppHttpBridge extends HttpBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async call(info: IHttpBridgeRequestInfo): Promise<IHttpResponse> {
		if (!info.request.content && typeof info.request.data === 'object') {
			info.request.content = JSON.stringify(info.request.data);
		}

		normalizeHttpOptions(info.request);

		this.orch.debugLog(`The App ${ info.appId } is requesting from the outter webs:`, info);

		try {
			return HTTP.call(info.method, info.url, info.request) as IHttpResponse;
		} catch (e) {
			return e.response;
		}
	}
}
