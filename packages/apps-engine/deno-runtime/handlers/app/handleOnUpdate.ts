import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export default async function handleOnUpdate(params: unknown): Promise<boolean> {
    const app = AppObjectRegistry.get<App>('app');

    if (typeof app?.onUpdate !== 'function') {
        throw new Error('App must contain an onUpdate function', {
            cause: 'invalid_app',
        });
    }

    if (!Array.isArray(params)) {
        throw new Error('Invalid params', { cause: 'invalid_param_type' });
    }

    const [context] = params as [Record<string, unknown>];

    await app.onUpdate(
        context,
        AppAccessorsInstance.getReader(),
        AppAccessorsInstance.getHttp(),
        AppAccessorsInstance.getPersistence(),
        AppAccessorsInstance.getModifier(),
    );

    return true;
}
