import { HttpBridge } from '@rocket.chat/apps-engine/server/bridges/HttpBridge';
import type { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';
import type { IHttpBridgeRequestInfo } from '@rocket.chat/apps-engine/server/bridges';

import type { AppServerOrchestrator } from '../orchestrator';
import { fetch } from '../../../../server/lib/http/fetch';

const isGetOrHead = (method: string): boolean => ['GET', 'HEAD'].includes(method.toUpperCase());

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

		if (content || isGetOrHead(method)) {
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

		if (isGetOrHead(method)) {
			content = undefined;
		}

		// end comptability with old HTTP.call API

		this.orch.debugLog(`The App ${info.appId} is requesting from the outter webs:`, info);

		try {
			const response = await fetch(
				url.href,
				{
					method,
					body: content,
					headers,
				},
				(request.hasOwnProperty('strictSSL') && !request.strictSSL) ||
					(request.hasOwnProperty('rejectUnauthorized') && request.rejectUnauthorized),
			);

			const result: IHttpResponse = {
				url: info.url,
				method: info.method,
				statusCode: response.status,
				headers: Object.fromEntries(response.headers as unknown as any),
			};

			const body = Buffer.from(await response.arrayBuffer());

			if (request.encoding === null) {
				/**
				 * The property `content` is not appropriately typed in the
				 * Apps-engine definition, and we can't simply change it there
				 * as it would be a breaking change. Thus, we're left with this
				 * type assertion.
				 */
				result.content = body as any;
			} else {
				result.content = body.toString(request.encoding as BufferEncoding);
				result.data = ((): any => {
					const contentType = (response.headers.get('content-type') || '').split(';')[0];
					if (!['application/json', 'text/javascript', 'application/javascript', 'application/x-javascript'].includes(contentType)) {
						return null;
					}

					try {
						return JSON.parse(result.content);
					} catch {
						return null;
					}
				})();
			}

			return result;
		} catch (e: any) {
			return e.response;
		}
	}
}
