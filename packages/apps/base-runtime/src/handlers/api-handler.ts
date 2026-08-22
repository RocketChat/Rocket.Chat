import type { IApiEndpoint } from '@rocket.chat/apps-engine/definition/api/IApiEndpoint';

import { AppObjectRegistry } from '../AppObjectRegistry';
import { AppAccessorsInstance } from '../lib/accessors/mod';
import { JsonRpcError, type Defined } from '../lib/jsonrpc';
import type { RequestContext } from '../lib/requestContext';
import { wrapComposedApp } from '../lib/wrapAppForRequest';

export default async function apiHandler(request: RequestContext): Promise<JsonRpcError | Defined> {
	const { method: call, params } = request;
	const [, /* always "api" */ ...parts] = call.split(':');
	const httpMethod = parts.pop();
	const path = parts.join(':');

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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
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
