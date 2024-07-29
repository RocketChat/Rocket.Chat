import { Defined, JsonRpcError } from 'jsonrpc-lite';
import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { IProcessor } from '@rocket.chat/apps-engine/definition/scheduler/IProcessor.ts';

import { AppObjectRegistry } from '../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../lib/accessors/mod.ts';

export default async function handleScheduler(method: string, params: unknown): Promise<Defined | JsonRpcError> {
    const [, processorId] = method.split(':');
    if (!Array.isArray(params)) {
        return JsonRpcError.invalidParams({ message: 'Invalid params' });
    }

    const [context] = params as [Record<string, unknown>];

    const app = AppObjectRegistry.get<App>('app');

    if (!app) {
        return JsonRpcError.internalError({ message: 'App not found' });
    }

    // AppSchedulerManager will append the appId to the processor name to avoid conflicts
    const processor = AppObjectRegistry.get<IProcessor>(`scheduler:${processorId}`);

    if (!processor) {
        return JsonRpcError.methodNotFound({
            message: `Could not find processor for method ${method}`,
        });
    }

    app.getLogger().debug(`Job processor ${processor.id} is being executed...`);

    try {
        await processor.processor(
            context,
            AppAccessorsInstance.getReader(),
            AppAccessorsInstance.getModifier(),
            AppAccessorsInstance.getHttp(),
            AppAccessorsInstance.getPersistence(),
        );

        app.getLogger().debug(`Job processor ${processor.id} was successfully executed`);

        return null;
    } catch (e) {
        app.getLogger().error(e);
        app.getLogger().error(`Job processor ${processor.id} was unsuccessful`);

        return JsonRpcError.internalError({ message: e.message });
    }
}
