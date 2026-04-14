import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { IProcessor } from '@rocket.chat/apps-engine/definition/scheduler/IProcessor.ts';
import { Defined, JsonRpcError } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../lib/accessors/mod.ts';
import { RequestContext } from '../lib/requestContext.ts';
import { wrapAppForRequest } from '../lib/wrapAppForRequest.ts';
import { assertAppAvailable } from './lib/assertions.ts';

export default async function handleScheduler(request: RequestContext): Promise<Defined | JsonRpcError> {
	const { method, params } = request;
	const { logger } = request.context;

	const [, processorId] = method.split(':');
	if (!Array.isArray(params)) {
		return JsonRpcError.invalidParams({ message: 'Invalid params' });
	}

	const [context] = params as [Record<string, unknown>];

	// AppSchedulerManager will append the appId to the processor name to avoid conflicts
	const processor = AppObjectRegistry.get<IProcessor>(`scheduler:${processorId}`);

	if (!processor) {
		return JsonRpcError.methodNotFound({
			message: `Could not find processor for method ${method}`,
		});
	}

	logger.debug({ msg: 'Job processor is being executed...', processorId: processor.id });

	const app = AppObjectRegistry.get<App>('app');

	try {
		assertAppAvailable(app);

		await processor.processor.call(
			// Processor registration doesn't require the App dev to instantiate a class passing
			// a reference to an App object, so we don't have a good way of hijacking the Logger
			// we need.
			// The only way we have to provide a durable Logger instance for the processor is by
			// binding its execution to the proxied App reference itself. Unfortunately, the API
			// ends up being opaque, but there isn't much we can do for now.
			wrapAppForRequest(app, request),
			context,
			AppAccessorsInstance.getReader(),
			AppAccessorsInstance.getModifier(),
			AppAccessorsInstance.getHttp(),
			AppAccessorsInstance.getPersistence(),
		);

		logger.debug({ msg: 'Job processor was successfully executed', processorId: processor.id });

		return null;
	} catch (err) {
		logger.error({ err, msg: 'Job processor was unsuccessful', processorId: processor.id });

		if (err instanceof JsonRpcError) {
			return err;
		}

		return JsonRpcError.internalError({ message: err.message });
	}
}
