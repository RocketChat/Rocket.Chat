import type { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors/index.js';

import type { IHttpBridgeRequestInfo } from '../../../src/server/bridges/index.js';
import { HttpBridge } from '../../../src/server/bridges/index.js';

export class TestsHttpBridge extends HttpBridge {
	public call(info: IHttpBridgeRequestInfo): Promise<IHttpResponse> {
		return Promise.resolve({
			url: info.url,
			method: info.method,
			statusCode: 200,
			headers: info.request.headers,
			content: info.request.content,
		});
	}
}
