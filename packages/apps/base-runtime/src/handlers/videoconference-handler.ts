import type { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders/IVideoConfProvider';

import { AppObjectRegistry } from '../AppObjectRegistry';
import { AppAccessorsInstance } from '../lib/accessors/mod';
import { JsonRpcError, type Defined } from '../lib/jsonrpc';
import type { RequestContext } from '../lib/requestContext';
import { wrapComposedApp } from '../lib/wrapAppForRequest';

export default async function videoConferenceHandler(request: RequestContext): Promise<JsonRpcError | Defined> {
	const { method: call, params } = request;
	const { logger } = request.context;

	const [, providerName, methodName] = call.split(':');

	const provider = AppObjectRegistry.get<IVideoConfProvider>(`videoConfProvider:${providerName}`);

	if (!provider) {
		return new JsonRpcError(`Provider ${providerName} not found`, -32000);
	}

	const method = provider[methodName as keyof IVideoConfProvider];

	if (typeof method !== 'function') {
		return JsonRpcError.methodNotFound({
			message: `Method ${methodName} not found on provider ${providerName}`,
		});
	}

	const [videoconf, user, options] = params as Array<unknown>;

	logger.debug(`Executing ${methodName} on video conference provider...`);

	const args = [...(videoconf ? [videoconf] : []), ...(user ? [user] : []), ...(options ? [options] : [])];

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		const result = await (method as Function).apply(wrapComposedApp(provider, request), [
			...args,
			AppAccessorsInstance.getReader(),
			AppAccessorsInstance.getModifier(),
			AppAccessorsInstance.getHttp(),
			AppAccessorsInstance.getPersistence(),
		]);

		logger.debug(`Video Conference Provider's ${methodName} was successfully executed.`);

		return result;
	} catch (e) {
		logger.debug(`Video Conference Provider's ${methodName} was unsuccessful.`);
		return new JsonRpcError(e.message, -32000);
	}
}
