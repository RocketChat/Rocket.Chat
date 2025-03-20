import { Defined, JsonRpcError } from 'jsonrpc-lite';
import type { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders/IVideoConfProvider.ts';

import { AppObjectRegistry } from '../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../lib/accessors/mod.ts';
import { Logger } from '../lib/logger.ts';

export default async function videoConferenceHandler(call: string, params: unknown): Promise<JsonRpcError | Defined> {
    const [, providerName, methodName] = call.split(':');

    const provider = AppObjectRegistry.get<IVideoConfProvider>(`videoConfProvider:${providerName}`);
    const logger = AppObjectRegistry.get<Logger>('logger');

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

    logger?.debug(`Executing ${methodName} on video conference provider...`);

    const args = [...(videoconf ? [videoconf] : []), ...(user ? [user] : []), ...(options ? [options] : [])];

    try {
        // deno-lint-ignore ban-types
        const result = await (method as Function).apply(provider, [
            ...args,
            AppAccessorsInstance.getReader(),
            AppAccessorsInstance.getModifier(),
            AppAccessorsInstance.getHttp(),
            AppAccessorsInstance.getPersistence(),
        ]);

        logger?.debug(`Video Conference Provider's ${methodName} was successfully executed.`);

        return result;
    } catch (e) {
        logger?.debug(`Video Conference Provider's ${methodName} was unsuccessful.`);
        return new JsonRpcError(e.message, -32000);
    }
}
