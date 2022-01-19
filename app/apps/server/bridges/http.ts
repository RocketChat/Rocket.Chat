import { fetch } from 'meteor/fetch';
import { HttpBridge } from '@rocket.chat/apps-engine/server/bridges/HttpBridge';
import { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';
import { IHttpBridgeRequestInfo } from '@rocket.chat/apps-engine/server/bridges';

import { AppServerOrchestrator } from '../orchestrator';
import { getUnsafeAgent } from '../../../../server/lib/getUnsafeAgent';

export class AppHttpBridge extends HttpBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async call(info: IHttpBridgeRequestInfo): Promise<IHttpResponse> {
		// begin comptability with old HTTP.call API
		const url = new URL(info.url);

		const { request, method } = info;

		const { headers = {} } = request;

		let { content } = request;

		if (!content && typeof request.data === 'object') {
			content = JSON.stringify(request.data);
			headers['Content-Type'] = 'application/json';
		}

		if (request.auth) {
			if (request.auth.indexOf(':') < 0) {
				throw new Error('auth option should be of the form "username:password"');
			}

			const base64 = Buffer.from(request.auth, 'ascii').toString('base64');
			headers.Authorization = `Basic ${base64}`;
		}

		let paramsForBody;

		if (content || method === 'get' || method === 'head') {
			if (request.params) {
				Object.keys(request.params).forEach((key) => {
					if (request.params?.[key]) {
						url.searchParams.append(key, request.params?.[key]);
					}
				});
			}
		} else {
			paramsForBody = request.params;
		}

		if (paramsForBody) {
			const data = new URLSearchParams();
			Object.entries(paramsForBody).forEach(([key, value]) => {
				data.append(key, value);
			});
			content = data.toString();
			headers['Content-Type'] = 'application/x-www-form-urlencoded';
		}

		// end comptability with old HTTP.call API

		this.orch.debugLog(`The App ${info.appId} is requesting from the outter webs:`, info);

		try {
			const response = await fetch(url.href, {
				method,
				body: content,
				headers,
				...(((request.hasOwnProperty('strictSSL') && !request.strictSSL) ||
					(request.hasOwnProperty('rejectUnauthorized') && request.rejectUnauthorized)) && {
					agent: getUnsafeAgent(url.protocol === 'https:' ? 'https:' : 'http:'),
				}),
			});

			const result: IHttpResponse = {
				url: info.url,
				method: info.method,
				statusCode: response.status,
				headers: Object.fromEntries(response.headers as unknown as any),
			};

			const body = Buffer.from(await response.arrayBuffer());

			if (request.encoding === null) {
				/**
				 * So, here we have a problem. The property is not appropriately typed
				 * in the Apps-Engine. Thus, even though it was  previously supported to
				 * return it as a Buffer. Apps ended up needing to use that same type
				 * assertion you see below.
				 */
				result.content = body as any;
			} else {
				result.content = body.toString(request.encoding);
				result.data = ((): any => {
					try {
						return JSON.parse(result.content);
					} catch {
						return undefined;
					}
				})();
			}

			return result;
		} catch (e) {
			return e.response;
		}
	}
}
