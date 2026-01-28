import type { IApiEndpoint } from '@rocket.chat/apps-engine/definition/api/IApiEndpoint.ts';
import { Defined, JsonRpcError } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../lib/accessors/mod.ts';
import { RequestContext } from '../lib/requestContext.ts';
import { wrapComposedApp } from '../lib/wrapAppForRequest.ts';

export default async function apiHandler(request: RequestContext): Promise<JsonRpcError | Defined> {
	const { method: call, params } = request;
	const [, path, httpMethod] = call.split(':');

	const endpoint = AppObjectRegistry.get<IApiEndpoint>(`api:${path}`);
	const { logger } = request.context;

	if (!endpoint) {
		return new JsonRpcError(`Endpoint ${path} not found`, -32000);
	}

	const method = endpoint[httpMethod as keyof IApiEndpoint];

	if (typeof method !== 'function') {
		return new JsonRpcError(`${path}'s ${httpMethod} not exists`, -32000);
	}

	const [requestData, endpointInfo] = params as Array<unknown>;

	logger.debug(`${path}'s ${call} is being executed...`, requestData);

	try {
		// deno-lint-ignore ban-types
		const result = await (method as Function).apply(wrapComposedApp(endpoint, request), [
			requestData,
			endpointInfo,
			AppAccessorsInstance.getReader(),
			AppAccessorsInstance.getModifier(),
			AppAccessorsInstance.getHttp(),
			AppAccessorsInstance.getPersistence(),
		]);

		logger.debug(`${path}'s ${call} was successfully executed.`);

		return result;
	} catch (e) {
		logger.debug(`${path}'s ${call} was unsuccessful.`);
		return new JsonRpcError(e.message || 'Internal server error', -32000);
	}
}
